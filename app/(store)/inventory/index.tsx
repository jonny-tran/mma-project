import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Searchbar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { inventoryApi } from "@/src/apis/inventory.api";
import type { InventoryItem } from "@/src/types/shipment";

const CARD_SHADOW =
  Platform.OS === "web"
    ? { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }
    : { elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 };

export default function InventoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const {
    data: inventory,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["store-inventory", search],
    queryFn: () => inventoryApi.fetchStoreInventory(search || undefined),
  });

  const grouped = React.useMemo(() => {
    if (!inventory || !Array.isArray(inventory)) return [];
    const map = new Map<
      number,
      {
        productId: number;
        productName: string;
        sku: string;
        imageUrl: string;
        totalQty: number;
        batches: InventoryItem[];
      }
    >();
    for (const item of inventory) {
      const existing = map.get(item.productId);
      if (existing) {
        existing.totalQty += item.quantity;
        existing.batches.push(item);
      } else {
        map.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          imageUrl: item.imageUrl,
          totalQty: item.quantity,
          batches: [item],
        });
      }
    }
    return Array.from(map.values());
  }, [inventory]);

  const totalBatches = grouped.reduce((sum, g) => sum + g.batches.length, 0);

  const renderItem = ({ item }: { item: (typeof grouped)[0] }) => {
    const nearestExpiry = item.batches.reduce((min, b) => {
      const d = new Date(b.expiryDate).getTime();
      return d < min ? d : min;
    }, Infinity);
    const daysLeft = Math.ceil(
      (nearestExpiry - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;

    return (
        <Card style={[styles.card, CARD_SHADOW]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={24}
                  color="#E65100"
                />
              </View>
              <View style={styles.cardInfo}>
                <Text variant="titleMedium" style={styles.productName}>
                  {item.productName}
                </Text>
                <Text variant="bodySmall" style={styles.sku}>
                  {item.sku}
                </Text>
                <View style={styles.chipRow}>
                  <Chip
                    compact
                    icon="layers-outline"
                    style={styles.batchChip}
                    textStyle={styles.batchChipText}
                  >
                    {item.batches.length} lô
                  </Chip>
                  {isExpiringSoon && (
                    <Chip
                      compact
                      icon="clock-alert-outline"
                      style={[
                        styles.expiryChip,
                        daysLeft <= 3 && styles.expiryChipUrgent,
                      ]}
                      textStyle={[
                        styles.expiryChipText,
                        daysLeft <= 3 && styles.expiryChipTextUrgent,
                      ]}
                    >
                      {daysLeft <= 0 ? "Hết hạn" : `${daysLeft} ngày`}
                    </Chip>
                  )}
                </View>
              </View>
              <View style={styles.qtyWrap}>
                <Text style={styles.qtyNumber}>{item.totalQty}</Text>
                <Text style={styles.qtyLabel}>tổng</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Tìm sản phẩm theo tên hoặc SKU..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#E65100"
        />
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push("/inventory/transactions" as any)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="history"
            size={24}
            color="#E65100"
          />
          <Text style={styles.historyLabel}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      {grouped.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={20}
              color="#E65100"
            />
            <Text style={styles.statValue}>{grouped.length}</Text>
            <Text style={styles.statLabel}>Sản phẩm</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="layers-outline"
              size={20}
              color="#2E7D32"
            />
            <Text style={styles.statValue}>{totalBatches}</Text>
            <Text style={styles.statLabel}>Lô hàng</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải tồn kho...</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.productId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={56}
                  color="#ddd"
                />
              </View>
              <Text style={styles.emptyTitle}>Chưa có hàng tồn kho</Text>
              <Text style={styles.emptyText}>
                Sản phẩm sẽ hiển thị tại đây sau khi nhập kho
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchbar: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    elevation: 0,
    height: 48,
    borderRadius: 14,
  },
  searchInput: { fontSize: 15 },
  historyBtn: {
    width: 56,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  historyLabel: { fontSize: 10, color: "#E65100", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#eee",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  statLabel: { fontSize: 12, color: "#666" },
  listContent: { padding: 16, paddingBottom: 32, gap: 12 },
  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  cardContent: { padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: { flex: 1, minWidth: 0 },
  productName: { fontWeight: "700", color: "#1a1a1a", fontSize: 15 },
  sku: { color: "#888", marginTop: 2, fontSize: 12 },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  batchChip: { backgroundColor: "#F5F5F5" },
  batchChipText: { fontSize: 11 },
  expiryChip: { backgroundColor: "#FFF8E1" },
  expiryChipText: { color: "#F57C00", fontWeight: "600", fontSize: 11 },
  expiryChipUrgent: { backgroundColor: "#FFEBEE" },
  expiryChipTextUrgent: { color: "#C62828" },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  qtyNumber: { fontSize: 24, fontWeight: "800", color: "#E65100" },
  qtyLabel: { fontSize: 11, color: "#888", marginRight: 4 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#888", fontSize: 14 },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#555", marginBottom: 8 },
  emptyText: { color: "#999", fontSize: 14, textAlign: "center" },
});
