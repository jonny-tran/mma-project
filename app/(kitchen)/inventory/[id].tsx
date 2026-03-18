import { productBatchesApi } from "@/src/apis/product-batches.api";
import { ProductBatch } from "@/src/types/product-batches";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Modal,
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
  Icon,
  Text,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";

const formatDateTime = (value?: string) => {
  if (!value) {
    return "Không xác định";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleString("vi-VN");
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Không xác định";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleDateString("vi-VN");
};

const getStatus = (status?: string) => {
  const normalized = status?.toUpperCase();

  switch (normalized) {
    case "AVAILABLE":
    case "ACTIVE":
      return { label: "Đang hoạt động", bg: "#E8F5E9", text: "#2E7D32" };
    case "EXPIRED":
      return { label: "Hết hạn", bg: "#FFEBEE", text: "#C62828" };
    case "USED":
    case "DEPLETED":
      return { label: "Đã dùng", bg: "#ECEFF1", text: "#455A64" };
    default:
      return { label: status || "Không rõ", bg: "#F5F5F5", text: "#616161" };
  }
};

export default function KitchenInventoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    productName?: string | string[];
    status?: string | string[];
  }>();
  const batchId = Array.isArray(params.id) ? params.id[0] : params.id;
  const initialProductName = Array.isArray(params.productName)
    ? params.productName[0]
    : params.productName;
  const initialStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editImageUri, setEditImageUri] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const fetchBatchDetail = useCallback(async () => {
    if (!batchId) {
      setBatch(null);
      return;
    }

    try {
      const data = await productBatchesApi.getProductBatchById(batchId);

      if (!data.id) {
        throw new Error("Dữ liệu chi tiết lô hàng không hợp lệ");
      }

      setBatch(data);
    } catch (error) {
      console.warn("Lỗi tải chi tiết lô hàng:", error);
      setBatch(null);
      Toast.show({
        type: "error",
        text1: "Lỗi dữ liệu",
        text2: "Không thể lấy chi tiết lô hàng",
      });
    }
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchBatchDetail().finally(() => setIsLoading(false));
    }, [fetchBatchDetail]),
  );

  const openEditModal = useCallback(() => {
    const currentQuantity =
      batch?.currentQuantity ??
      batch?.remainingQuantity ??
      batch?.availableQuantity ??
      batch?.quantity ??
      0;
    setEditQuantity(currentQuantity.toString());
    setEditStatus(batch?.status || initialStatus || "");
    setEditImageUri(batch?.imageUrl || "");
    setIsEditModalVisible(true);
  }, [batch, initialStatus]);

  const handleUpdate = useCallback(async () => {
    if (!batchId) return;

    try {
      setIsUpdating(true);
      const normalizedQuantity = Number(editQuantity);
      const initialQuantity = Number.isFinite(normalizedQuantity)
        ? normalizedQuantity
        : undefined;

      const originalImageUri = (batch?.imageUrl || "").trim();
      const nextImageUri = editImageUri.trim();
      const imageUrlPayload: string | null =
        nextImageUri === originalImageUri
          ? originalImageUri || null
          : nextImageUri || null;

      const normalizedStatus = editStatus.trim().toLowerCase();

      const updatePayload = {
        initialQuantity,
        status: normalizedStatus || undefined,
        imageUrl: imageUrlPayload,
      };

      const updated = await productBatchesApi.updateProductBatch(
        batchId,
        updatePayload,
      );
      setBatch(updated);
      setIsEditModalVisible(false);

      Toast.show({
        type: "success",
        text1: "Cập nhật thành công",
        text2: "Lô hàng đã được cập nhật",
      });
    } catch (error) {
      console.warn("Lỗi cập nhật lô hàng:", error);
      Toast.show({
        type: "error",
        text1: "Cập nhật thất bại",
        text2: "Không thể cập nhật lô hàng",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [batchId, batch?.imageUrl, editImageUri, editQuantity, editStatus]);

  const statusOptions = [
    { label: "Đang hoạt động", value: "AVAILABLE" },
    { label: "Hết hạn", value: "EXPIRED" },
    { label: "Đã dùng", value: "USED" },
  ];

  const status = getStatus(batch?.status || initialStatus);
  const quantity =
    batch?.currentQuantity ??
    batch?.remainingQuantity ??
    batch?.availableQuantity ??
    batch?.quantity ??
    0;

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title="Chi Tiết Lô Hàng" color="#fff" />
        {!isLoading && batch && (
          <Appbar.Action icon="pencil" color="#fff" onPress={openEditModal} />
        )}
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      ) : !batch ? (
        <View style={styles.centerContainer}>
          <Icon source="alert-circle-outline" size={64} color="#BDBDBD" />
          <Text style={styles.emptyText}>Không tìm thấy dữ liệu lô hàng</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.detailCard} mode="elevated">
            <Card.Content>
              <View style={styles.titleRow}>
                <View style={styles.titleWrap}>
                  <Icon
                    source="package-variant-closed"
                    size={20}
                    color="#7B1FA2"
                  />
                  <Text style={styles.batchCode}>
                    {batch.batchCode || batch.id}
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: status.bg }]}
                >
                  <Text style={[styles.statusText, { color: status.text }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              {batch.imageUrl ? (
                <Image
                  source={{ uri: batch.imageUrl }}
                  style={styles.productImage}
                />
              ) : null}

              <View style={styles.infoBlock}>
                <View style={styles.infoRow}>
                  <Icon source="cube-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Tên nguyên liệu:</Text>
                  <Text style={styles.infoValue}>
                    {batch.productName ||
                      initialProductName ||
                      "Không xác định"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="information-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Trạng thái:</Text>
                  <View
                    style={[
                      styles.statusBadgeInline,
                      { backgroundColor: status.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusTextInline, { color: status.text }]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="counter" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Số lượng tồn:</Text>
                  <Text style={styles.infoValue}>
                    {quantity} {batch.unit || ""}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar-clock" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Hạn dùng:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(batch.expiryDate)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar-plus" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Ngày tạo:</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(batch.createdAt)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar-refresh" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Cập nhật:</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(batch.updatedAt)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsEditModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Sửa Lô Hàng</Text>

              <Text style={styles.formLabel}>Số lượng tồn kho</Text>
              <TextInput
                mode="outlined"
                label="Số lượng"
                placeholder="Nhập số lượng"
                keyboardType="number-pad"
                value={editQuantity}
                onChangeText={setEditQuantity}
                style={styles.formInput}
              />

              <Text style={styles.formLabel}>Trạng thái</Text>
              <Pressable
                style={styles.dropdownButton}
                onPress={() => setStatusMenuVisible(!statusMenuVisible)}
              >
                <Text style={styles.dropdownButtonText}>
                  {statusOptions.find((o) => o.value === editStatus)?.label ||
                    "Chọn trạng thái"}
                </Text>
                <Icon
                  source={statusMenuVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </Pressable>

              {statusMenuVisible && (
                <View style={styles.dropdownList}>
                  {statusOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        editStatus === option.value &&
                          styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setEditStatus(option.value);
                        setStatusMenuVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          editStatus === option.value &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.formLabel}>URL Ảnh lô hàng</Text>
              <TextInput
                mode="outlined"
                label="URL ảnh"
                placeholder="Nhập URL ảnh hoặc base64"
                value={editImageUri}
                onChangeText={setEditImageUri}
                style={[styles.formInput, styles.formInputLarge]}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setIsEditModalVisible(false)}
                  disabled={isUpdating}
                  style={styles.buttonHalf}
                >
                  Huỷ bỏ
                </Button>
                <Button
                  mode="contained"
                  loading={isUpdating}
                  onPress={handleUpdate}
                  disabled={isUpdating}
                  style={styles.buttonHalf}
                >
                  Lưu
                </Button>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
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
  emptyText: {
    color: "#888",
    fontSize: 16,
    marginTop: 8,
  },
  detailCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  batchCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F1F1F",
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  productImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: "#ECECEC",
  },
  infoBlock: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
  statusBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextInline: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalBody: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalBodyContent: {
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 4,
  },
  formInput: {
    backgroundColor: "#fff",
  },
  formInputLarge: {
    minHeight: 80,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemSelected: {
    backgroundColor: "#E8F5E9",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  buttonHalf: {
    flex: 1,
  },
});
