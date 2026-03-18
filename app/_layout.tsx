import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/components/useColorScheme";
import { useAuthStore } from "@/src/store/authStore";
import { USER_ROLES } from "@/src/types/user";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const { isAuthenticated, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!segments.length) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      const currentUserRole = user?.role?.toLowerCase() || "";

      if (currentUserRole === USER_ROLES.STORE || currentUserRole.includes("store")) {
        router.replace("/(store)");
      } else if (currentUserRole === USER_ROLES.KITCHEN || currentUserRole.includes("kitchen")) {
        router.replace("/(kitchen)");
      } else if (currentUserRole === USER_ROLES.COORDINATOR || currentUserRole.includes("coordinator")) {
        router.replace("/(coordinator)");
      } else {
        // FIX 2: Thông báo lỗi cực kỳ rõ ràng nếu cố tình đăng nhập bằng Admin
        Toast.show({
          type: "error",
          text1: "Truy cập bị từ chối",
          text2: `Tài khoản ${currentUserRole} vui lòng sử dụng Web Admin.`,
        });

        // Tự động xóa Token để trả về trạng thái sạch
        useAuthStore.getState().logout();
      }
    }
  }, [isAuthenticated, user, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(store)" />
            <Stack.Screen name="(kitchen)" />
            <Stack.Screen name="(coordinator)" />
          </Stack>
          <Toast />
        </PaperProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
