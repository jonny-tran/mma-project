import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  Divider,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { storeOrderApi } from "@/src/apis/order.api";
import { OrderStatusBadge } from "@/src/components/orders/OrderStatusBadge";
import type { StoreOrder, StoreOrderItem } from "@/src/types/order";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function shortId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function OrderItemRow({ item }: { item: StoreOrderItem }) {
  const qtyReq = Number(item.quantityRequested) || 0;
  const qtyApp = item.quantityApproved != null ? Number(item.quantityApproved) : null;

  return (
    <View style={itemStyles.row}>
      <View style={itemStyles.iconWrap}>
        <MaterialCommunityIcons
          name="package-variant"
          size={20}
          color="#E65100"
        />
      </View>
      <View style={itemStyles.content}>
        <Text variant="titleSmall" style={itemStyles.productName}>
          {item.product?.name ?? `Sản phẩm #${item.productId}`}
        </Text>
        <Text variant="bodySmall" style={itemStyles.sku}>
          SKU: {item.product?.sku ?? "—"}
        </Text>
        <View style={itemStyles.qtyRow}>
          <Text variant="bodySmall" style={itemStyles.qtyLabel}>
            Yêu cầu: <Text style={itemStyles.qtyValue}>{qtyReq}</Text>
          </Text>
          {qtyApp != null ? (
            <Text variant="bodySmall" style={itemStyles.qtyLabel}>
              Duyệt:{" "}
              <Text
                style={[
                  itemStyles.qtyValue,
                  qtyApp < qtyReq ? itemStyles.qtyPartial : itemStyles.qtyFull,
                ]}
              >
                {qtyApp}
              </Text>
            </Text>
          ) : (
            <Text variant="bodySmall" style={itemStyles.qtyLabel}>
              Duyệt: <Text style={itemStyles.qtyPending}>—</Text>
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1, minWidth: 0 },
  productName: { fontWeight: "700", color: "#1a1a1a", fontSize: 14 },
  sku: { color: "#1565C0", marginTop: 2, fontSize: 12 },
  qtyRow: { flexDirection: "row", gap: 16, marginTop: 6 },
  qtyLabel: { color: "#666", fontSize: 12 },
  qtyValue: { fontWeight: "700", color: "#1a1a1a" },
  qtyPartial: { color: "#F57C00" },
  qtyFull: { color: "#2E7D32" },
  qtyPending: { color: "#999" },
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
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết đơn hàng";
        Toast.show({ type: "error", text1: "Lỗi", text2: message });
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" color="#E65100" />
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

  const items = order.items ?? [];
  const hasNote = order.note && order.note.trim().length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Thông tin chung */}
      <Surface style={styles.headerCard} elevation={1}>
        <View style={styles.headerRow}>
          <Text variant="headlineSmall" style={styles.orderId}>
            {shortId(order.id)}
          </Text>
          <OrderStatusBadge status={order.status} />
        </View>
        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={styles.metaLabel}>
            Ngày tạo: {dateFormatter.format(new Date(order.createdAt))}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={styles.metaLabel}>
            Giao dự kiến: {dateOnlyFormatter.format(new Date(order.deliveryDate))}
          </Text>
        </View>
        {order.store && (
          <View style={styles.storeBlock}>
            <Text variant="labelMedium" style={styles.storeLabel}>
              Cửa hàng
            </Text>
            <Text variant="bodySmall" style={styles.storeName}>
              {order.store.name}
            </Text>
            <Text variant="bodySmall" style={styles.storeAddress}>
              {order.store.address}
            </Text>
          </View>
        )}
        {hasNote && (
          <View style={styles.noteBlock}>
            <Text variant="labelMedium" style={styles.noteLabel}>
              Ghi chú
            </Text>
            <Text variant="bodySmall" style={styles.noteText}>
              {order.note}
            </Text>
          </View>
        )}
      </Surface>

      {/* Danh sách sản phẩm */}
      <Surface style={styles.productsCard} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Danh sách sản phẩm ({items.length})
        </Text>
        <Divider style={styles.divider} />
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <OrderItemRow item={item} />
            {index < items.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#888", fontSize: 14 },
  errorText: { color: "#C62828", fontSize: 14 },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  orderId: { fontWeight: "700", color: "#1a1a1a", fontSize: 18 },
  metaRow: { marginTop: 6 },
  metaLabel: { color: "#666", fontSize: 13 },
  storeBlock: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  storeLabel: { color: "#888", fontWeight: "600", marginBottom: 4 },
  storeName: { color: "#1a1a1a", fontWeight: "600" },
  storeAddress: { color: "#666", marginTop: 2, fontSize: 12 },
  noteBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  noteLabel: { color: "#888", fontWeight: "600", marginBottom: 4 },
  noteText: { color: "#666", fontSize: 13 },
  productsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#1a1a1a",
    fontSize: 15,
    marginBottom: 12,
  },
  divider: { marginVertical: 0 },
});
