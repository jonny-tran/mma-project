import { pickingTasksApi } from "@/src/apis/picking-tasks.api";
import {
  FinalizeBulkPickedItem,
  PickingTaskDetail,
  PickingTaskItem,
  ScanCheckBatchInfo,
  SuggestedBatch,
} from "@/src/types/picking-tasks";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
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

type FinalizeBatchRow = {
  batchId: number;
  batchCode: string;
  productName?: string;
  suggestedQty?: number;
};

const getSuggestedBatchIdentifier = (batch: SuggestedBatch): string => {
  if (batch.batchCode) {
    return batch.batchCode;
  }

  if (typeof batch.batchId === "string" || typeof batch.batchId === "number") {
    return String(batch.batchId);
  }

  if (typeof batch.id === "string" || typeof batch.id === "number") {
    return String(batch.id);
  }

  return "";
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

const toOptionalPositiveNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
};

export default function KitchenShippingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [detail, setDetail] = useState<PickingTaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scanInfoMap, setScanInfoMap] = useState<
    Record<string, ScanCheckBatchInfo>
  >({});
  const [isFinalizeModalVisible, setIsFinalizeModalVisible] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeRows, setFinalizeRows] = useState<FinalizeBatchRow[]>([]);
  const [quantityByBatchId, setQuantityByBatchId] = useState<
    Record<string, string>
  >({});

  const fetchSuggestedBatchInfo = useCallback(
    async (items: PickingTaskItem[]) => {
      const identifiers = Array.from(
        new Set(
          items.flatMap((item) =>
            (item.suggestedBatches || [])
              .map((batch) => getSuggestedBatchIdentifier(batch))
              .filter((value) => value.length > 0),
          ),
        ),
      );

      if (identifiers.length === 0) {
        setScanInfoMap({});
        return;
      }

      const results = await Promise.all(
        identifiers.map(async (identifier) => {
          try {
            const info =
              await pickingTasksApi.getScanCheckByBatchCode(identifier);
            return [identifier, info] as const;
          } catch {
            return [identifier, {} as ScanCheckBatchInfo] as const;
          }
        }),
      );

      setScanInfoMap(Object.fromEntries(results));
    },
    [],
  );

  const fetchDetail = useCallback(async () => {
    if (!taskId) {
      setDetail(null);
      setScanInfoMap({});
      return;
    }

    try {
      const data = await pickingTasksApi.getPickingTaskDetail(taskId);
      setDetail(data);
      await fetchSuggestedBatchInfo(data.items || []);
    } catch (error) {
      console.warn("Lỗi tải chi tiết đơn xuất kho:", error);
      setDetail(null);
      setScanInfoMap({});
      Toast.show({
        type: "error",
        text1: "Lỗi dữ liệu",
        text2: "Không thể tải chi tiết đơn hàng",
      });
    }
  }, [fetchSuggestedBatchInfo, taskId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchDetail().finally(() => setIsLoading(false));
    }, [fetchDetail]),
  );

  const items = detail?.items || [];

  const buildFinalizeRows = useCallback((): FinalizeBatchRow[] => {
    const rowMap = new Map<number, FinalizeBatchRow>();

    items.forEach((item) => {
      (item.suggestedBatches || []).forEach((batch) => {
        const identifier = getSuggestedBatchIdentifier(batch);
        const scanInfo = scanInfoMap[identifier];
        const rawBatchId = scanInfo?.batchId ?? batch.batchId ?? batch.id;
        const batchId = toOptionalPositiveNumber(rawBatchId);

        if (!batchId) {
          return;
        }

        if (!rowMap.has(batchId)) {
          rowMap.set(batchId, {
            batchId,
            batchCode: scanInfo?.batchCode || batch.batchCode || identifier,
            productName: scanInfo?.productName || item.productName || item.name,
            suggestedQty: toOptionalPositiveNumber(batch.qtyToPick),
          });
        }
      });
    });

    return Array.from(rowMap.values());
  }, [items, scanInfoMap]);

  const openFinalizeModal = useCallback(() => {
    const rows = buildFinalizeRows();

    if (rows.length === 0) {
      Toast.show({
        type: "info",
        text1: "Không có lô hợp lệ",
        text2: "Không tìm thấy batchId để xuất kho",
      });
      return;
    }

    const initialQuantityMap: Record<string, string> = {};
    rows.forEach((row) => {
      initialQuantityMap[String(row.batchId)] = row.suggestedQty
        ? String(row.suggestedQty)
        : "";
    });

    setFinalizeRows(rows);
    setQuantityByBatchId(initialQuantityMap);
    setIsFinalizeModalVisible(true);
  }, [buildFinalizeRows]);

  const handleChangeQuantity = useCallback((batchId: number, value: string) => {
    setQuantityByBatchId((prev) => ({
      ...prev,
      [String(batchId)]: value,
    }));
  }, []);

  const handleConfirmFinalize = useCallback(async () => {
    const orderId = detail?.orderId || taskId;

    if (!orderId) {
      Toast.show({
        type: "error",
        text1: "Thiếu mã đơn",
        text2: "Không thể xác định orderId để xuất kho",
      });
      return;
    }

    const pickedItems: FinalizeBulkPickedItem[] = finalizeRows
      .map((row) => {
        const quantity = toOptionalPositiveNumber(
          quantityByBatchId[String(row.batchId)],
        );

        if (!quantity) {
          return null;
        }

        return {
          batchId: row.batchId,
          quantity,
        };
      })
      .filter((item): item is FinalizeBulkPickedItem => Boolean(item));

    if (pickedItems.length === 0) {
      Toast.show({
        type: "error",
        text1: "Thiếu số lượng",
        text2: "Vui lòng nhập số lượng hợp lệ (> 0)",
      });
      return;
    }

    try {
      setIsFinalizing(true);
      await pickingTasksApi.finalizeShipmentsBulk({
        orders: [
          {
            orderId,
            pickedItems,
          },
        ],
      });

      setIsFinalizeModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Xuất kho thành công",
        text2: "Đơn hàng đã được chuyển sang trạng thái giao",
      });
      await fetchDetail();
    } catch (error) {
      console.warn("Lỗi xác nhận xuất kho:", error);
      Toast.show({
        type: "error",
        text1: "Xuất kho thất bại",
        text2: "Không thể xác nhận xuất kho cho đơn hàng",
      });
    } finally {
      setIsFinalizing(false);
    }
  }, [detail?.orderId, fetchDetail, finalizeRows, quantityByBatchId, taskId]);

  const renderItem = (item: PickingTaskItem, index: number) => {
    const required = item.requiredQty ?? item.quantity ?? 0;
    const picked = item.pickedQuantity;

    return (
      <Card
        key={item.id || `${item.productId || "item"}-${index}`}
        style={styles.itemCard}
        mode="elevated"
      >
        <Card.Content>
          <View style={styles.itemHeader}>
            <Icon source="cube-outline" size={18} color="#2E7D32" />
            <Text style={styles.itemName}>
              {item.productName || item.name || "Nguyên liệu"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon source="counter" size={16} color="#666" />
            <Text style={styles.infoText}>
              Số lượng cần: {required} {item.unit || ""}
            </Text>
          </View>

          {typeof picked !== "undefined" && (
            <View style={styles.infoRow}>
              <Icon source="check-circle-outline" size={16} color="#666" />
              <Text style={styles.infoText}>Đã soạn: {picked}</Text>
            </View>
          )}

          {item.suggestedBatches && item.suggestedBatches.length > 0 && (
            <View style={styles.suggestedContainer}>
              <View style={styles.infoRow}>
                <Icon source="package-variant" size={16} color="#666" />
                <Text style={styles.infoText}>Lô gợi ý</Text>
              </View>

              {item.suggestedBatches.map((batch, batchIndex) => {
                const identifier = getSuggestedBatchIdentifier(batch);
                const info = scanInfoMap[identifier];

                return (
                  <View
                    key={`${identifier || "batch"}-${batchIndex}`}
                    style={styles.suggestedItem}
                  >
                    <Text style={styles.suggestedCode}>
                      Mã lô: {identifier || "Không xác định"}
                    </Text>
                    <Text style={styles.suggestedText}>
                      Tên SP: {info?.productName || "Không xác định"}
                    </Text>
                    <Text style={styles.suggestedText}>
                      Hạn dùng: {formatDate(info?.expiryDate || batch.expiry)}
                    </Text>
                    <Text style={styles.suggestedText}>
                      Tồn kho:{" "}
                      {typeof info?.quantityPhysical === "number"
                        ? info.quantityPhysical
                        : "Không rõ"}
                    </Text>
                    <Text style={styles.suggestedText}>
                      Trạng thái: {info?.status || "Không rõ"}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content
          title="Chi Tiết Xuất Kho"
          subtitle={detail?.orderId ? `Đơn: ${detail.orderId}` : undefined}
          titleStyle={{ color: "#fff" }}
          subtitleStyle={{ color: "rgba(255,255,255,0.85)" }}
        />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon source="package-variant-remove" size={64} color="#C7C7C7" />
          <Text style={styles.emptyText}>Đơn hàng trống</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {items.map(renderItem)}

          <View style={styles.exportSection}>
            <Button
              mode="contained"
              icon="truck-check"
              onPress={openFinalizeModal}
            >
              Xuất Kho
            </Button>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={isFinalizeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFinalizeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsFinalizeModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Xác Nhận Xuất Kho</Text>

            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {finalizeRows.map((row) => (
                <View key={row.batchId} style={styles.modalRow}>
                  <Text style={styles.modalBatchId}>ID lô: {row.batchId}</Text>
                  <Text style={styles.modalMetaText}>
                    Mã lô: {row.batchCode || "Không rõ"}
                  </Text>
                  <Text style={styles.modalMetaText}>
                    SP: {row.productName || "Không xác định"}
                  </Text>
                  <TextInput
                    mode="outlined"
                    label="Số lượng"
                    keyboardType="decimal-pad"
                    value={quantityByBatchId[String(row.batchId)] || ""}
                    onChangeText={(value) =>
                      handleChangeQuantity(row.batchId, value)
                    }
                    style={styles.modalInput}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setIsFinalizeModalVisible(false)}
                disabled={isFinalizing}
                style={styles.modalButton}
              >
                Huỷ
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmFinalize}
                loading={isFinalizing}
                disabled={isFinalizing}
                style={styles.modalButton}
              >
                Xác Nhận Xuất Kho
              </Button>
            </View>
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
    paddingBottom: 32,
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
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F1F1F",
    flexShrink: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#4B4B4B",
    flexShrink: 1,
  },
  suggestedContainer: {
    marginTop: 4,
    paddingTop: 4,
  },
  suggestedItem: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F7F9FB",
    borderWidth: 1,
    borderColor: "#E6EAEE",
    gap: 4,
  },
  suggestedCode: {
    fontSize: 13,
    fontWeight: "700",
    color: "#263238",
  },
  suggestedText: {
    fontSize: 13,
    color: "#546E7A",
  },
  exportSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 10,
  },
  modalList: {
    maxHeight: 420,
  },
  modalListContent: {
    gap: 10,
    paddingBottom: 6,
  },
  modalRow: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E7EDF3",
    padding: 10,
    gap: 4,
  },
  modalBatchId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#263238",
  },
  modalMetaText: {
    fontSize: 12,
    color: "#607D8B",
  },
  modalInput: {
    marginTop: 6,
    backgroundColor: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
  },
});
