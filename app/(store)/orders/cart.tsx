import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Text,
  TextInput,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { storeOrderApi } from "@/src/apis/order.api";
import { useCartStore, type CartItem } from "@/src/store/useCartStore";
import { CartItemComponent } from "@/src/components/orders/CartItem";

function getDefaultDeliveryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function formatDateDisplay(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const CARD_SHADOW =
  Platform.OS === "web"
    ? { boxShadow: "0 -2px 16px rgba(0,0,0,0.08)" }
    : {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      };

export default function CartScreen() {
  const { replace } = useRouter();
  const { items, clearCart, _hasHydrated } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<Date>(getDefaultDeliveryDate);
  const [showDateInput, setShowDateInput] = useState(false);
  const [dateText, setDateText] = useState("");

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleDateConfirm = useCallback((text: string) => {
    const parts = text.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime()) && parsed > new Date()) {
        setDeliveryDate(parsed);
        setShowDateInput(false);
        return;
      }
    }
    Toast.show({
      type: "error",
      text1: "Ngày không hợp lệ",
      text2: "Vui lòng nhập theo định dạng DD/MM/YYYY và phải là ngày trong tương lai.",
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (items.length === 0) {
      Toast.show({
        type: "info",
        text1: "Giỏ hàng trống",
        text2: "Vui lòng thêm sản phẩm trước khi đặt hàng.",
      });
      return;
    }

    try {
      setSubmitting(true);
      await storeOrderApi.createOrder({
        deliveryDate: deliveryDate.toISOString(),
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });
      clearCart();
      Toast.show({
        type: "success",
        text1: "Đặt hàng thành công!",
        text2: "Đơn hàng đang chờ Coordinator duyệt.",
      });
      replace("/orders");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo đơn hàng";
      Toast.show({
        type: "error",
        text1: "Đặt hàng thất bại",
        text2: message,
      });
    } finally {
      setSubmitting(false);
    }
  }, [items, clearCart, replace, deliveryDate]);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => <CartItemComponent item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: CartItem) => String(item.product.id), []);

  if (!_hasHydrated) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" color="#E65100" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <MaterialCommunityIcons
          name="information-outline"
          size={22}
          color="#E65100"
        />
        <Text style={styles.bannerText}>
          Phần nợ đơn sẽ bị hủy nếu kho không đủ hàng (Quy tắc No-Backorder).
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={64}
              color="#ddd"
            />
          </View>
          <Text variant="titleMedium" style={styles.emptyText}>
            Giỏ hàng trống
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Quay lại danh mục để thêm sản phẩm
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <Card style={[styles.summaryCard, CARD_SHADOW]}>
            <Card.Content style={styles.summaryContent}>
              <View style={styles.dateRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Ngày giao hàng
                </Text>
                {showDateInput ? (
                  <View style={styles.dateInputRow}>
                    <TextInput
                      mode="outlined"
                      dense
                      placeholder="DD/MM/YYYY"
                      value={dateText}
                      onChangeText={setDateText}
                      onSubmitEditing={() => handleDateConfirm(dateText)}
                      style={styles.dateInput}
                      keyboardType="numeric"
                      autoFocus
                      outlineColor="#E65100"
                      activeOutlineColor="#E65100"
                    />
                    <Button
                      compact
                      mode="contained"
                      onPress={() => handleDateConfirm(dateText)}
                      style={styles.dateOkBtn}
                      buttonColor="#E65100"
                    >
                      OK
                    </Button>
                    <Button
                      compact
                      onPress={() => setShowDateInput(false)}
                      textColor="#666"
                    >
                      Hủy
                    </Button>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setDateText(formatDateDisplay(deliveryDate));
                      setShowDateInput(true);
                    }}
                    style={styles.dateValueWrap}
                  >
                    <Text variant="titleMedium" style={styles.dateValue}>
                      {formatDateDisplay(deliveryDate)}
                    </Text>
                    <MaterialCommunityIcons
                      name="calendar-edit"
                      size={18}
                      color="#E65100"
                    />
                  </Pressable>
                )}
              </View>
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Số loại sản phẩm
                </Text>
                <Text variant="titleMedium" style={styles.value}>
                  {items.length}
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Tổng số lượng
                </Text>
                <Text variant="titleMedium" style={styles.totalValue}>
                  {totalItems}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
              <Button
                mode="contained"
                icon="send"
                onPress={handleSubmit}
                disabled={submitting || items.length === 0}
                loading={submitting}
                style={styles.submitBtn}
                contentStyle={styles.submitBtnContent}
                buttonColor="#E65100"
              >
                {submitting ? "Đang gửi..." : "Gửi đơn hàng"}
              </Button>
            </Card.Actions>
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#FFF3E0",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0B2",
  },
  bannerText: {
    flex: 1,
    color: "#5D4037",
    fontSize: 13,
    lineHeight: 20,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyText: {
    color: "#555",
    fontWeight: "700",
  },
  emptySubtext: {
    color: "#888",
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 8,
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  summaryContent: {
    padding: 16,
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  label: {
    color: "#666",
  },
  value: {
    fontWeight: "700",
    color: "#333",
  },
  totalValue: {
    fontWeight: "800",
    color: "#E65100",
    fontSize: 18,
  },
  dateValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateValue: {
    color: "#E65100",
    fontWeight: "700",
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    width: 130,
    height: 40,
    fontSize: 14,
  },
  dateOkBtn: {
    marginLeft: 4,
  },
  divider: {
    marginVertical: 8,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  submitBtn: {
    flex: 1,
    borderRadius: 12,
  },
  submitBtnContent: {
    paddingVertical: 8,
  },
});
