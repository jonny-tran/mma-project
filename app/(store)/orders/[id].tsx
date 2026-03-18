import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  Divider,
  List,
  Text,
} from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { storeOrderApi } from "@/src/apis/order.api";
import { OrderStatusBadge } from "@/src/components/orders/OrderStatusBadge";
import type { StoreOrder } from "@/src/types/order";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await storeOrderApi.getOrderDetail(id);
        setOrder(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng";
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Không tìm thấy đơn hàng
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Text variant="headlineSmall" style={styles.orderCode}>
              {order.orderCode}
            </Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <Text variant="bodySmall" style={styles.dateText}>
            Ngày tạo: {dateFormatter.format(new Date(order.createdAt))}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Danh sách sản phẩm ({order.totalItems})
          </Text>
          <Divider style={styles.divider} />
          {order.items.map((item, index) => (
            <View key={`${item.productId}-${index}`}>
              <List.Item
                title={item.productName ?? `Sản phẩm #${item.productId}`}
                description={() => (
                  <View style={styles.itemMeta}>
                    <Text variant="bodySmall" style={styles.itemUnit}>
                      {item.unit ?? "—"}
                    </Text>
                    <Text variant="bodySmall">
                      Yêu cầu:{" "}
                      <Text style={styles.boldText}>
                        {item.quantityRequested}
                      </Text>
                    </Text>
                    {item.quantityApproved != null ? (
                      <Text variant="bodySmall">
                        Duyệt:{" "}
                        <Text
                          style={[
                            styles.boldText,
                            item.quantityApproved < item.quantityRequested
                              ? styles.partialText
                              : styles.fullText,
                          ]}
                        >
                          {item.quantityApproved}
                        </Text>
                      </Text>
                    ) : null}
                  </View>
                )}
                left={(props) => (
                  <List.Icon {...props} icon="package-variant-closed" />
                )}
              />
              {index < order.items.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#666",
  },
  errorText: {
    color: "#C62828",
  },
  card: {
    backgroundColor: "#fff",
  },
  headerContent: {
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCode: {
    fontWeight: "700",
  },
  dateText: {
    color: "#888",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  divider: {
    marginVertical: 4,
  },
  itemMeta: {
    gap: 2,
    marginTop: 4,
  },
  itemUnit: {
    color: "#1565C0",
    fontWeight: "600",
  },
  boldText: {
    fontWeight: "700",
  },
  partialText: {
    color: "#F57C00",
  },
  fullText: {
    color: "#2E7D32",
  },
});
