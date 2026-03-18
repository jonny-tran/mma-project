import React from "react";
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
import { claimApi } from "@/src/apis/claim.api";
import type { Claim, ClaimStatus } from "@/src/types/shipment";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Chờ xử lý", color: "#E65100", icon: "clock-outline" },
  approved: { label: "Đã duyệt", color: "#2E7D32", icon: "check-circle-outline" },
  rejected: { label: "Từ chối", color: "#C62828", icon: "close-circle-outline" },
};

export default function ClaimsScreen() {
  const router = useRouter();

  const { data: claims, isLoading, refetch } = useQuery({
    queryKey: ["my-claims"],
    queryFn: () => claimApi.fetchMyClaims(),
  });

  const renderItem = ({ item }: { item: Claim }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    return (
      <Card
        style={styles.card}
        onPress={() => router.push(`/claims/${item.id}` as any)}
      >
        <Card.Content>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text variant="titleMedium" style={styles.claimId}>
                #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            <Chip
              icon={cfg.icon}
              compact
              style={[styles.statusChip, { borderColor: cfg.color }]}
              textStyle={[styles.statusText, { color: cfg.color }]}
            >
              {cfg.label}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.itemCount}>
            {item.items?.length ?? 0} mặt hàng khiếu nại
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Khiếu nại của tôi" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={Array.isArray(claims) ? claims : []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconButton icon="clipboard-check-outline" size={80} iconColor="#ddd" />
              <Text style={styles.emptyText}>Chưa có khiếu nại nào.</Text>
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
  listContent: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: "#fff" },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: { flex: 1 },
  claimId: { fontWeight: "700", color: "#333" },
  date: { color: "#888", marginTop: 2 },
  statusChip: { borderWidth: 1, backgroundColor: "transparent" },
  statusText: { fontWeight: "700", fontSize: 11 },
  itemCount: { color: "#666", marginTop: 8 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: { textAlign: "center", color: "#999", fontSize: 14 },
});
