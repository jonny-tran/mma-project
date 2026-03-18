import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        headerTintColor: "#E65100",
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Đơn hàng" }} />
      <Stack.Screen name="create" options={{ title: "Đặt hàng mới" }} />
      <Stack.Screen name="cart" options={{ title: "Giỏ hàng" }} />
      <Stack.Screen
        name="[id]"
        options={{ title: "Chi tiết đơn hàng" }}
      />
    </Stack>
  );
}
