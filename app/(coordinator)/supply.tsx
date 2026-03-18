import { orderApi } from "@/src/apis/order.api";
import { OrderSummary } from "@/src/types/order";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Card,
  Icon,
  Text,
  useTheme,
} from "react-native-paper";
import Toast from "react-native-toast-message";

// Định nghĩa cấu hình màu sắc và text cho các trạng thái
const ORDER_STATUS_CONFIG: Record<string, { color: string; bg: string; text: string }> = {
  pending: { color: "#BB4D00", bg: "#FEF3C6", text: "Đang chờ" },
  approved: { color: "#008236", bg: "#DBFCE7", text: "Đã duyệt" },
  rejected: { color: "#C10007", bg: "#FFE2E2", text: "Đã từ chối" },
  delivering: { color: "#1447E6", bg: "#DBEAFE", text: "Đang giao" },
  in_transit: { color: "#1447E6", bg: "#DBEAFE", text: "Đang vận chuyển" },
  transit: { color: "#1447E6", bg: "#DBEAFE", text: "Đang vận chuyển" },
  cancelled: { color: "#616161", bg: "#E0E0E0", text: "Đã hủy" },
  delivered: { color: "#616161", bg: "#E0E0E0", text: "Đã giao" },
  picking: { color: "#616161", bg: "#E0E0E0", text: "Đang lấy hàng" },
  completed: { color: "#616161", bg: "#E0E0E0", text: "Hoàn tất" },
  claimed: { color: "#616161", bg: "#E0E0E0", text: "Đã khiếu nại" },
};

const FILTER_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "delivering",
  "in_transit",
  "delivered",
  "cancelled",
  "completed",
];

export default function CoordinatorOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const fetchOrders = async () => {
    try {
      const data = await orderApi.list();
      setOrders(data?.items || []);
    } catch (error: any) {
      console.warn("Lỗi tải danh sách đơn hàng:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi hệ thống",
        text2: error?.message || "Không thể lấy danh sách đơn hàng",
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchOrders().finally(() => setIsLoading(false));
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  }, []);

  // Lọc dữ liệu theo trạng thái
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (selectedStatuses.length === 0) return orders;
    return orders.filter((order) => selectedStatuses.includes(order.status));
  }, [orders, selectedStatuses]);

  const renderFilterChips = () => (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContainer}
      >
        {FILTER_STATUSES.map((status) => {
          const config = ORDER_STATUS_CONFIG[status];
          if (!config) return null;
          const isActive = selectedStatuses.includes(status);

          return (
            <TouchableOpacity
              key={status}
              onPress={() => toggleStatus(status)}
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: config.bg,
                  borderColor: config.color,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && { color: config.color, fontWeight: "bold" },
                ]}
              >
                {config.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderOrderItem = ({ item }: { item: OrderSummary }) => {
    const config = ORDER_STATUS_CONFIG[item.status] || {
      bg: "#F5F5F5",
      color: "#616161",
      text: item.status || "Không rõ",
    };

    return (
      <Card
        style={styles.orderCard}
        mode="elevated"
        onPress={() => router.push(`/(coordinator)/orderId?orderId=${item.id}` as any)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdContainer}>
              <Icon source="clipboard-text" size={20} color={theme.colors.primary} />
              <Text style={styles.orderIdText} numberOfLines={1} ellipsizeMode="tail">
                {item.id}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.text}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Icon source="store" size={16} color="#666" />
              <Text style={styles.infoText}>
                {item.store?.name || "Cửa hàng không xác định"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="calendar-clock" size={16} color="#666" />
              <Text style={styles.infoText}>
                Tạo lúc: {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—"}
              </Text>
            </View>
            {item.deliveryDate && (
              <View style={styles.infoRow}>
                <Icon source="truck-delivery-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Ngày giao: {new Date(item.deliveryDate).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title="Quản lý Đơn hàng Supply" color="#fff" />
      </Appbar.Header>

      <View style={styles.headerDescription}>
        <Text style={styles.descriptionText}>
          Phê duyệt, từ chối và theo dõi trạng thái đơn hàng cho vai trò điều phối viên.
        </Text>
      </View>

      {renderFilterChips()}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon source="clipboard-text-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#1565C0"]}
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
  headerDescription: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6b7280",
  },
  filterScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    color: "#616161",
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
  orderCard: {
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
