import { orderApi } from "@/src/apis/order.api";
import { OrderListQuery, OrderSummary } from "@/src/types/order";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Card,
  Icon,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Toast from "react-native-toast-message";

// Định nghĩa cấu hình màu sắc và text cho các trạng thái
const ORDER_STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; text: string }
> = {
  pending: { color: "#BB4D00", bg: "#FEF3C6", text: "Đang chờ" },
  approved: { color: "#008236", bg: "#DBFCE7", text: "Đã duyệt" },
  rejected: { color: "#C10007", bg: "#FFE2E2", text: "Đã từ chối" },
  delivering: { color: "#1447E6", bg: "#DBEAFE", text: "Đang giao" },
  in_transit: { color: "#1447E6", bg: "#DBEAFE", text: "Đang vận chuyển" },
  transit: { color: "#1447E6", bg: "#DBEAFE", text: "Đang vận chuyển" },
  cancelled: { color: "#616161", bg: "#E0E0E0", text: "Đã hủy" },
  delivered: { color: "#616161", bg: "#E0E0E0", text: "Đã giao" },
  picking: { color: "#616161", bg: "#E0E0E0", text: "Đang lấy hàng" },
  completed: { color: "#616161", bg: "#E0E0E0", text: "Hoàn tất" },
  claimed: { color: "#616161", bg: "#E0E0E0", text: "Đã khiếu nại" },
};

const FILTER_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "delivering",
  "in_transit",
  "delivered",
  "cancelled",
  "completed",
];

