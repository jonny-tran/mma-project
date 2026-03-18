import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  Appbar,
  Card,
  Chip,
  ActivityIndicator,
  Searchbar,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/src/apis/inventory.api";
import type { InventoryItem } from "@/src/types/shipment";

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
      { productId: number; productName: string; sku: string; imageUrl: string; totalQty: number; batches: InventoryItem[] }
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

  const renderItem = ({ item }: { item: (typeof grouped)[0] }) => {
    const nearestExpiry = item.batches.reduce((min, b) => {
      const d = new Date(b.expiryDate).getTime();
      return d < min ? d : min;
    }, Infinity);
    const daysLeft = Math.ceil(
      (nearestExpiry - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text variant="titleMedium" style={styles.productName}>
                {item.productName}
              </Text>
              <Text variant="bodySmall" style={styles.sku}>
                SKU: {item.sku}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text variant="headlineSmall" style={styles.totalQty}>
                {item.totalQty}
              </Text>
              <Text variant="labelSmall" style={styles.unitLabel}>
                tổng
              </Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            <Chip compact icon="package-variant" style={styles.batchChip}>
              {item.batches.length} lô
            </Chip>
            {daysLeft <= 3 && daysLeft >= 0 && (
              <Chip
                compact
                icon="alert"
                style={styles.expiryChip}
                textStyle={styles.expiryChipText}
              >
                Sắp hết hạn ({daysLeft}d)
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Tồn kho cửa hàng" titleStyle={styles.headerTitle} />
        <Appbar.Action
          icon="history"
          onPress={() => router.push("/inventory/transactions" as any)}
        />
      </Appbar.Header>

      <View style={styles.searchBox}>
        <Searchbar
          placeholder="Tìm sản phẩm..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
      </View>

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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconButton icon="package-variant-closed" size={80} iconColor="#ddd" />
              <Text style={styles.emptyText}>
                Chưa có hàng tồn kho.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { backgroundColor: "#fff" },
  headerTitle: { fontWeight: "700" },
  searchBox: { padding: 16, paddingBottom: 8, backgroundColor: "#fff" },
  searchbar: { backgroundColor: "#f5f5f5", elevation: 0 },
  searchInput: { fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: "#fff" },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: { flex: 1 },
  productName: { fontWeight: "700", color: "#333" },
  sku: { color: "#888", marginTop: 2 },
  cardRight: { alignItems: "center", marginLeft: 12 },
  totalQty: { fontWeight: "700", color: "#E65100" },
  unitLabel: { color: "#888" },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  batchChip: { backgroundColor: "#F5F5F5" },
  expiryChip: { backgroundColor: "#FFEBEE" },
  expiryChipText: { color: "#C62828", fontWeight: "700", fontSize: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: { textAlign: "center", color: "#999", fontSize: 14, marginTop: 8 },
});
