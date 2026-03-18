import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { storeOrderApi } from "@/src/apis/order.api";
import { OrderStatusBadge } from "@/src/components/orders/OrderStatusBadge";
import type { OrderStatus, StoreOrder } from "@/src/types/order";
import { STATUS_FILTER_OPTIONS } from "@/src/constants/order-status";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const deliveryDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function shortId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export default function OrderHistoryScreen() {
  const { push } = useRouter();

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(
    async (pageNum: number, replace: boolean) => {
      try {
        if (replace) setLoading(true);
        else setLoadingMore(true);

        const params: { page: number; limit: number; status?: OrderStatus } = {
          page: pageNum,
          limit: 15,
        };
        if (statusFilter !== "all") {
          params.status = statusFilter as OrderStatus;
        }

        const data = await storeOrderApi.getMyOrders(params);
        setOrders((prev) =>
          replace ? data.items : [...prev, ...data.items]
        );
        setTotalPages(data.meta.totalPages);
        setPage(pageNum);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải đơn hàng";
        Toast.show({ type: "error", text1: "Lỗi", text2: message });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchOrders(1, true);
  }, [fetchOrders]);

  const handleEndReached = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      fetchOrders(page + 1, false);
    }
  }, [loadingMore, page, totalPages, fetchOrders]);

  const renderItem = useCallback(
    ({ item }: { item: StoreOrder }) => (
      <Pressable onPress={() => push(`/orders/${item.id}`)}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={22}
                  color="#E65100"
                />
              </View>
              <View style={styles.cardInfo}>
                <Text variant="titleSmall" style={styles.orderId}>
                  {shortId(item.id)}
                </Text>
                <Text variant="bodySmall" style={styles.storeName} numberOfLines={1}>
                  {item.store?.name ?? "—"}
                </Text>
                <Text variant="bodySmall" style={styles.dateText}>
                  Tạo: {dateFormatter.format(new Date(item.createdAt))}
                </Text>
              </View>
              <OrderStatusBadge status={item.status} />
            </View>
            <View style={styles.cardBottom}>
              <Text variant="bodySmall" style={styles.deliveryText}>
                Giao dự kiến: {deliveryDateFormatter.format(new Date(item.deliveryDate))}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Pressable>
    ),
    [push]
  );

  const keyExtractor = useCallback((item: StoreOrder) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const active = statusFilter === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setStatusFilter(opt.value)}
              style={[styles.filterTab, active && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  active && styles.filterTabTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={64}
                color="#ddd"
              />
              <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator animating size="small" color="#E65100" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexWrap: "wrap",
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
  },
  filterTabActive: { backgroundColor: "#E65100" },
  filterTabText: { color: "#666", fontSize: 12, fontWeight: "500" },
  filterTabTextActive: { color: "#fff", fontWeight: "700" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#888", fontSize: 14 },
  listContent: { padding: 12, gap: 10, paddingBottom: 32 },
  card: { borderRadius: 14, backgroundColor: "#fff", elevation: 1 },
  cardContent: { gap: 10 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: { flex: 1, minWidth: 0 },
  orderId: { fontWeight: "700", color: "#1a1a1a", fontSize: 14 },
  storeName: { color: "#555", marginTop: 2, fontSize: 13 },
  dateText: { color: "#888", marginTop: 2, fontSize: 12 },
  cardBottom: { marginLeft: 54 },
  deliveryText: { color: "#666", fontSize: 12 },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: { color: "#999", fontSize: 14 },
  footer: { padding: 16, alignItems: "center" },
});
