import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  Appbar,
  Card,
  Chip,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/src/apis/inventory.api";
import type { InventoryTransaction } from "@/src/apis/inventory.api";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  import: { label: "Nhập kho", color: "#2E7D32", icon: "arrow-down-bold" },
  export: { label: "Xuất kho", color: "#C62828", icon: "arrow-up-bold" },
  waste: { label: "Hủy bỏ", color: "#E65100", icon: "delete-outline" },
  adjustment: { label: "Điều chỉnh", color: "#1565C0", icon: "swap-horizontal" },
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<string | undefined>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["store-transactions", filter],
    queryFn: () =>
      inventoryApi.fetchStoreTransactions({
        type: filter,
        limit: 50,
      }),
  });

  const transactions = Array.isArray(data) ? data : (data?.items ?? []);

  const renderItem = ({ item }: { item: InventoryTransaction }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.adjustment;
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <IconButton
            icon={cfg.icon}
            iconColor={cfg.color}
            size={24}
            style={[styles.typeIcon, { backgroundColor: cfg.color + "15" }]}
          />
          <View style={styles.cardInfo}>
            <Text variant="bodyMedium" style={styles.productName}>
              {item.productName}
            </Text>
            <Text variant="bodySmall" style={styles.batchCode}>
              {item.batchCode}
            </Text>
            <Text variant="labelSmall" style={styles.date}>
              {new Date(item.createdAt).toLocaleString("vi-VN")}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text
              variant="titleMedium"
              style={[styles.qty, { color: cfg.color }]}
            >
              {item.type === "import" ? "+" : "-"}
              {item.quantity}
            </Text>
            <Chip
              compact
              style={[styles.typeChip, { borderColor: cfg.color }]}
              textStyle={[styles.typeChipText, { color: cfg.color }]}
            >
              {cfg.label}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Lịch sử kho" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.filterRow}>
        {[undefined, "import", "export", "waste"].map((type) => (
          <Chip
            key={type ?? "all"}
            selected={filter === type}
            onPress={() => setFilter(type)}
            style={[styles.filterChip, filter === type && styles.filterChipActive]}
            textStyle={filter === type ? styles.filterChipTextActive : undefined}
            compact
          >
            {type ? TYPE_CONFIG[type].label : "Tất cả"}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color="#E65100" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconButton icon="history" size={80} iconColor="#ddd" />
              <Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterChip: { backgroundColor: "#f5f5f5" },
  filterChipActive: { backgroundColor: "#E65100" },
  filterChipTextActive: { color: "#fff", fontWeight: "700" },
  listContent: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 10, borderRadius: 12, backgroundColor: "#fff" },
  cardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  typeIcon: { margin: 0, borderRadius: 10 },
  cardInfo: { flex: 1 },
  productName: { fontWeight: "600", color: "#333" },
  batchCode: { color: "#888" },
  date: { color: "#aaa", marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  qty: { fontWeight: "700" },
  typeChip: { borderWidth: 1, backgroundColor: "transparent" },
  typeChipText: { fontWeight: "700", fontSize: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: { textAlign: "center", color: "#999", fontSize: 14 },
});
