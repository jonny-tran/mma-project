import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Appbar,
  Text,
  ActivityIndicator,
  Button,
  Surface,
  Chip,
  Portal,
  Dialog,
  Paragraph,
  Card,
  Divider,
} from "react-native-paper";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentApi } from "@/src/apis/shipment.api";
import { uploadApi } from "@/src/apis/upload.api";
import { useReceivingStore } from "@/src/store/useReceivingStore";
import type { ScanData } from "@/src/store/useReceivingStore";
import { ShipmentStatus, type ShipmentItem } from "@/src/types/shipment";
import ShipmentItemCard from "@/src/components/shipments/ShipmentItemCard";
import BarcodeScanner from "@/src/components/BarcodeScanner";
import ClaimModal from "@/src/components/ClaimModal";
import Toast from "react-native-toast-message";

const STATUS_LABELS: Record<string, string> = {
  [ShipmentStatus.PREPARING]: "Đang chuẩn bị",
  [ShipmentStatus.IN_TRANSIT]: "Đang vận chuyển",
  [ShipmentStatus.DELIVERED]: "Đã giao",
  [ShipmentStatus.COMPLETED]: "Hoàn thành",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  [ShipmentStatus.PREPARING]: { bg: "#E3F2FD", text: "#1565C0" },
  [ShipmentStatus.IN_TRANSIT]: { bg: "#FFF3E0", text: "#E65100" },
  [ShipmentStatus.DELIVERED]: { bg: "#E8F5E9", text: "#2E7D32" },
  [ShipmentStatus.COMPLETED]: { bg: "#F3E5F5", text: "#6A1B9A" },
};

type DialogState = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  showCancel: boolean;
};

const DIALOG_INITIAL: DialogState = {
  visible: false,
  title: "",
  message: "",
  confirmLabel: "Xác nhận",
  onConfirm: () => {},
  showCancel: true,
};

