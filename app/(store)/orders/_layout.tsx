import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Lịch sử đơn hàng" }}
      />
      <Stack.Screen
        name="create"
        options={{ title: "Đặt hàng mới" }}
      />
      <Stack.Screen
        name="cart"
        options={{ title: "Giỏ hàng" }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Chi tiết đơn hàng" }}
      />
    </Stack>
  );
}
