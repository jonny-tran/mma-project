import React from "react";
import { View, StyleSheet, FlatList, Image } from "react-native";
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Divider,
  Surface,
} from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { claimApi } from "@/src/apis/claim.api";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "#E65100" },
  approved: { label: "Đã duyệt", color: "#2E7D32" },
  rejected: { label: "Từ chối", color: "#C62828" },
};

export default function ClaimDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: claim, isLoading } = useQuery({
    queryKey: ["claim", id],
    queryFn: () => claimApi.fetchClaimDetail(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" color="#E65100" />
      </View>
    );
  }

  if (!claim) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy khiếu nại</Text>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.pending;

  return (
    <View style={styles.container}>
      <FlatList
        data={claim.items}
        keyExtractor={(_, i) => i.toString()}
        ListHeaderComponent={
          <Surface style={styles.infoCard} elevation={1}>
            <View style={styles.infoRow}>
              <Text variant="titleMedium" style={styles.claimId}>
                #{claim.id.slice(0, 8).toUpperCase()}
              </Text>
              <Chip
                compact
                style={[styles.statusChip, { borderColor: cfg.color }]}
                textStyle={{ color: cfg.color, fontWeight: "700", fontSize: 11 }}
              >
                {cfg.label}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.meta}>
              Ngày tạo: {new Date(claim.createdAt).toLocaleString("vi-VN")}
            </Text>
            {claim.resolvedAt && (
              <Text variant="bodySmall" style={styles.meta}>
                Ngày xử lý: {new Date(claim.resolvedAt).toLocaleString("vi-VN")}
              </Text>
            )}
          </Surface>
        }
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.productName}>
                {item.productName}
              </Text>
              <Text variant="bodySmall" style={styles.sku}>SKU: {item.sku}</Text>
              <Divider style={styles.divider} />
              <View style={styles.qtyRow}>
                {item.quantityMissing > 0 && (
                  <Chip compact style={styles.missingChip} textStyle={styles.missingText}>
                    Thiếu: {item.quantityMissing}
                  </Chip>
                )}
                {item.quantityDamaged > 0 && (
                  <Chip compact style={styles.damagedChip} textStyle={styles.damagedText}>
                    Hỏng: {item.quantityDamaged}
                  </Chip>
                )}
              </View>
              {item.reason && (
                <Text variant="bodySmall" style={styles.reason}>
                  Lý do: {item.reason}
                </Text>
              )}
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.proofImage} />
              )}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  claimId: { fontWeight: "700", color: "#333" },
  statusChip: { borderWidth: 1, backgroundColor: "transparent" },
  meta: { color: "#888", marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 32 },
  itemCard: { marginBottom: 12, borderRadius: 12, backgroundColor: "#fff" },
  productName: { fontWeight: "700", color: "#333" },
  sku: { color: "#888", marginTop: 2 },
  divider: { marginVertical: 10 },
  qtyRow: { flexDirection: "row", gap: 8 },
  missingChip: { backgroundColor: "#FFF3E0" },
  missingText: { color: "#E65100", fontWeight: "700", fontSize: 11 },
  damagedChip: { backgroundColor: "#FFEBEE" },
  damagedText: { color: "#C62828", fontWeight: "700", fontSize: 11 },
  reason: { color: "#555", marginTop: 8, fontStyle: "italic" },
  proofImage: { width: 120, height: 120, borderRadius: 8, marginTop: 10 },
});
