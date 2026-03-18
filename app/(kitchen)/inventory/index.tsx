import { productBatchesApi } from "@/src/apis/product-batches.api";
import { ProductBatch } from "@/src/types/product-batches";
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

const formatDate = (value?: string) => {
  if (!value) {
    return "Không xác định";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleDateString("vi-VN");
};

const getBatchStatus = (status?: string) => {
  const normalized = status?.toUpperCase();

  switch (normalized) {
    case "AVAILABLE":
    case "ACTIVE":
      return { label: "Đang hoạt động", bg: "#E8F5E9", text: "#2E7D32" };
    case "EXPIRED":
      return { label: "Hết hạn", bg: "#FFEBEE", text: "#C62828" };
    case "USED":
    case "DEPLETED":
      return { label: "Đã dùng", bg: "#ECEFF1", text: "#455A64" };
    default:
      return { label: status || "Không rõ", bg: "#F5F5F5", text: "#616161" };
  }
};

export default function KitchenInventoryScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      const data = await productBatchesApi.getProductBatches();
      setBatches(data?.items || []);
    } catch (error) {
      console.warn("Lỗi tải danh sách lô hàng:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi dữ liệu",
        text2: "Không thể lấy danh sách lô hàng",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchBatches().finally(() => setIsLoading(false));
    }, [fetchBatches]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBatches();
    setIsRefreshing(false);
  }, [fetchBatches]);

  const renderBatchItem = ({ item }: { item: ProductBatch }) => {
    const status = getBatchStatus(item.status);
    const quantity =
      item.currentQuantity ??
      item.remainingQuantity ??
      item.availableQuantity ??
      item.quantity ??
      0;
    const batchCode = item.batchCode || item.id;

    return (
      <Card
        style={styles.batchCard}
        mode="elevated"
        onPress={() =>
          router.push(
            `/(kitchen)/inventory/${item.id}?productName=${encodeURIComponent(
              item.productName || "",
            )}&status=${encodeURIComponent(item.status || "")}` as any,
          )
        }
      >
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.batchCodeWrap}>
              <Icon source="package-variant-closed" size={20} color="#7B1FA2" />
              <Text style={styles.batchCode}>{batchCode}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <Icon source="cube-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {item.productName || "Nguyên liệu chưa xác định"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="counter" size={16} color="#666" />
              <Text style={styles.infoText}>
                Số lượng tồn: {quantity} {item.unit || ""}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="calendar-clock" size={16} color="#666" />
              <Text style={styles.infoText}>
                Hạn dùng: {formatDate(item.expiryDate)}
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
        <Appbar.Content title="Kho & Nguyên Liệu" color="#fff" />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải lô hàng...</Text>
        </View>
      ) : batches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon source="package-variant-remove" size={64} color="#C7C7C7" />
          <Text style={styles.emptyText}>Chưa có lô hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item, index) =>
            item.id || item.batchCode || String(index)
          }
          renderItem={renderBatchItem}
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
  batchCard: {
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  batchCodeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  batchCode: {
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
  infoBlock: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4B4B4B",
    flexShrink: 1,
  },
});
