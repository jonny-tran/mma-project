import { Stack } from "expo-router";

export default function ClaimsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        headerTintColor: "#E65100",
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Khiếu nại" }} />
      <Stack.Screen name="create" options={{ title: "Tạo khiếu nại" }} />
      <Stack.Screen
        name="[id]"
        options={{ title: "Chi tiết khiếu nại" }}
      />
    </Stack>
  );
}
