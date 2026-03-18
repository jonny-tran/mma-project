import { shipmentApi } from "@/src/apis/shipment.api";
import { ShipmentStatus, type Shipment } from "@/src/types/shipment";
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
  Appbar,
  Button,
  Card,
  Chip,
  IconButton,
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
  { bg: string; border: string; text: string; icon: string }
> = {
  [ShipmentStatus.PREPARING]: {
    bg: "#E3F2FD",
    border: "#1565C0",
    text: "#1565C0",
    icon: "package-variant",
  },
  [ShipmentStatus.IN_TRANSIT]: {
    bg: "#FFF3E0",
    border: "#E65100",
    text: "#E65100",
    icon: "truck-delivery",
  },
  [ShipmentStatus.DELIVERED]: {
    bg: "#E8F5E9",
    border: "#2E7D32",
    text: "#2E7D32",
    icon: "package-down",
  },
  [ShipmentStatus.COMPLETED]: {
    bg: "#F3E5F5",
    border: "#6A1B9A",
    text: "#6A1B9A",
    icon: "check-circle",
  },
};

export default function ShipmentsScreen() {
  const { push, back } = useRouter();
  const [activeTab, setActiveTab] = useState<ShipmentStatus>(ShipmentStatus.IN_TRANSIT);

  const statusParam = activeTab;

  const {
    data: shipments,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["shipments", statusParam],
    queryFn: () => shipmentApi.fetchMyShipments(statusParam),
  });

  const renderItem = ({ item }: { item: Shipment }) => {
    const cfg =
      CHIP_CONFIG[item.status] ?? CHIP_CONFIG[ShipmentStatus.IN_TRANSIT];
    return (
      <Card
        style={styles.card}
        onPress={() => push(`/shipments/${item.id}` as any)}
      >
        <Card.Content>
          <View style={styles.row}>
            <View style={styles.contentHeader}>
              <Text variant="titleMedium" style={styles.shipmentId}>
                #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <Chip
                mode="outlined"
                icon={cfg.icon}
                compact
                style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
                textStyle={{ color: cfg.text, fontSize: 10, fontWeight: "700" }}
              >
                {STATUS_LABELS[item.status] ?? item.status}
              </Chip>
            </View>
            <IconButton icon="chevron-right" size={24} />
          </View>

          <View style={styles.details}>
            <Text variant="bodySmall" style={styles.label}>
              Ngày tạo:{" "}
              <Text style={styles.value}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.BackAction onPress={() => back()} />
        <Appbar.Content title="Lô hàng" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
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
          <Text style={styles.loadingText}>
            Đang tải danh sách lô hàng...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <IconButton icon="alert-circle-outline" size={64} iconColor="#C62828" />
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
          contentContainerStyle={styles.listContainer}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconButton
                icon="package-variant-closed"
                size={80}
                iconColor="#ddd"
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
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { backgroundColor: "#fff" },
  headerTitle: { fontWeight: "700" },
  tabBarWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tabActive: {
    backgroundColor: "#E65100",
    borderColor: "#E65100",
  },
  tabText: { color: "#666", fontSize: 13 },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  listContainer: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: "#fff" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contentHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shipmentId: { fontWeight: "700", color: "#333" },
  details: { marginTop: 8, gap: 4 },
  label: { color: "#888" },
  value: { color: "#333", fontWeight: "500" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#666" },
  errorTitle: { fontWeight: "700", fontSize: 16, color: "#333", marginTop: 4 },
  errorSubtitle: { color: "#888", fontSize: 13, textAlign: "center", marginTop: 4 },
  retryBtn: { marginTop: 16, backgroundColor: "#E65100", borderRadius: 8 },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 8,
  },
});