export default function CoordinatorOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [deliveryDateText, setDeliveryDateText] = useState("");
  const [activeDeliveryDate, setActiveDeliveryDate] = useState<string | null>(
    null,
  );
  const deliveryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastInvalidDeliveryRef = useRef<string | null>(null);

  const handleDeliveryDateTextChange = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8); // DDMMYYYY
    if (digits.length <= 2) {
      setDeliveryDateText(digits);
      return;
    }

    if (digits.length <= 4) {
      setDeliveryDateText(`${digits.slice(0, 2)}/${digits.slice(2)}`);
      return;
    }

    setDeliveryDateText(
      `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`,
    );
  }, []);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const fetchOrders = useCallback(async (params?: OrderListQuery) => {
    try {
      const data = await orderApi.list(params);
      setOrders(data?.items || []);
    } catch (error: any) {
      console.warn("Lỗi tải danh sách đơn hàng:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi hệ thống",
        text2: error?.message || "Không thể lấy danh sách đơn hàng",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchOrders().finally(() => setIsLoading(false));
    }, [fetchOrders]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders(activeDeliveryDate ? { limit: 200 } : undefined);
    setIsRefreshing(false);
  }, [activeDeliveryDate, fetchOrders]);

  const parseDeliveryDateInput = useCallback((raw: string) => {
    const value = raw.trim();
    if (!value) return null; // empty

    // Accept DD/MM/YYYY (same as UI display). We also allow '-' as separator.
    const match = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!match) return null; // incomplete (user still typing)

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    )
      return undefined;
    if (month < 1 || month > 12) return undefined;
    if (day < 1 || day > 31) return undefined;

    const normalized = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const date = new Date(`${normalized}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return undefined;

    // Validate actual calendar date (e.g. 2026-02-30 is invalid)
    const yyyy = date.getUTCFullYear();
    const mm = date.getUTCMonth() + 1;
    const dd = date.getUTCDate();
    if (yyyy !== year || mm !== month || dd !== day) return undefined;

    return normalized;
  }, []);

  const formatYmdToDmy = useCallback((ymd: string) => {
    const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return ymd;
    return `${match[3]}/${match[2]}/${match[1]}`;
  }, []);

  const clearDeliveryDateFilter = useCallback(async () => {
    if (deliveryDebounceRef.current) {
      clearTimeout(deliveryDebounceRef.current);
      deliveryDebounceRef.current = null;
    }
    setDeliveryDateText("");
    setActiveDeliveryDate(null);
    setIsLoading(true);
    await fetchOrders().finally(() => setIsLoading(false));
  }, [fetchOrders]);

  useEffect(() => {
    if (deliveryDebounceRef.current) {
      clearTimeout(deliveryDebounceRef.current);
      deliveryDebounceRef.current = null;
    }

    const raw = deliveryDateText;
    const trimmed = raw.trim();

    if (!trimmed) {
      if (activeDeliveryDate) {
        setActiveDeliveryDate(null);
        setIsLoading(true);
        fetchOrders().finally(() => setIsLoading(false));
      }
      return;
    }

    deliveryDebounceRef.current = setTimeout(() => {
      const normalized = parseDeliveryDateInput(trimmed);

      // Incomplete input: wait until user types full date
      if (normalized === null) return;

      // Invalid input: show toast once per value
      if (normalized === undefined) {
        if (lastInvalidDeliveryRef.current !== trimmed) {
          lastInvalidDeliveryRef.current = trimmed;
          Toast.show({
            type: "info",
            text1: "Ngày giao không hợp lệ",
            text2: "Nhập theo DD/MM/YYYY (ví dụ 19/03/2026)",
          });
        }
        return;
      }

      lastInvalidDeliveryRef.current = null;

      if (normalized !== activeDeliveryDate) {
        setActiveDeliveryDate(normalized);
        setIsLoading(true);
        // Fetch broadly, then filter client-side (some backends ignore or mis-handle fromDate/toDate)
        fetchOrders({ limit: 200 }).finally(() => setIsLoading(false));
      }
    }, 300);

    return () => {
      if (deliveryDebounceRef.current) {
        clearTimeout(deliveryDebounceRef.current);
        deliveryDebounceRef.current = null;
      }
    };
  }, [
    deliveryDateText,
    activeDeliveryDate,
    parseDeliveryDateInput,
    fetchOrders,
  ]);

  const deliveryInputHint = useMemo(() => {
    const trimmed = deliveryDateText.trim();
    if (!trimmed) return null;
    if (activeDeliveryDate) return null;
    // If user typed something but it's not a complete parsable date yet
    const parsed = parseDeliveryDateInput(trimmed);
    if (parsed === null) return "Nhập đủ ngày theo dạng DD/MM/YYYY để lọc.";
    return null;
  }, [deliveryDateText, activeDeliveryDate, parseDeliveryDateInput]);

  const getOrderDeliveryYmd = useCallback((deliveryDateRaw?: string | null) => {
    if (!deliveryDateRaw) return null;

    // If backend already returns date-only, keep it as-is.
    if (/^\d{4}-\d{2}-\d{2}$/.test(deliveryDateRaw)) return deliveryDateRaw;

    // If it's a timestamp (ISO), align with what the UI displays (local calendar day).
    const date = new Date(deliveryDateRaw);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Lọc dữ liệu (ưu tiên client-side để chắc chắn đúng, kể cả khi backend bỏ qua fromDate/toDate)
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = orders;

    if (activeDeliveryDate) {
      result = result.filter(
        (order) =>
          getOrderDeliveryYmd(order.deliveryDate) === activeDeliveryDate,
      );
    }

    if (selectedStatuses.length === 0) return result;
    return result.filter((order) => selectedStatuses.includes(order.status));
  }, [orders, selectedStatuses, activeDeliveryDate, getOrderDeliveryYmd]);

  const renderFilterChips = () => (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContainer}
      >
        <TouchableOpacity
          key="__all__"
          onPress={() => setSelectedStatuses([])}
          style={[
            styles.filterChip,
            selectedStatuses.length === 0 && {
              borderColor: theme.colors.primary,
              backgroundColor: "#fff",
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatuses.length === 0 && {
                color: theme.colors.primary,
                fontWeight: "bold",
              },
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        {FILTER_STATUSES.map((status) => {
          const config = ORDER_STATUS_CONFIG[status];
          if (!config) return null;
          const isActive = selectedStatuses.includes(status);

          return (
            <TouchableOpacity
              key={status}
              onPress={() => toggleStatus(status)}
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: config.bg,
                  borderColor: config.color,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && { color: config.color, fontWeight: "bold" },
                ]}
              >
                {config.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderOrderItem = ({ item }: { item: OrderSummary }) => {
    const config = ORDER_STATUS_CONFIG[item.status] || {
      bg: "#F5F5F5",
      color: "#616161",
      text: item.status || "Không rõ",
    };

    return (
      <Card
        style={styles.orderCard}
        mode="elevated"
        onPress={() =>
          router.push(`/(coordinator)/orderId?orderId=${item.id}` as any)
        }
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdContainer}>
              <Icon
                source="clipboard-text"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                style={styles.orderIdText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.id}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.text}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Icon source="store" size={16} color="#666" />
              <Text style={styles.infoText}>
                {item.store?.name || "Cửa hàng không xác định"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon source="calendar-clock" size={16} color="#666" />
              <Text style={styles.infoText}>
                Tạo lúc:{" "}
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString("vi-VN")
                  : "—"}
              </Text>
            </View>
            {item.deliveryDate && (
              <View style={styles.infoRow}>
                <Icon source="truck-delivery-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Ngày giao:{" "}
                  {new Date(item.deliveryDate).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.BackAction color="#fff" onPress={() => router.back()} />
        <Appbar.Content title="Quản lý Đơn hàng Supply" color="#fff" />
      </Appbar.Header>

      <View style={styles.headerDescription}>
        <Text style={styles.descriptionText}>
          Phê duyệt, từ chối và theo dõi trạng thái đơn hàng cho vai trò điều
          phối viên.
        </Text>
      </View>

      <Card style={styles.scheduleCard} mode="elevated">
        <Card.Content>
          <Text style={styles.scheduleTitle}>Lọc theo ngày giao</Text>
          <TextInput
            mode="outlined"
            label="Ngày giao"
            placeholder=""
            value={deliveryDateText}
            onChangeText={handleDeliveryDateTextChange}
            autoCapitalize="none"
            keyboardType="numeric"
            right={
              deliveryDateText.trim() ? (
                <TextInput.Icon
                  icon="close"
                  onPress={clearDeliveryDateFilter}
                />
              ) : (
                <TextInput.Icon icon="calendar" />
              )
            }
            style={{ backgroundColor: "#fff" }}
            outlineColor="#E0E0E0"
            activeOutlineColor={theme.colors.primary}
          />
          {activeDeliveryDate ? (
            <Text style={styles.scheduleHint}>
              Đang lọc theo: {formatYmdToDmy(activeDeliveryDate)}
            </Text>
          ) : deliveryInputHint ? (
            <Text style={styles.scheduleHint}>{deliveryInputHint}</Text>
          ) : (
            <Text style={styles.scheduleHint}>
              Dùng để lên kế hoạch theo ngày giao; để trống để xem tất cả đơn.
            </Text>
          )}
        </Card.Content>
      </Card>

      {renderFilterChips()}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator animating size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon source="clipboard-text-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#1565C0"]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  headerDescription: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6b7280",
  },
  scheduleCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  scheduleHint: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 13,
  },
  filterScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    color: "#616161",
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
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4A4A4A",
  },
});
