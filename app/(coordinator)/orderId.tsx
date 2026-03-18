import { claimApi } from "@/src/apis/claim.api";
import { orderApi } from "@/src/apis/order.api";
import { shipmentApi } from "@/src/apis/shipment.api";
import type { ClaimDetail } from "@/src/types/claim";
import type {
    ApproveOrderResponse,
    CoordinatorOrderReview,
} from "@/src/types/order";
import type { ShipmentDetail } from "@/src/types/shipment";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Appbar,
    Button,
    Card,
    Divider,
    HelperText,
    Icon,
    Switch,
    Text,
    TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";

export default function CoordinatorOrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();

  const orderId = useMemo(() => {
    const raw = params.orderId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.orderId]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [review, setReview] = useState<CoordinatorOrderReview | null>(null);
  const [approveResult, setApproveResult] =
    useState<ApproveOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [isLoadingShipment, setIsLoadingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [isLoadingClaim, setIsLoadingClaim] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isResolvingClaim, setIsResolvingClaim] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  const [forceApprove, setForceApprove] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const canReview = review?.status === "pending";

  const fetchReview = useCallback(async () => {
    if (!orderId) return;
    try {
      setError(null);
      setIsLoading(true);
      const data = await orderApi.getCoordinatorReview(orderId);
      setReview(data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const fetchShipment = useCallback(async () => {
    if (!orderId) {
      setShipment(null);
      return;
    }

    try {
      setShipmentError(null);
      setIsLoadingShipment(true);

      const list = await shipmentApi.list({ search: orderId, limit: 10 });
      const items = list?.items || [];
      const matched = items.find((s) => s.orderId === orderId) || items[0];

      if (!matched?.id) {
        setShipment(null);
        return;
      }

      const detail = await shipmentApi.getById(matched.id);
      setShipment(detail);
    } catch (err: any) {
      setShipment(null);
      setShipmentError(err?.message || "Không thể tải tiến độ vận chuyển");
    } finally {
      setIsLoadingShipment(false);
    }
  }, [orderId]);

  const fetchClaim = useCallback(
    async (shipmentId?: string) => {
      const id = shipmentId || shipment?.id;
      if (!id) {
        setClaim(null);
        setClaimError(null);
        return;
      }

      try {
        setClaimError(null);
        setIsLoadingClaim(true);

        // Backend hiện chưa hỗ trợ filter claim theo shipmentId, nên FE lọc client-side.
        const list = await claimApi.list({ page: 1, limit: 50 });
        const matched = (list?.items || []).find((c) => c.shipmentId === id);

        if (!matched?.id) {
          setClaim(null);
          return;
        }

        const detail = await claimApi.getById(matched.id);
        setClaim(detail);
      } catch (err: any) {
        setClaim(null);
        setClaimError(err?.message || "Không thể tải khiếu nại");
      } finally {
        setIsLoadingClaim(false);
      }
    },
    [shipment?.id],
  );

  useEffect(() => {
    if (!orderId) return;
    fetchShipment();
  }, [fetchShipment, orderId]);

  useEffect(() => {
    if (!shipment?.id) {
      setClaim(null);
      return;
    }
    fetchClaim(shipment.id);
  }, [fetchClaim, shipment?.id]);

  const getShipmentStatusConfig = (status?: string) => {
    switch (status) {
      case "preparing":
        return { bg: "#FFF3E0", text: "#E65100", label: "Đang chuẩn bị" };
      case "in_transit":
        return { bg: "#E3F2FD", text: "#1565C0", label: "Đang vận chuyển" };
      case "delivered":
        return { bg: "#E8F5E9", text: "#2E7D32", label: "Đã giao" };
      case "completed":
        return { bg: "#E8F5E9", text: "#388E3C", label: "Hoàn tất" };
      default:
        return { bg: "#F5F5F5", text: "#616161", label: status || "Không rõ" };
    }
  };

  const getClaimStatusConfig = (status?: string) => {
    switch (status) {
      case "pending":
        return { bg: "#FEF3C6", text: "#BB4D00", label: "Chờ xử lý" };
      case "approved":
        return { bg: "#DBFCE7", text: "#008236", label: "Đã duyệt" };
      case "rejected":
        return { bg: "#FFE2E2", text: "#C10007", label: "Từ chối" };
      default:
        return { bg: "#F5F5F5", text: "#616161", label: status || "Không rõ" };
    }
  };

  const renderShipmentProgress = () => {
    const steps = [
      { key: "preparing", label: "Chuẩn bị" },
      { key: "in_transit", label: "Vận chuyển" },
      { key: "delivered", label: "Đã giao" },
      { key: "completed", label: "Hoàn tất" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === shipment?.status);

    return (
      <View style={styles.progressRow}>
        {steps.map((step, index) => {
          const isDone = currentIndex >= 0 && index <= currentIndex;
          return (
            <View key={step.key} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  isDone ? styles.progressDotActive : styles.progressDotIdle,
                ]}
              />
              <Text
                style={[
                  styles.progressLabel,
                  isDone
                    ? styles.progressLabelActive
                    : styles.progressLabelIdle,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const handleResolveClaim = useCallback(
    async (status: "approved" | "rejected") => {
      if (!claim?.id) return;
      try {
        setIsResolvingClaim(true);
        await claimApi.resolve(claim.id, {
          status,
          resolutionNote: resolutionNote.trim() || undefined,
        });
        Toast.show({
          type: "success",
          text1: "Đã xử lý khiếu nại",
          text2: status === "approved" ? "Đã duyệt" : "Đã từ chối",
        });
        await fetchClaim(shipment?.id);
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Xử lý khiếu nại thất bại",
          text2: err?.message || "Vui lòng thử lại",
        });
      } finally {
        setIsResolvingClaim(false);
      }
    },
    [claim?.id, fetchClaim, resolutionNote, shipment?.id],
  );

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      setError("Thiếu orderId. Vui lòng quay lại danh sách và chọn đơn hàng.");
      return;
    }
    fetchReview();
  }, [orderId, fetchReview]);

  const handleApprove = useCallback(async () => {
    if (!orderId) return;
    try {
      setIsSubmitting(true);
      setApproveResult(null);
      const result = await orderApi.approveCoordinator(orderId, {
        force_approve: forceApprove || undefined,
      });
      setApproveResult(result);
      Toast.show({
        type: "success",
        text1: "Duyệt đơn thành công",
        text2: `Trạng thái: ${result.status}`,
      });
      await fetchReview();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Duyệt đơn thất bại",
        text2: err?.message || "Vui lòng thử lại",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [orderId, forceApprove, fetchReview]);

  const handleReject = useCallback(async () => {
    if (!orderId) return;
    if (!rejectReason.trim()) return;

    try {
      setIsSubmitting(true);
      setApproveResult(null);
      const result = await orderApi.rejectCoordinator(orderId, {
        reason: rejectReason.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Đã từ chối đơn",
        text2: `Trạng thái: ${result.status}`,
      });
      router.back();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Từ chối thất bại",
        text2: err?.message || "Vui lòng thử lại",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [orderId, rejectReason]);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return { bg: "#FEF3C6", text: "#BB4D00" };
      case "approved":
        return { bg: "#DBFCE7", text: "#008236" };
      case "rejected":
        return { bg: "#FFE2E2", text: "#C10007" };
      case "delivering":
        return { bg: "#DBEAFE", text: "#1447E6" };
      case "delivered":
        return { bg: "#E0E0E0", text: "#616161" };
      case "cancelled":
        return { bg: "#E0E0E0", text: "#616161" };
      default:
        return { bg: "#F5F5F5", text: "#616161" };
    }
  };

  if (isLoading || (!review && !error)) {
    return (
      <View style={styles.container}>
        <Appbar.Header elevated style={{ backgroundColor: "#1565C0" }}>
          <Appbar.BackAction color="#fff" onPress={() => router.back()} />
          <Appbar.Content title="Chi tiết Đơn hàng" color="#fff" />
        </Appbar.Header>
        <View style={styles.center}>
          <ActivityIndicator animating size="large" color="#1565C0" />
          <Text style={styles.mutedText}>Đang tải dữ liệu...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
          <Appbar.BackAction color="#fff" onPress={() => router.back()} />
          <Appbar.Content title="Lỗi" color="#fff" />
        </Appbar.Header>
        <View style={styles.center}>
          <Icon source="alert-circle-outline" size={64} color="#D32F2F" />
          <Text
            style={[styles.mutedText, { marginTop: 12, textAlign: "center" }]}
          >
            {error}
          </Text>
          <Button
            style={{ marginTop: 24 }}
            mode="contained"
            onPress={() => router.back()}
            buttonColor="#E65100"
          >
            Quay lại
          </Button>
        </View>
      </View>
    );
  }

  const statusObj = getStatusColor(review?.status);

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title={`Đơn ${orderId?.slice(0, 8)}...`} color="#fff" />
        <Appbar.Action
          icon="refresh"
          color="#fff"
          onPress={fetchReview}
          disabled={isLoading || !orderId}
        />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* General Info */}
        <Card style={styles.infoCard} mode="elevated">
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Thông tin chung</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}
              >
                <Text style={[styles.statusText, { color: statusObj.text }]}>
                  {review?.status || "Không rõ"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon source="store" size={20} color="#1565C0" />
              <Text style={styles.infoText}>
                {review?.storeName || "Cửa hàng không xác định"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="clipboard-text" size={20} color="#1565C0" />
              <Text style={styles.infoText}>Mã: {review?.orderId}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Items List */}
        <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 8 }]}>
          Danh sách sản phẩm ({review?.items?.length || 0})
        </Text>

        <Card style={styles.itemsCard} mode="elevated">
          {review?.items.map((item, index) => (
            <View key={item.productId || index}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.productName || `Sản phẩm ${item.productId}`}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <Icon
                      source={"warehouse"}
                      size={16}
                      color={item.canFulfill ? "#388E3C" : "#D32F2F"}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        marginLeft: 6,
                        color: item.canFulfill ? "#388E3C" : "#D32F2F",
                        fontWeight: "700",
                      }}
                    >
                      Tồn kho hiện có: {item.currentStock}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemQtyContainer}>
                  <Text style={styles.itemQtyText}>
                    Yêu cầu:{" "}
                    <Text style={styles.qtyHighlight}>{item.requestedQty}</Text>
                  </Text>
                </View>
              </View>
              {index < (review?.items?.length || 0) - 1 && <Divider />}
            </View>
          ))}
          {(!review?.items || review.items.length === 0) && (
            <View style={styles.emptyItemContainer}>
              <Text style={styles.emptyItemText}>
                Không có dữ liệu sản phẩm.
              </Text>
            </View>
          )}
        </Card>

        {approveResult ? (
          <Card style={[styles.infoCard, { marginTop: 16 }]} mode="elevated">
            <Card.Title
              title="Kết quả duyệt"
              subtitle={`Trạng thái: ${approveResult.status}`}
            />
            <Card.Content>
              {approveResult.results.map((r, i) => (
                <View key={r.productId || i} style={{ paddingVertical: 8 }}>
                  <Text style={{ fontWeight: "bold", fontSize: 15 }}>
                    Product #{r.productId}
                  </Text>
                  <Text style={{ color: "#666", marginTop: 4 }}>
                    Y/C: {r.requested} • Đã duyệt:{" "}
                    <Text style={{ color: "#388E3C", fontWeight: "bold" }}>
                      {r.approved}
                    </Text>{" "}
                    • Thiếu:{" "}
                    <Text style={{ color: "#D32F2F", fontWeight: "bold" }}>
                      {r.missing}
                    </Text>
                  </Text>
                  {i < approveResult.results.length - 1 && (
                    <Divider style={{ marginTop: 12 }} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : null}

        {/* Shipment Tracking */}
        <Card style={[styles.infoCard, { marginTop: 16 }]} mode="elevated">
          <Card.Title
            title="Tiến độ vận chuyển"
            subtitle="Theo dõi trạng thái shipment theo đơn"
          />
          <Card.Content>
            {isLoadingShipment ? (
              <View style={styles.inlineCenterRow}>
                <ActivityIndicator animating size="small" color="#1565C0" />
                <Text style={styles.inlineCenterText}>Đang tải tiến độ...</Text>
              </View>
            ) : shipmentError ? (
              <Text style={styles.errorInlineText}>{shipmentError}</Text>
            ) : shipment ? (
              <View>
                <View style={styles.headerRow}>
                  <Text style={styles.sectionTitle}>Shipment</Text>
                  {(() => {
                    const cfg = getShipmentStatusConfig(shipment.status);
                    return (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: cfg.text }]}>
                          {cfg.label}
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                <View style={styles.infoRow}>
                  <Icon source="truck-fast-outline" size={20} color="#1565C0" />
                  <Text style={styles.infoText}>
                    Mã shipment: {shipment.id}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon source="calendar-outline" size={20} color="#1565C0" />
                  <Text style={styles.infoText}>
                    Tạo lúc:{" "}
                    {shipment.createdAt
                      ? new Date(shipment.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </Text>
                </View>

                {renderShipmentProgress()}

                <Text
                  style={[styles.sectionTitle, { marginTop: 14, fontSize: 16 }]}
                >
                  Hàng hóa ({shipment.items?.length || 0})
                </Text>
                {(shipment.items || []).map((it, index) => (
                  <View
                    key={`${it.batchId}-${index}`}
                    style={{ paddingVertical: 8 }}
                  >
                    <Text style={{ fontWeight: "700", color: "#111827" }}>
                      {it.productName || `Sản phẩm #${it.productId || "—"}`}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 4 }}>
                      Batch: {it.batchCode || it.batchId} • SL: {it.quantity}
                      {it.expiryDate
                        ? ` • HSD: ${new Date(it.expiryDate).toLocaleDateString("vi-VN")}`
                        : ""}
                    </Text>
                    {index < (shipment.items?.length || 0) - 1 ? (
                      <Divider style={{ marginTop: 12 }} />
                    ) : null}
                  </View>
                ))}

                {!shipment.items || shipment.items.length === 0 ? (
                  <Text style={styles.mutedText}>
                    Không có dữ liệu hàng hóa.
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.mutedText}>
                Chưa có shipment cho đơn này (chỉ tạo sau khi duyệt).
              </Text>
            )}

            <Button
              mode="outlined"
              icon="refresh"
              style={{ marginTop: 14, borderRadius: 12 }}
              onPress={fetchShipment}
              disabled={isLoadingShipment}
            >
              Làm mới
            </Button>
          </Card.Content>
        </Card>

        {/* Issues / Claims */}
        <Card style={[styles.infoCard, { marginTop: 16 }]} mode="elevated">
          <Card.Title
            title="Vấn đề phát sinh"
            subtitle="Khiếu nại (thiếu/hỏng) và xử lý"
          />
          <Card.Content>
            {!shipment?.id ? (
              <Text style={styles.mutedText}>
                Cần có shipment để xem khiếu nại.
              </Text>
            ) : isLoadingClaim ? (
              <View style={styles.inlineCenterRow}>
                <ActivityIndicator animating size="small" color="#1565C0" />
                <Text style={styles.inlineCenterText}>
                  Đang tải khiếu nại...
                </Text>
              </View>
            ) : claimError ? (
              <Text style={styles.errorInlineText}>{claimError}</Text>
            ) : claim ? (
              <View>
                <View style={styles.headerRow}>
                  <Text style={styles.sectionTitle}>Claim</Text>
                  {(() => {
                    const cfg = getClaimStatusConfig(claim.status);
                    return (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: cfg.text }]}>
                          {cfg.label}
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                <View style={styles.infoRow}>
                  <Icon
                    source="alert-circle-outline"
                    size={20}
                    color="#1565C0"
                  />
                  <Text style={styles.infoText}>Mã claim: {claim.id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon source="truck-outline" size={20} color="#1565C0" />
                  <Text style={styles.infoText}>
                    Shipment: {claim.shipmentId}
                  </Text>
                </View>

                <Text
                  style={[styles.sectionTitle, { marginTop: 12, fontSize: 16 }]}
                >
                  Chi tiết
                </Text>
                {(claim.items || []).map((it, index) => (
                  <View
                    key={`${it.productName || "item"}-${index}`}
                    style={{ paddingVertical: 8 }}
                  >
                    <Text style={{ fontWeight: "700", color: "#111827" }}>
                      {it.productName || "Sản phẩm"}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 4 }}>
                      Thiếu: {it.quantityMissing} • Hỏng: {it.quantityDamaged}
                    </Text>
                    {it.reason ? (
                      <Text style={{ color: "#6b7280", marginTop: 4 }}>
                        Lý do: {it.reason}
                      </Text>
                    ) : null}
                    {index < (claim.items?.length || 0) - 1 ? (
                      <Divider style={{ marginTop: 12 }} />
                    ) : null}
                  </View>
                ))}

                {claim.status === "pending" ? (
                  <View style={{ marginTop: 12 }}>
                    <TextInput
                      mode="outlined"
                      label="Ghi chú xử lý (tuỳ chọn)"
                      value={resolutionNote}
                      onChangeText={setResolutionNote}
                      multiline
                      numberOfLines={2}
                      style={{ backgroundColor: "#fafafa" }}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#1565C0"
                      editable={!isResolvingClaim}
                    />
                    <View style={styles.actionsRow}>
                      <Button
                        mode="contained"
                        onPress={() => handleResolveClaim("approved")}
                        loading={isResolvingClaim}
                        disabled={isResolvingClaim}
                        icon="check"
                        style={[styles.actionBtn, { borderRadius: 12 }]}
                        buttonColor="#388E3C"
                      >
                        Duyệt
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleResolveClaim("rejected")}
                        loading={isResolvingClaim}
                        disabled={isResolvingClaim}
                        icon="close"
                        style={[
                          styles.actionBtn,
                          { borderRadius: 12, borderColor: "#D32F2F" },
                        ]}
                        textColor="#D32F2F"
                      >
                        Từ chối
                      </Button>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.mutedText}>
                Chưa ghi nhận khiếu nại cho shipment này.
              </Text>
            )}

            <Button
              mode="outlined"
              icon="refresh"
              style={{ marginTop: 14, borderRadius: 12 }}
              onPress={() => fetchClaim(shipment?.id)}
              disabled={isLoadingClaim || !shipment?.id}
            >
              Làm mới
            </Button>
          </Card.Content>
        </Card>

        {/* Final Actions */}
        <Card style={[styles.infoCard, { marginTop: 16 }]} mode="elevated">
          <Card.Title
            title="Xử lý đơn"
            subtitle={
              canReview
                ? "Duyệt hoặc từ chối đơn hàng này"
                : "Đơn hàng đã được xử lý"
            }
          />
          <Card.Content>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#1A1A1A" }}
                >
                  Force approve
                </Text>
                <HelperText type="info" padding="none" style={{ marginTop: 4 }}>
                  Bật tính năng này nếu hệ thống yêu cầu xác nhận duyệt khi tỷ
                  lệ đáp ứng &lt; 20%.
                </HelperText>
              </View>
              <Switch
                value={forceApprove}
                onValueChange={setForceApprove}
                disabled={!canReview || isSubmitting}
                color="#1565C0"
              />
            </View>

            <TextInput
              mode="outlined"
              label="Lý do từ chối (bắt buộc nếu từ chối)"
              placeholder="Nhập lý do chi tiết..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: "#fafafa", marginTop: 16 }}
              disabled={!canReview || isSubmitting}
              outlineColor="#E0E0E0"
              activeOutlineColor="#1565C0"
            />

            <View style={styles.actionsRow}>
              <Button
                mode="contained"
                onPress={handleApprove}
                loading={isSubmitting}
                disabled={!canReview || isSubmitting}
                icon="check"
                style={[styles.actionBtn, { borderRadius: 12 }]}
                buttonColor="#388E3C"
              >
                Duyệt Đơn
              </Button>

              <Button
                mode="outlined"
                onPress={handleReject}
                loading={isSubmitting}
                disabled={!canReview || isSubmitting || !rejectReason.trim()}
                icon="close"
                style={[
                  styles.actionBtn,
                  { borderRadius: 12, borderColor: "#D32F2F" },
                ]}
                textColor="#D32F2F"
              >
                Từ Chối
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8" },
  content: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  mutedText: { color: "#666", fontSize: 15, marginTop: 12 },
  inlineCenterRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inlineCenterText: { color: "#666", fontSize: 14 },
  errorInlineText: { color: "#D32F2F", fontSize: 14 },
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
  },
  itemQtyContainer: {
    alignItems: "flex-end",
  },
  itemQtyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  qtyHighlight: {
    fontWeight: "bold",
    color: "#1565C0",
  },
  emptyItemContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyItemText: {
    color: "#888",
    fontStyle: "italic",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  actionBtn: { flex: 1 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: "#1565C0",
  },
  progressDotIdle: {
    backgroundColor: "#D1D5DB",
  },
  progressLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  progressLabelActive: {
    color: "#1565C0",
    fontWeight: "700",
  },
  progressLabelIdle: {
    color: "#6b7280",
    fontWeight: "600",
  },
});
