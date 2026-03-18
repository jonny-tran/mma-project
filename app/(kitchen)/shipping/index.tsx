import { pickingTasksApi } from "@/src/apis/picking-tasks.api";
import { PickingTask } from "@/src/types/picking-tasks";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Card,
  Icon,
  Text,
} from "react-native-paper";
import Toast from "react-native-toast-message";

const getStatusColor = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "PENDING":
      return { bg: "#FFF3E0", text: "#E65100", label: "Chờ xuất kho" };
    case "PICKING":
    case "IN_PROGRESS":
      return { bg: "#E3F2FD", text: "#1976D2", label: "Đang xử lý" };
    case "READY":
      return { bg: "#E8F5E9", text: "#2E7D32", label: "Sẵn sàng giao" };
    case "COMPLETED":
    case "DONE":
      return { bg: "#E8F5E9", text: "#388E3C", label: "Đã xuất kho" };
    case "CANCELLED":
      return { bg: "#FFEBEE", text: "#C62828", label: "Đã huỷ" };
    default:
      return { bg: "#F5F5F5", text: "#616161", label: status || "Không rõ" };
  }
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "Không xác định";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleString("vi-VN");
};

export default function KitchenShippingScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<PickingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await pickingTasksApi.getPickingTasks();
      setTasks(data?.items || []);
    } catch (error) {
      console.warn("Lỗi tải danh sách tiến độ & xuất kho:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi dữ liệu",
        text2: "Không thể tải danh sách đơn hàng",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchTasks().finally(() => setIsLoading(false));
    }, [fetchTasks]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);
  }, [fetchTasks]);

  const renderItem = ({ item }: { item: PickingTask }) => {
    const status = getStatusColor(item.status);
    const itemCount =
      item.itemCount || item.pickingItems?.length || item.items?.length || 0;
    const taskId = item.orderId || item.id;

    return (
      <Card
        style={styles.taskCard}
        mode="elevated"
        onPress={() => router.push(`/(kitchen)/shipping/${taskId}` as any)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.idWrap}>
              <Icon source="truck-fast-outline" size={18} color="#2E7D32" />
              <Text style={styles.orderId}>{item.orderId || item.id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon source="store" size={16} color="#666" />
            <Text style={styles.infoText}>
              {item.storeName || item.franchiseName || "Chi nhánh"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon source="package-variant" size={16} color="#666" />
            <Text style={styles.infoText}>Số sản phẩm: {itemCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon source="clock-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Tạo lúc: {formatDateTime(item.createdAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon source="calendar-check" size={16} color="#666" />
            <Text style={styles.infoText}>
              Giao dự kiến: {formatDateTime(item.deliveryDate)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title="Tiến Độ & Xuất Kho" color="#fff" />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon source="truck-remove-outline" size={64} color="#C7C7C7" />
          <Text style={styles.emptyText}>Chưa có đơn hàng cần xuất kho</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  idWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F1F1F",
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#4B4B4B",
    flexShrink: 1,
  },
});
