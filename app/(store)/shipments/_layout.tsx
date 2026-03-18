import { Stack } from "expo-router";

export default function ShipmentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        headerTintColor: "#E65100",
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Nhận hàng" }} />
      <Stack.Screen
        name="[id]"
        options={{ title: "Chi tiết lô hàng" }}
      />
      <Stack.Screen
        name="success"
        options={{ title: "Hoàn tất", headerShown: false }}
      />
    </Stack>
  );
}
