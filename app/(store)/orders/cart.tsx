import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Banner,
  Button,
  Card,
  Divider,
  Text,
  TextInput,
} from "react-native-paper";
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
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Banner
        visible
        icon="information-outline"
        style={styles.banner}
      >
        Phần nợ đơn sẽ bị hủy nếu kho không đủ hàng (Quy tắc No-Backorder).
      </Banner>

      {items.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Giỏ hàng trống
          </Text>
          <Text variant="bodySmall" style={styles.emptySubtext}>
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
          />

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <View style={styles.dateRow}>
                <Text variant="bodyMedium">Ngày giao hàng:</Text>
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
                    />
                    <Button
                      compact
                      mode="contained-tonal"
                      onPress={() => handleDateConfirm(dateText)}
                    >
                      OK
                    </Button>
                    <Button
                      compact
                      onPress={() => setShowDateInput(false)}
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
                  >
                    <Text variant="titleMedium" style={styles.dateValue}>
                      {formatDateDisplay(deliveryDate)}
                    </Text>
                  </Pressable>
                )}
              </View>
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Số loại sản phẩm:</Text>
                <Text variant="titleMedium">{items.length}</Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Tổng số lượng:</Text>
                <Text variant="titleMedium" style={styles.totalText}>
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
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  banner: {
    backgroundColor: "#FFF3E0",
  },
  emptyText: {
    color: "#999",
  },
  emptySubtext: {
    color: "#bbb",
  },
  listContent: {
    paddingBottom: 8,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: "#fff",
  },
  summaryContent: {
    gap: 8,
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
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateInput: {
    width: 130,
    height: 36,
    fontSize: 14,
  },
  dateValue: {
    color: "#1565C0",
    textDecorationLine: "underline",
  },
  divider: {
    marginVertical: 4,
  },
  totalText: {
    color: "#1565C0",
    fontWeight: "700",
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  submitBtn: {
    flex: 1,
  },
  submitBtnContent: {
    paddingVertical: 6,
  },
});
