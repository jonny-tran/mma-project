import { orderApi } from "@/src/apis/order.api";
import type { ApproveOrderResponse, CoordinatorOrderReview } from "@/src/types/order";
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
    const [approveResult, setApproveResult] = useState<ApproveOrderResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            case "pending": return { bg: "#FEF3C6", text: "#BB4D00" };
            case "approved": return { bg: "#DBFCE7", text: "#008236" };
            case "rejected": return { bg: "#FFE2E2", text: "#C10007" };
            case "delivering": return { bg: "#DBEAFE", text: "#1447E6" };
            case "delivered": return { bg: "#E0E0E0", text: "#616161" };
            case "cancelled": return { bg: "#E0E0E0", text: "#616161" };
            default: return { bg: "#F5F5F5", text: "#616161" };
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
                    <Text style={[styles.mutedText, { marginTop: 12, textAlign: "center" }]}>{error}</Text>
                    <Button style={{ marginTop: 24 }} mode="contained" onPress={() => router.back()} buttonColor="#E65100">
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
                <Appbar.Action icon="refresh" color="#fff" onPress={fetchReview} disabled={isLoading || !orderId} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* General Info */}
                <Card style={styles.infoCard} mode="elevated">
                    <Card.Content>
                        <View style={styles.headerRow}>
                            <Text style={styles.sectionTitle}>Thông tin chung</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
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
                                    <Text style={styles.itemName}>{item.productName || `Sản phẩm ${item.productId}`}</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                                        <Icon source={item.canFulfill ? "check-circle" : "alert-circle"} size={16} color={item.canFulfill ? "#388E3C" : "#D32F2F"} />
                                        <Text style={{ fontSize: 13, color: "#666", marginLeft: 4 }}>
                                            {item.canFulfill ? "Đủ hàng" : "Thiếu hàng"}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.itemQtyContainer}>
                                    <Text style={styles.itemQtyText}>
                                        Yêu cầu: <Text style={styles.qtyHighlight}>{item.requestedQty}</Text>
                                    </Text>
                                    <Text style={styles.itemQtyText}>
                                        Tồn kho: <Text style={item.currentStock > 0 ? { color: "#388E3C", fontWeight: "bold" } : { color: "#D32F2F", fontWeight: "bold" }}>{item.currentStock}</Text>
                                    </Text>
                                </View>
                            </View>
                            {index < (review?.items?.length || 0) - 1 && <Divider />}
                        </View>
                    ))}
                    {(!review?.items || review.items.length === 0) && (
                        <View style={styles.emptyItemContainer}>
                            <Text style={styles.emptyItemText}>Không có dữ liệu sản phẩm.</Text>
                        </View>
                    )}
                </Card>

                {approveResult ? (
                    <Card style={[styles.infoCard, { marginTop: 16 }]} mode="elevated">
                        <Card.Title title="Kết quả duyệt" subtitle={`Trạng thái: ${approveResult.status}`} />
                        <Card.Content>
                            {approveResult.results.map((r, i) => (
                                <View key={r.productId || i} style={{ paddingVertical: 8 }}>
                                    <Text style={{ fontWeight: "bold", fontSize: 15 }}>Product #{r.productId}</Text>
                                    <Text style={{ color: "#666", marginTop: 4 }}>
                                        Y/C: {r.requested} • Đã duyệt: <Text style={{ color: "#388E3C", fontWeight: "bold" }}>{r.approved}</Text> • Thiếu: <Text style={{ color: "#D32F2F", fontWeight: "bold" }}>{r.missing}</Text>
                                    </Text>
                                    {i < approveResult.results.length - 1 && <Divider style={{ marginTop: 12 }} />}
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                ) : null}

                {/* Final Actions */}
                <Card style={[styles.infoCard, { marginTop: 16 }]} mode="elevated">
                    <Card.Title 
                        title="Xử lý đơn" 
                        subtitle={canReview ? "Duyệt hoặc từ chối đơn hàng này" : "Đơn hàng đã được xử lý"} 
                    />
                    <Card.Content>
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A1A" }}>Force approve</Text>
                                <HelperText type="info" padding="none" style={{ marginTop: 4 }}>
                                    Bật tính năng này nếu hệ thống yêu cầu xác nhận duyệt khi tỷ lệ đáp ứng &lt; 20%.
                                </HelperText>
                            </View>
                            <Switch value={forceApprove} onValueChange={setForceApprove} disabled={!canReview || isSubmitting} color="#1565C0" />
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
                                style={[styles.actionBtn, { borderRadius: 12, borderColor: "#D32F2F" }]}
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
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
    mutedText: { color: "#666", fontSize: 15, marginTop: 12 },
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
        marginTop: 8
    },
    actionsRow: { 
        flexDirection: "row", 
        gap: 16, 
        marginTop: 24,
        marginBottom: 8
    },
    actionBtn: { flex: 1 },
});
