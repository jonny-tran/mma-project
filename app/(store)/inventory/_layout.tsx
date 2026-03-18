import { Stack } from "expo-router";

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        headerTintColor: "#E65100",
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Kho hàng" }} />
      <Stack.Screen
        name="transactions"
        options={{ title: "Lịch sử giao dịch" }}
      />
    </Stack>
  );
}
