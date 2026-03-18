import { shipmentApi } from "@/src/apis/shipment.api";
import { ShipmentStatus, type Shipment } from "@/src/types/shipment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Text,
} from "react-native-paper";

const STATUS_LABELS: Record<string, string> = {
  [ShipmentStatus.PREPARING]: "Đang chuẩn bị",
  [ShipmentStatus.IN_TRANSIT]: "Đang vận chuyển",
  [ShipmentStatus.DELIVERED]: "Đã giao",
  [ShipmentStatus.COMPLETED]: "Hoàn thành",
};

const STATUS_TABS: { key: ShipmentStatus; label: string }[] = [
  { key: ShipmentStatus.IN_TRANSIT, label: "Đang vận chuyển" },
  { key: ShipmentStatus.DELIVERED, label: "Đã giao" },
  { key: ShipmentStatus.COMPLETED, label: "Hoàn thành" },
];

const CHIP_CONFIG: Record<
  string,
  { bg: string; color: string; icon: string }
> = {
  [ShipmentStatus.PREPARING]: {
    bg: "#E3F2FD",
    color: "#1565C0",
    icon: "package-variant",
  },
  [ShipmentStatus.IN_TRANSIT]: {
    bg: "#FFF3E0",
    color: "#E65100",
    icon: "truck-delivery",
  },
  [ShipmentStatus.DELIVERED]: {
    bg: "#E8F5E9",
    color: "#2E7D32",
    icon: "package-down",
  },
  [ShipmentStatus.COMPLETED]: {
    bg: "#F3E5F5",
    color: "#6A1B9A",
    icon: "check-circle",
  },
};

export default function ShipmentsScreen() {
  const { push } = useRouter();
  const [activeTab, setActiveTab] = useState<ShipmentStatus>(
    ShipmentStatus.IN_TRANSIT
  );

  const {
    data: shipments,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["shipments", activeTab],
    queryFn: () => shipmentApi.fetchMyShipments(activeTab),
  });

  const renderItem = ({ item }: { item: Shipment }) => {
    const cfg =
      CHIP_CONFIG[item.status] ?? CHIP_CONFIG[ShipmentStatus.IN_TRANSIT];
    return (
      <Card
        style={styles.card}
        onPress={() => push(`/shipments/${item.id}` as any)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View
              style={[styles.statusDot, { backgroundColor: cfg.color }]}
            />
            <View style={styles.cardInfo}>
              <Text variant="titleSmall" style={styles.shipmentId}>
                #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text variant="bodySmall" style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            <Chip
              icon={cfg.icon}
              compact
              style={[styles.statusChip, { backgroundColor: cfg.bg }]}
              textStyle={[styles.statusChipText, { color: cfg.color }]}
            >
              {STATUS_LABELS[item.status] ?? item.status}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={56}
            color="#C62828"
          />
          <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorSubtitle}>
            Kiểm tra kết nối mạng hoặc đăng nhập lại
          </Text>
          <Button
            mode="contained"
            onPress={() => refetch()}
            style={styles.retryBtn}
            icon="refresh"
          >
            Thử lại
          </Button>
        </View>
      ) : (
        <FlatList
          data={Array.isArray(shipments) ? shipments : []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={64}
                color="#ddd"
              />
              <Text style={styles.emptyText}>Không có lô hàng nào.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  tabBarWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  tabActive: {
    backgroundColor: "#E65100",
  },
  tabText: { color: "#666", fontSize: 13, fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  listContent: { padding: 16, paddingBottom: 32, gap: 10 },
  card: { borderRadius: 14, backgroundColor: "#fff", elevation: 1 },
  cardContent: { gap: 4 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardInfo: { flex: 1 },
  shipmentId: { fontWeight: "700", color: "#1a1a1a" },
  dateText: { color: "#888", marginTop: 2, fontSize: 12 },
  statusChip: { borderWidth: 0 },
  statusChipText: { fontWeight: "700", fontSize: 11 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  loadingText: { color: "#888", fontSize: 14 },
  errorTitle: { fontWeight: "700", fontSize: 16, color: "#1a1a1a" },
  errorSubtitle: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: "#E65100",
    borderRadius: 10,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: { color: "#999", fontSize: 14 },
});
