import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { claimApi } from "@/src/apis/claim.api";
import type { Claim } from "@/src/types/shipment";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: {
    label: "Chờ xử lý",
    color: "#E65100",
    bg: "#FFF3E0",
    icon: "clock-outline",
  },
  approved: {
    label: "Đã duyệt",
    color: "#2E7D32",
    bg: "#E8F5E9",
    icon: "check-circle-outline",
  },
  rejected: {
    label: "Từ chối",
    color: "#C62828",
    bg: "#FFEBEE",
    icon: "close-circle-outline",
  },
};

export default function ClaimsScreen() {
  const router = useRouter();

  const {
    data: claims,
    isLoading,
    refetch,
  } = useQuery({
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
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={20}
                color="#6A1B9A"
              />
            </View>
            <View style={styles.cardInfo}>
              <Text variant="titleSmall" style={styles.claimId}>
                #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            <Chip
              icon={cfg.icon}
              compact
              style={[styles.statusChip, { backgroundColor: cfg.bg }]}
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
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={64}
                color="#ddd"
              />
              <Text style={styles.emptyText}>Chưa có khiếu nại nào.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  listContent: { padding: 16, paddingBottom: 32, gap: 10 },
  card: { borderRadius: 14, backgroundColor: "#fff", elevation: 1 },
  cardContent: { gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: { flex: 1 },
  claimId: { fontWeight: "700", color: "#1a1a1a" },
  date: { color: "#888", marginTop: 2, fontSize: 12 },
  statusChip: { borderWidth: 0 },
  statusText: { fontWeight: "700", fontSize: 11 },
  itemCount: { color: "#666", marginLeft: 52 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#888", fontSize: 14 },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: { color: "#999", fontSize: 14 },
});
