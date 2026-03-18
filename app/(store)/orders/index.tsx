import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  SegmentedButtons,
  Text,
} from "react-native-paper";
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
        setOrders((prev) => (replace ? data.items : [...prev, ...data.items]));
        setTotalPages(data.meta.totalPages);
        setPage(pageNum);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải đơn hàng";
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: message,
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    fetchOrders(1, true);
  }, [fetchOrders]);

  const handleEndReached = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      fetchOrders(page + 1, false);
    }
  }, [loadingMore, page, totalPages, fetchOrders]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: StoreOrder }) => (
      <Pressable onPress={() => push(`/orders/${item.id}`)}>
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text variant="titleSmall" style={styles.orderCode}>
                {item.orderCode}
              </Text>
              <OrderStatusBadge status={item.status} />
            </View>
            <View style={styles.cardMeta}>
              <Text variant="bodySmall" style={styles.metaText}>
                {dateFormatter.format(new Date(item.createdAt))}
              </Text>
              <Text variant="bodySmall" style={styles.metaText}>
                {item.totalItems} sản phẩm
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Pressable>
    ),
    [push],
  );

  const keyExtractor = useCallback((item: StoreOrder) => item.id, []);

  const segmentButtons = STATUS_FILTER_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={handleStatusChange}
          buttons={segmentButtons}
          density="small"
          style={styles.segmented}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" />
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
            <View style={styles.centered}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Chưa có đơn hàng nào
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator animating size="small" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 32,
  },
  loadingText: {
    color: "#666",
  },
  filterContainer: {
    padding: 12,
    backgroundColor: "#fff",
  },
  segmented: {
    flexWrap: "wrap",
  },
  listContent: {
    padding: 12,
    gap: 8,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
  },
  cardContent: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCode: {
    fontWeight: "700",
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    color: "#888",
  },
  emptyText: {
    color: "#999",
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
});
