import { pickingTasksApi } from "@/src/apis/picking-tasks.api";
import { PickingTask, PickingTaskItem } from "@/src/types/picking-tasks";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Card,
  Icon,
  Text,
  Divider,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "expo-router";

interface AggregatedItem {
  productId: string | number;
  productName: string;
  totalRequiredQty: number;
  totalQuantity: number;
  unit: string;
  tasksCount: number;
}

export default function KitchenProductionPlanScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AggregatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAndAggregateTasks = async () => {
    try {
      // 1. Fetch all tasks (can pass status=PENDING/PICKING if API supports it, here we filter locally to be safe)
      const data = await pickingTasksApi.getPickingTasks();
      const allTasks: PickingTask[] = data?.items || [];
      
      // 2. Filter tasks that need production/picking
      const activeTasks = allTasks.filter(task => {
        const s = task.status?.toUpperCase();
        return s === 'PENDING' || s === 'APPROVED' || s === 'PICKING' || s === 'IN_PROGRESS';
      });
      
      // 3. Fetch details for all active tasks to get their items
      const tasksWithDetails = await Promise.all(
        activeTasks.map(task => pickingTasksApi.getPickingTaskById(task.id))
      );
      
      // 4. Aggregate items from detailed tasks
      const itemMap = new Map<string | number, AggregatedItem>();
      
      tasksWithDetails.forEach(task => {
        const taskItems = task.items || task.pickingItems || [];
        taskItems.forEach(item => {
          const key = item.productId || item.name || "unknown";
          
          if (itemMap.has(key)) {
            const existing = itemMap.get(key)!;
            existing.totalRequiredQty += (item.requiredQty || item.quantity || 0);
            existing.totalQuantity += (item.quantity || 0);
            existing.tasksCount += 1;
            itemMap.set(key, existing);
          } else {
            itemMap.set(key, {
              productId: key,
              productName: item.productName || item.name || `Món hàng ${key}`,
              totalRequiredQty: item.requiredQty || item.quantity || 0,
              totalQuantity: item.quantity || 0,
              unit: item.unit || "đơn vị",
              tasksCount: 1,
            });
          }
        });
      });
      
      // Convert map to array and sort descending by quantity
      const aggregatedArray = Array.from(itemMap.values()).sort(
        (a, b) => b.totalRequiredQty - a.totalRequiredQty
      );
      
      setItems(aggregatedArray);
    } catch (error) {
      console.warn("Lỗi tính toán kế hoạch sản xuất:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi dữ liệu",
        text2: "Không thể lấy danh sách sản xuất",
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchAndAggregateTasks().finally(() => setIsLoading(false));
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAndAggregateTasks();
    setIsRefreshing(false);
  }, []);

  const renderItem = ({ item, index }: { item: AggregatedItem; index: number }) => (
    <Card style={styles.itemCard} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Icon source="pot-mix" size={24} color="#0288D1" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Text style={styles.itemSubText}>Có mặt trong {item.tasksCount} đơn hàng</Text>
        </View>
        <View style={styles.itemQtyContainer}>
          <Text style={styles.qtyHighlight}>{item.totalRequiredQty}</Text>
          <Text style={styles.unitText}>{item.unit}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#0288D1" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title="Kế Hoạch Sản Xuất" color="#fff" />
      </Appbar.Header>

      {/* Header Info */}
      <View style={styles.infoBanner}>
        <Icon source="information" size={20} color="#0288D1" />
        <Text style={styles.infoBannerText}>
          Dữ liệu được tổng hợp từ các đơn hàng đang chờ hoặc đang soạn (Pending/Picking).
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Đang tổng hợp dữ liệu...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon source="checkbox-marked-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Tuyệt vời! Không có món nào cần sản xuất lúc này.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.productId}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#0288D1"]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#E1F5FE",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#0288D1",
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },
  emptyText: {
    color: "#888",
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    backgroundColor: "#E1F5FE",
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  itemSubText: {
    fontSize: 13,
    color: "#666",
  },
  itemQtyContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  qtyHighlight: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0288D1",
  },
  unitText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
