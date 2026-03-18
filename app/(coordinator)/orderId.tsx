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
    List,
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

    return (
        <View style={styles.container}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Chi tiết đơn hàng" subtitle={orderId ? `#${orderId}` : undefined} />
                <Appbar.Action icon="refresh" onPress={fetchReview} disabled={isLoading || !orderId} />
            </Appbar.Header>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator animating size="large" />
                    <Text style={styles.muted}>Đang tải dữ liệu...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text>{error}</Text>
                    <Button style={styles.mt12} mode="contained" onPress={() => router.back()}>
                        Quay lại
                    </Button>
                </View>
            ) : !review ? (
                <View style={styles.center}>
                    <Text>Không có dữ liệu</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Card>
                        <Card.Title title={review.storeName} subtitle={`Trạng thái: ${review.status}`} />
                        <Card.Content>
                            <Text variant="bodyMedium">Mã đơn: {review.orderId}</Text>
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Title title="Danh sách sản phẩm" />
                        <Card.Content>
                            {review.items.map((item) => (
                                <View key={item.productId} style={styles.itemRow}>
                                    <List.Item
                                        title={item.productName}
                                        description={`Yêu cầu: ${item.requestedQty} • Tồn kho: ${item.currentStock}`}
                                        left={(props) => <List.Icon {...props} icon={item.canFulfill ? "check-circle-outline" : "alert-circle-outline"} />}
                                    />
                                    <Divider />
                                </View>
                            ))}
                        </Card.Content>
                    </Card>

                    {approveResult ? (
                        <Card>
                            <Card.Title title="Kết quả duyệt" subtitle={`Trạng thái: ${approveResult.status}`} />
                            <Card.Content>
                                {approveResult.results.map((r) => (
                                    <View key={r.productId} style={styles.resultRow}>
                                        <Text variant="bodyMedium">Product #{r.productId}</Text>
                                        <Text style={styles.muted}>Requested: {r.requested} • Approved: {r.approved} • Missing: {r.missing}</Text>
                                        <Divider style={styles.mt8} />
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>
                    ) : null}

                    <Card>
                        <Card.Title title="Xử lý đơn" subtitle={canReview ? "Duyệt hoặc từ chối đơn" : "Đơn không ở trạng thái pending"} />
                        <Card.Content>
                            <View style={styles.switchRow}>
                                <Text>Force approve</Text>
                                <Switch value={forceApprove} onValueChange={setForceApprove} disabled={!canReview || isSubmitting} />
                            </View>
                            <HelperText type="info">
                                Bật khi hệ thống yêu cầu xác nhận duyệt dù tỷ lệ đáp ứng &lt; 20%.
                            </HelperText>

                            <TextInput
                                mode="outlined"
                                label="Lý do từ chối"
                                placeholder="Nhập lý do..."
                                value={rejectReason}
                                onChangeText={setRejectReason}
                                multiline
                                numberOfLines={3}
                                style={styles.mt12}
                                disabled={!canReview || isSubmitting}
                            />

                            <View style={styles.actionsRow}>
                                <Button
                                    mode="contained"
                                    onPress={handleApprove}
                                    loading={isSubmitting}
                                    disabled={!canReview || isSubmitting}
                                    icon="check"
                                    style={styles.actionBtn}
                                >
                                    Approve
                                </Button>

                                <Button
                                    mode="outlined"
                                    onPress={handleReject}
                                    loading={isSubmitting}
                                    disabled={!canReview || isSubmitting || !rejectReason.trim()}
                                    icon="close"
                                    style={styles.actionBtn}
                                >
                                    Reject
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 12, paddingBottom: 32 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, gap: 12 },
    muted: { opacity: 0.7 },
    mt12: { marginTop: 12 },
    mt8: { marginTop: 8 },
    itemRow: { overflow: "hidden" },
    resultRow: { paddingVertical: 6 },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    actionsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
    actionBtn: { flex: 1 },
});

