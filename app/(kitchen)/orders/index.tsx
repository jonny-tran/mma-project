import { pickingTasksApi } from "@/src/apis/picking-tasks.api";
import { PickingTask } from "@/src/types/picking-tasks";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  Appbar,
  Card,
  Icon,
  Text,
  ActivityIndicator,
  Chip,
  Surface,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "expo-router";

export default function KitchenOrdersScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<PickingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await pickingTasksApi.getPickingTasks();
      setTasks(data?.items || []);
    } catch (error) {
      console.warn("Lỗi tải danh sách phiếu nhặt hàng:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi dữ liệu",
        text2: "Không thể lấy danh sách phiếu nhặt hàng",
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchTasks().finally(() => setIsLoading(false));
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
      case "APPROVED":
        return { bg: "#FFF3E0", text: "#E65100" };
      case "PICKING":
      case "IN_PROGRESS":
        return { bg: "#E3F2FD", text: "#1976D2" };
      case "READY":
        return { bg: "#E8F5E9", text: "#2E7D32" };
      case "COMPLETED":
        return { bg: "#E8F5E9", text: "#388E3C" };
      case "CANCELLED":
        return { bg: "#FFEBEE", text: "#D32F2F" };
      default:
        return { bg: "#F5F5F5", text: "#616161" };
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING": 
      case "APPROVED": return "Chờ xử lý";
      case "PICKING": 
      case "IN_PROGRESS": return "Đang nhặt hàng";
      case "READY": return "Sẵn sàng giao";
      case "COMPLETED": return "Hoàn thành";
      case "CANCELLED": return "Đã huỷ";
      default: return status || "Không rõ";
    }
  };

  const renderTaskItem = ({ item }: { item: PickingTask }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <Card
        style={styles.taskCard}
        mode="elevated"
        onPress={() => router.push(`/(kitchen)/orders/${item.id}` as any)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdContainer}>
              <Icon source="clipboard-text" size={20} color="#E65100" />
              <Text style={styles.orderIdText} numberOfLines={1} ellipsizeMode="tail">
                {item.orderId || item.id}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Icon source="store" size={16} color="#666" />
              <Text style={styles.infoText}>
                {item.storeName || item.franchiseName || "Hệ thống Bếp"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="clock-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Chưa xác định"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="package-variant" size={16} color="#666" />
              <Text style={styles.infoText}>
                Số lượng món: {item.itemCount || item.pickingItems?.length || item.items?.length || 0}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title="Đơn Đặt Hàng" color="#fff" />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon source="clipboard-text-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có đơn đặt hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#E65100"]}
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
    fontSize: 16,
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  taskCard: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4A4A4A",
  },
});
