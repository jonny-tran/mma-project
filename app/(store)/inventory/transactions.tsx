import type { InventoryTransaction } from "@/src/apis/inventory.api";
import { inventoryApi } from "@/src/apis/inventory.api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { FlatList, Platform, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  Chip,
  Text,
} from "react-native-paper";

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  import: { label: "Nhập kho", color: "#2E7D32", icon: "arrow-down-bold" },
  export: { label: "Xuất kho", color: "#C62828", icon: "arrow-up-bold" },
  waste: { label: "Hủy bỏ", color: "#E65100", icon: "delete-outline" },
};

const CARD_SHADOW =
  Platform.OS === "web"
    ? { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }
    : {
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      };

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<string | undefined>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["store-transactions", filter],
    queryFn: () =>
      inventoryApi.fetchStoreTransactions({
        type: filter,
        limit: 50,
      }),
  });

  const rawTransactions = Array.isArray(data) ? data : (data?.items ?? []);
  const transactions = rawTransactions.filter(
    (t) => t.type !== "adjustment"
  );

  const renderItem = ({ item }: { item: InventoryTransaction }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.import;

    return (
      <Card style={[styles.card, CARD_SHADOW]}>
        <Card.Content style={styles.cardContent}>
          <View
            style={[
              styles.typeIconWrap,
              { backgroundColor: cfg.color + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name={cfg.icon as any}
              size={22}
              color={cfg.color}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {item.productName}
            </Text>
            <Text variant="bodySmall" style={styles.batchCode}>
              {item.batchCode}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {new Date(item.createdAt).toLocaleString("vi-VN")}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Chip
              compact
              style={[styles.typeChip, { backgroundColor: cfg.color + "18" }]}
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
      <View style={styles.filterRow}>
        {[undefined, "import", "export", "waste"].map((type) => (
          <Chip
            key={type ?? "all"}
            selected={filter === type}
            onPress={() => setFilter(type)}
            style={[
              styles.filterChip,
              filter === type && styles.filterChipActive,
            ]}
            textStyle={
              filter === type ? styles.filterChipTextActive : styles.filterChipText
            }
            compact
          >
            {type ? TYPE_CONFIG[type].label : "Tất cả"}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) =>
            item?.id != null ? String(item.id) : `tx-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name="history"
                  size={56}
                  color="#ddd"
                />
              </View>
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              <Text style={styles.emptySubtext}>
                Giao dịch nhập/xuất kho sẽ hiển thị tại đây
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterChip: {
    backgroundColor: "#F5F5F5",
  },
  filterChipActive: {
    backgroundColor: "#E65100",
  },
  filterChipText: {
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontWeight: "700",
    color: "#1a1a1a",
    fontSize: 15,
  },
  batchCode: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  date: {
    color: "#999",
    fontSize: 11,
    marginTop: 4,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  typeChip: {
    borderWidth: 0,
  },
  typeChipText: {
    fontWeight: "700",
    fontSize: 11,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyText: {
    color: "#555",
    fontWeight: "700",
    fontSize: 16,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 13,
  },
});
