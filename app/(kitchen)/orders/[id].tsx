import { pickingTasksApi } from "@/src/apis/picking-tasks.api";
import { PickingTask } from "@/src/types/picking-tasks";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Divider,
  Icon,
  Text,
} from "react-native-paper";
import Toast from "react-native-toast-message";

export default function KitchenOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [taskDetail, setTaskDetail] = useState<PickingTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      if (!id) return;
      setIsLoading(true);
      const data = await pickingTasksApi.getPickingTaskById(id);
      setTaskDetail(data);
    } catch (error) {
      console.warn("Lỗi tải chi tiết phiếu nhặt hàng:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Không thể tải dữ liệu chi tiết.",
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleReset = async () => {
    if (!taskDetail?.orderId) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Không tìm thấy mã đơn hàng để reset.",
      });
      return;
    }

    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn đặt lại trạng thái phiếu nhặt hàng này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đặt lại",
          style: "destructive",
          onPress: async () => {
            try {
              setIsResetting(true);
              const identifier = taskDetail.orderId || taskDetail.shipmentId || taskDetail.id;
              await pickingTasksApi.resetPickingTask(identifier!);
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Đã đặt lại trạng thái phiếu nhặt hàng.",
              });
              await fetchDetail(); // Refresh data
            } catch (error) {
              console.warn("Lỗi reset phiếu nhặt hàng:", error);
              Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: "Không thể đặt lại phiếu nhặt hàng.",
              });
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return { bg: "#FFF3E0", text: "#E65100" };
      case "PICKING":
        return { bg: "#E3F2FD", text: "#1976D2" };
      case "READY":
        return { bg: "#E8F5E9", text: "#2E7D32" };
      case "COMPLETED":
        return { bg: "#E8F5E9", text: "#388E3C" };
      case "CANCELLED":
        return { bg: "#FFEBEE", text: "#D32F2F" };
      default:
        return { bg: "#F5F5F5", text: "#616161" };
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "Chờ xử lý";
      case "PICKING": return "Đang nhặt hàng";
      case "READY": return "Sẵn sàng giao";
      case "COMPLETED": return "Hoàn thành";
      case "CANCELLED": return "Đã huỷ";
      default: return status || "Không rõ";
    }
  };

  if (isLoading || !taskDetail) {
    return (
      <View style={styles.container}>
        <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
          <Appbar.BackAction color="#fff" onPress={() => router.back()} />
          <Appbar.Content title="Chi tiết Đơn" color="#fff" />
        </Appbar.Header>
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      </View>
    );
  }

  const items = taskDetail.items || taskDetail.pickingItems || [];
  const statusColor = getStatusColor(taskDetail.status);

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title={`Đơn ${taskDetail.orderId || taskDetail.id}`} color="#fff" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <Card style={styles.infoCard} mode="elevated">
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Thông tin chung</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                <Text style={[styles.statusText, { color: statusColor.text }]}>
                  {getStatusText(taskDetail.status)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon source="store" size={20} color="#E65100" />
              <Text style={styles.infoText}>
                {taskDetail.storeName || taskDetail.franchiseName || "Cửa hàng Trung tâm (N/A)"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="clock-outline" size={20} color="#E65100" />
              <Text style={styles.infoText}>
                Tạo lúc: {taskDetail.createdAt ? new Date(taskDetail.createdAt).toLocaleString("vi-VN") : "Chưa xác định"}
              </Text>
            </View>
            {taskDetail.notes && (
              <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
                <Icon source="text-box-outline" size={20} color="#E65100" />
                <Text style={styles.infoText}>Ghi chú: {taskDetail.notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            mode="outlined"
            icon="refresh"
            textColor="#D32F2F"
            style={styles.resetButton}
            loading={isResetting}
            disabled={isResetting}
            onPress={handleReset}
          >
            Reset Đơn Hàng
          </Button>
        </View>

        {/* Items List */}
        <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 16 }]}>
          Danh sách nguyên liệu ({items.length})
        </Text>
        
        <Card style={styles.itemsCard} mode="elevated">
          {items.map((item, index) => (
            <View key={item.id || index}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.productName || `Món hàng ${item.id}`}</Text>
                </View>
                <View style={styles.itemQtyContainer}>
                  <Text style={styles.itemQtyText}>
                    {item.pickedQuantity !== undefined ? `${item.pickedQuantity} / ` : ""}
                    <Text style={styles.qtyHighlight}>{item.requiredQty ?? item.quantity ?? 0}</Text> {item.unit || "đơn vị"}
                  </Text>
                </View>
              </View>
              {item.suggestedBatches && item.suggestedBatches.length > 0 && (
                <View style={[styles.itemRow, { paddingTop: 0 }]}>
                  <Text style={{ fontSize: 13, color: "#666" }}>Lô gợi ý: {item.suggestedBatches.map(b => b.batchCode).join(", ")}</Text>
                </View>
              )}
              {index < items.length - 1 && <Divider />}
            </View>
          ))}
          {items.length === 0 && (
            <View style={styles.emptyItemContainer}>
              <Text style={styles.emptyItemText}>Không có dữ liệu nguyên liệu.</Text>
            </View>
          )}
        </Card>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#4A4A4A",
    flex: 1,
  },
  actionSection: {
    marginVertical: 8,
  },
  resetButton: {
    borderColor: "#FFCDD2",
    borderRadius: 12,
    borderWidth: 1.5,
  },
  itemsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 12,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  itemQtyContainer: {
    alignItems: "flex-end",
  },
  itemQtyText: {
    fontSize: 15,
    color: "#666",
  },
  qtyHighlight: {
    fontWeight: "bold",
    color: "#E65100",
  },
  emptyItemContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyItemText: {
    color: "#888",
    fontStyle: "italic",
  },
});