function ReadOnlyItemCard({ item }: { item: ShipmentItem }) {
  return (
    <Card style={styles.readonlyCard}>
      <View style={styles.readonlyCardContent}>
        <View style={styles.readonlyHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.readonlyProductName}>
              {item.productName}
            </Text>
            <Text variant="bodySmall" style={styles.readonlyBatchCode}>
              Mã lô: {item.batchCode}
            </Text>
          </View>
          {item.unit && (
            <Chip compact style={styles.unitChip}>
              {item.unit}
            </Chip>
          )}
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <View style={styles.readonlyRow}>
          <View style={styles.readonlyField}>
            <Text variant="labelSmall" style={styles.readonlyLabel}>
              Số lượng
            </Text>
            <Text variant="titleLarge" style={styles.readonlyValue}>
              {item.quantity}
            </Text>
          </View>
          <View style={styles.readonlyField}>
            <Text variant="labelSmall" style={styles.readonlyLabel}>
              SKU
            </Text>
            <Text variant="bodyMedium" style={styles.readonlyValueSmall}>
              {item.sku}
            </Text>
          </View>
          <View style={styles.readonlyField}>
            <Text variant="labelSmall" style={styles.readonlyLabel}>
              Hạn sử dụng
            </Text>
            <Text variant="bodyMedium" style={styles.readonlyValueSmall}>
              {new Date(item.expiryDate).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const {
    currentShipmentId,
    scannedItems,
    startNewSession,
    updateActualQty,
    updateDamagedQty,
    updateEvidence,
    resetSession,
    getReceivePayload,
    getUnresolvedDiscrepancies,
  } = useReceivingStore();

  const [scannerVisible, setScannerVisible] = useState(false);
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>(DIALOG_INITIAL);

  const closeDialog = () => setDialog(DIALOG_INITIAL);

  const showDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    opts?: { confirmLabel?: string; confirmColor?: string; showCancel?: boolean }
  ) => {
    setDialog({
      visible: true,
      title,
      message,
      confirmLabel: opts?.confirmLabel ?? "Xác nhận",
      confirmColor: opts?.confirmColor,
      onConfirm: () => {
        closeDialog();
        onConfirm();
      },
      showCancel: opts?.showCancel ?? true,
    });
  };

  const {
    data: shipment,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shipmentApi.fetchShipmentDetail(id as string),
    enabled: !!id,
  });

  const isReceivingMode = shipment?.status === ShipmentStatus.IN_TRANSIT;

  useEffect(() => {
    if (shipment && isReceivingMode && (!currentShipmentId || currentShipmentId !== id)) {
      const initialItems: ScanData[] = shipment.items.map((item) => ({
        batchId: item.batchId,
        productId: item.productId,
        expectedQty: item.quantity,
        actualQty: item.quantity,
        damagedQty: 0,
        evidenceUrls: [],
      }));
      startNewSession(id as string, initialItems);
    }
  }, [shipment, id, currentShipmentId, isReceivingMode]);

  const handleScanned = (batchCode: string) => {
    const item = shipment?.items.find((i) => i.batchCode === batchCode);
    if (item) {
      const currentData = scannedItems[item.batchId];
      updateActualQty(item.batchId, (currentData?.actualQty || 0) + 1);
      Toast.show({
        type: "success",
        text1: "Đã khớp mã lô",
        text2: `${item.productName}: +1`,
        position: "bottom",
      });
      setScannerVisible(false);
    } else {
      Toast.show({
        type: "error",
        text1: "Mã lô không hợp lệ",
        text2: "Mã này không nằm trong lô hàng hiện tại.",
        position: "bottom",
      });
    }
  };

  const onReceiveSuccess = useCallback(() => {
    resetSession();
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
    queryClient.invalidateQueries({ queryKey: ["shipment", id] });
    Toast.show({
      type: "success",
      text1: "Hoàn tất nhận hàng",
      text2: "Dữ liệu đã được lưu thành công.",
    });
    router.replace("/shipments" as any);
  }, [id]);

  const receiveAllMutation = useMutation({
    mutationFn: () => shipmentApi.receiveAll(id as string),
    onSuccess: onReceiveSuccess,
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Nhận hàng thất bại",
        text2: err?.message || "Đã có lỗi xảy ra.",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = getReceivePayload();

      const uploadedItems = await Promise.all(
        payload.items.map(async (item) => {
          if (item.evidenceUrls && item.evidenceUrls.length > 0) {
            const uploaded = await Promise.all(
              item.evidenceUrls.map(async (uri) => {
                if (uri.startsWith("http")) return uri;
                return uploadApi.uploadImage(uri);
              })
            );
            return { ...item, evidenceUrls: uploaded };
          }
          return item;
        })
      );

      return shipmentApi.submitReceipt(id as string, {
        items: uploadedItems,
        notes: payload.notes || undefined,
      });
    },
    onSuccess: onReceiveSuccess,
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Gửi thất bại",
        text2: err?.message || "Đã có lỗi xảy ra.",
      });
    },
  });

  const isAnyMutating =
    receiveAllMutation.isPending || submitMutation.isPending;

  useEffect(() => {
    if (!isReceivingMode) return;
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!currentShipmentId) return;
      if (isAnyMutating) return;
      e.preventDefault();
      showDialog(
        "Thoát quá trình nhận hàng?",
        "Dữ liệu đếm sẽ bị mất nếu bạn thoát.",
        () => {
          resetSession();
          navigation.dispatch(e.data.action);
        },
        { confirmLabel: "Thoát", confirmColor: "#C62828" }
      );
    });
    return unsubscribe;
  }, [navigation, currentShipmentId, isAnyMutating, isReceivingMode]);

  const handleReceiveAll = () => {
    showDialog(
      "Nhận hàng đầy đủ",
      "Xác nhận tất cả hàng đã nhận đủ, không thiếu và không hỏng?",
      () => receiveAllMutation.mutate(),
      { confirmLabel: "Xác nhận nhận đủ", confirmColor: "#2E7D32" }
    );
  };

  const handleSubmitDetailed = () => {
    const unresolved = getUnresolvedDiscrepancies();
    if (unresolved.length > 0) {
      showDialog(
        "Thiếu bằng chứng",
        `Có ${unresolved.length} mặt hàng sai lệch chưa có ảnh minh chứng. Vui lòng bổ sung trước khi gửi.`,
        () => {},
        { confirmLabel: "Đã hiểu", showCancel: false, confirmColor: "#C62828" }
      );
      return;
    }

    showDialog(
      "Xác nhận gửi báo cáo",
      "Dữ liệu nhận hàng chi tiết (bao gồm sai lệch & ảnh minh chứng) sẽ được gửi lên hệ thống.",
      () => submitMutation.mutate(),
      { confirmLabel: "Gửi báo cáo", confirmColor: "#E65100" }
    );
  };

  const selectedItem = useMemo(() => {
    if (selectedBatchId === null || !shipment) return null;
    return shipment.items.find((i) => i.batchId === selectedBatchId);
  }, [selectedBatchId, shipment]);

  const selectedScanData = useMemo(() => {
    if (selectedBatchId === null) return null;
    return scannedItems[selectedBatchId];
  }, [selectedBatchId, scannedItems]);

  const discrepancyCount = useMemo(() => {
    return Object.values(scannedItems).filter(
      (s) => s.actualQty < s.expectedQty || s.damagedQty > 0
    ).length;
  }, [scannedItems]);

  const hasDiscrepancies = discrepancyCount > 0;

  const canSubmitDetailed = useMemo(() => {
    if (!hasDiscrepancies) return false;
    const unresolved = Object.values(scannedItems).filter(
      (item) =>
        (item.actualQty < item.expectedQty || item.damagedQty > 0) &&
        item.evidenceUrls.length === 0
    );
    return unresolved.length === 0;
  }, [scannedItems, hasDiscrepancies]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E65100" />
        <Text style={{ marginTop: 12 }}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (isError || !shipment) {
    return (
      <View style={styles.centered}>
        <Text>Lỗi tải dữ liệu lô hàng</Text>
        <Button onPress={() => navigation.goBack()}>Quay lại</Button>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[shipment.status] ?? STATUS_COLORS[ShipmentStatus.IN_TRANSIT];
  const statusLabel = STATUS_LABELS[shipment.status] ?? shipment.status;

  if (!isReceivingMode) {
    return (
      <View style={styles.container}>
        <Appbar.Header elevated style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="Chi tiết lô hàng"
            titleStyle={styles.headerTitle}
          />
        </Appbar.Header>

        <Surface style={styles.infoSummary} elevation={1}>
          <View style={styles.infoRow}>
            <Text variant="titleMedium" style={styles.storeName}>
              #{id?.slice(0, 8).toUpperCase()}
            </Text>
            <Chip
              compact
              style={{ backgroundColor: statusColor.bg }}
              textStyle={{ color: statusColor.text, fontWeight: "700", fontSize: 11 }}
            >
              {statusLabel}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.hintText}>
            Ngày tạo: {new Date(shipment.createdAt).toLocaleDateString("vi-VN")}
            {"  •  "}
            {shipment.items.length} sản phẩm
          </Text>
        </Surface>

        <FlatList
          data={shipment.items}
          renderItem={({ item }) => <ReadOnlyItemCard item={item} />}
          keyExtractor={(item) => item.batchId.toString()}
          contentContainerStyle={styles.readonlyList}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: "#999" }}>Không có sản phẩm nào.</Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Kiểm đếm hàng"
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action
          icon="barcode-scan"
          onPress={() => setScannerVisible(true)}
        />
      </Appbar.Header>

      <Surface style={styles.infoSummary} elevation={1}>
        <View style={styles.infoRow}>
          <Text variant="titleMedium" style={styles.storeName}>
            #{id?.slice(0, 8).toUpperCase()}
          </Text>
          <View style={styles.chipRow}>
            <Chip icon="package-variant" style={styles.countChip} compact>
              {shipment.items.length} sản phẩm
            </Chip>
            {hasDiscrepancies && (
              <Chip
                icon="alert-circle-outline"
                style={styles.discrepancyChip}
                textStyle={styles.discrepancyChipText}
                compact
              >
                {discrepancyCount} sai lệch
              </Chip>
            )}
          </View>
        </View>
        <Text variant="bodySmall" style={styles.hintText}>
          Mặc định nhận đủ. Điều chỉnh số lượng nếu có thiếu/hỏng, sau đó bổ
          sung ảnh minh chứng.
        </Text>
      </Surface>

      <FlatList
        data={shipment.items}
        renderItem={({ item }) => (
          <ShipmentItemCard
            item={item}
            actualQty={scannedItems[item.batchId]?.actualQty ?? item.quantity}
            damagedQty={scannedItems[item.batchId]?.damagedQty ?? 0}
            hasEvidence={
              (scannedItems[item.batchId]?.evidenceUrls?.length ?? 0) > 0
            }
            onUpdateQty={(val) => updateActualQty(item.batchId, val)}
            onOpenClaim={() => {
              setSelectedBatchId(item.batchId);
              setClaimModalVisible(true);
            }}
          />
        )}
        keyExtractor={(item) => item.batchId.toString()}
        contentContainerStyle={styles.list}
      />

      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          icon="check-all"
          onPress={handleReceiveAll}
          loading={receiveAllMutation.isPending}
          disabled={hasDiscrepancies || isAnyMutating}
          style={[
            styles.receiveAllBtn,
            (hasDiscrepancies || isAnyMutating) && styles.disabledBtn,
          ]}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          Nhận đầy đủ (không sai lệch)
        </Button>
        <Button
          mode="contained"
          icon="file-document-edit-outline"
          onPress={handleSubmitDetailed}
          loading={submitMutation.isPending}
          disabled={!canSubmitDetailed || isAnyMutating}
          style={[
            styles.submitDetailBtn,
            (!canSubmitDetailed || isAnyMutating) && styles.disabledBtn,
          ]}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          Gửi báo cáo nhận hàng
        </Button>
      </Surface>

      <Portal>
        <Dialog
          visible={dialog.visible}
          onDismiss={closeDialog}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>{dialog.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogMessage}>{dialog.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            {dialog.showCancel && (
              <Button
                onPress={closeDialog}
                textColor="#666"
                style={styles.dialogCancelBtn}
              >
                Hủy
              </Button>
            )}
            <Button
              mode="contained"
              onPress={dialog.onConfirm}
              buttonColor={dialog.confirmColor || "#E65100"}
              style={styles.dialogConfirmBtn}
            >
              {dialog.confirmLabel}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleScanned}
      />

      {selectedItem && (
        <ClaimModal
          visible={claimModalVisible}
          onClose={() => setClaimModalVisible(false)}
          onSubmit={(damagedQty, evidenceUrls) => {
            updateDamagedQty(selectedItem.batchId, damagedQty);
            updateEvidence(selectedItem.batchId, evidenceUrls);
            Toast.show({
              type: "success",
              text1: "Đã lưu thông tin sai lệch",
              text2: selectedItem.productName,
            });
          }}
          productName={selectedItem.productName}
          batchCode={selectedItem.batchCode}
          expectedQty={selectedItem.quantity}
          actualQty={selectedScanData?.actualQty ?? 0}
          initialDamagedQty={selectedScanData?.damagedQty}
          initialEvidence={selectedScanData?.evidenceUrls}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { backgroundColor: "#fff" },
  headerTitle: { fontWeight: "700" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoSummary: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  storeName: { fontWeight: "700", color: "#1a1a1a" },
  chipRow: { flexDirection: "row", gap: 6 },
  countChip: { backgroundColor: "#F5F5F5" },
  discrepancyChip: { backgroundColor: "#FFEBEE" },
  discrepancyChipText: { color: "#C62828", fontWeight: "700", fontSize: 11 },
  hintText: { color: "#666", fontSize: 13, lineHeight: 18 },
  list: { padding: 16, paddingBottom: 160 },
  readonlyList: { padding: 16, paddingBottom: 32 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
  },
  receiveAllBtn: { borderRadius: 14, backgroundColor: "#2E7D32" },
  submitDetailBtn: { borderRadius: 14, backgroundColor: "#E65100" },
  disabledBtn: { backgroundColor: "#BDBDBD" },
  btnContent: { height: 50 },
  btnLabel: { fontSize: 15, fontWeight: "700" },
  dialog: { borderRadius: 16, backgroundColor: "#fff" },
  dialogTitle: { fontWeight: "700", fontSize: 18 },
  dialogMessage: { fontSize: 14, lineHeight: 22, color: "#444" },
  dialogActions: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  dialogCancelBtn: { borderRadius: 8 },
  dialogConfirmBtn: { borderRadius: 8 },
  readonlyCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 1,
  },
  readonlyCardContent: { padding: 14 },
  readonlyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  readonlyProductName: { fontWeight: "700", color: "#333" },
  readonlyBatchCode: { color: "#777", marginTop: 2 },
  unitChip: { backgroundColor: "#F5F5F5" },
  readonlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  readonlyField: { flex: 1, alignItems: "center" },
  readonlyLabel: {
    color: "#888",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  readonlyValue: { fontWeight: "700", color: "#333" },
  readonlyValueSmall: { fontWeight: "600", color: "#555", fontSize: 13 },
});
