import { authApi } from "@/src/apis/auth.api";
import { useAuthStore } from "@/src/store/authStore";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  List,
  Text,
} from "react-native-paper";
import Toast from "react-native-toast-message";

export default function StoreHomeScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Gọi API lấy thông tin profile khi màn hình mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profile = await authApi.getMe();
        updateUser(profile);
      } catch (error) {
        console.warn("Lấy thông tin profile thất bại:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Xử lý đăng xuất
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      Toast.show({
        type: "success",
        text1: "Đăng xuất thành công",
        text2: "Hẹn gặp lại bạn! 👋",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Đăng xuất thất bại",
        text2: "Vui lòng thử lại.",
      });
    }
  }, [logout]);

  // Hiển thị loading khi đang tải profile
  if (isLoadingProfile) {
    return (
      <View style={styles.container}>
        <Appbar.Header elevated>
          <Appbar.Content title="Cửa hàng Franchise" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header elevated>
        <Appbar.Content
          title="Cửa hàng Franchise"
          subtitle={`Xin chào, ${user?.username}`}
        />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Thẻ thông tin cá nhân ── */}
        <Card style={styles.profileCard}>
          <Card.Title
            title={user?.username ?? "—"}
            subtitle={user?.role ?? "—"}
            left={(props) => (
              <Avatar.Icon
                {...props}
                icon="account-circle"
                style={styles.avatar}
              />
            )}
          />
          <Card.Content>
            <List.Item
              title="Email"
              description={user?.email ?? "—"}
              left={(props) => <List.Icon {...props} icon="email-outline" />}
            />
            <Divider />
            <List.Item
              title="Trạng thái"
              description={() => (
                <Chip
                  icon={
                    user?.status === "ACTIVE" ? "check-circle" : "close-circle"
                  }
                  mode="outlined"
                  compact
                  style={
                    user?.status === "ACTIVE"
                      ? styles.chipActive
                      : styles.chipInactive
                  }
                  textStyle={
                    user?.status === "ACTIVE"
                      ? styles.chipActiveText
                      : styles.chipInactiveText
                  }
                >
                  {user?.status === "ACTIVE"
                    ? "Đang hoạt động"
                    : "Ngừng hoạt động"}
                </Chip>
              )}
              left={(props) => (
                <List.Icon {...props} icon="shield-check-outline" />
              )}
            />
            <Divider />
            <List.Item
              title="Ngày tạo tài khoản"
              description={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"
              }
              left={(props) => <List.Icon {...props} icon="calendar-outline" />}
            />
          </Card.Content>
        </Card>

        {/* ── Quản lý Đơn hàng ── */}
        <Card style={styles.card}>
          <Card.Title
            title="Quản lý Đơn hàng"
            subtitle="Tạo đơn & Theo dõi vận chuyển"
            left={(props) => <List.Icon {...props} icon="cart-outline" />}
          />
          <Card.Actions>
            <Button mode="contained" icon="plus">
              Đặt hàng mới
            </Button>
          </Card.Actions>
        </Card>

        {/* ── Quản lý Tồn kho ── */}
        <Card style={styles.card}>
          <Card.Title
            title="Quản lý Tồn kho"
            subtitle="Xem tồn kho & Chụp ảnh khiếu nại"
            left={(props) => <List.Icon {...props} icon="warehouse" />}
          />
          <Card.Actions>
            <Button mode="outlined" icon="package-variant">
              Nhận hàng
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#666", fontSize: 14 },
  content: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  profileCard: { backgroundColor: "#fff", elevation: 2 },
  avatar: { backgroundColor: "#6750A4" },
  card: { backgroundColor: "#fff" },
  chipActive: { borderColor: "#2E7D32", alignSelf: "flex-start", marginTop: 4 },
  chipActiveText: { color: "#2E7D32" },
  chipInactive: {
    borderColor: "#C62828",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  chipInactiveText: { color: "#C62828" },
});
