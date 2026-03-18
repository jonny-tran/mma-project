import { authApi } from "@/src/apis/auth.api";
import { useAuthStore } from "@/src/store/authStore";
import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Card,
  Divider,
  List,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authApi.getMe();
        updateUser(profile);
      } catch {
        /* ignore */
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logout();
      Toast.show({ type: "success", text1: "Đăng xuất thành công" });
    } catch {
      Toast.show({
        type: "error",
        text1: "Đăng xuất thất bại",
        text2: "Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.Content title="Hồ sơ" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.profileCard} elevation={1}>
          <Avatar.Icon size={72} icon="account" style={styles.avatar} />
          <Text variant="headlineSmall" style={styles.name}>
            {user?.username ?? "—"}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {user?.email ?? "—"}
          </Text>
        </Surface>

        <Card style={styles.infoCard}>
          <Card.Content>
            <List.Item
              title="Email"
              description={user?.email ?? "—"}
              left={(props) => (
                <List.Icon {...props} icon="email-outline" color="#E65100" />
              )}
              titleStyle={styles.listTitle}
            />
            <Divider />
            <List.Item
              title="Vai trò"
              description="Nhân viên cửa hàng"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="badge-account-outline"
                  color="#E65100"
                />
              )}
              titleStyle={styles.listTitle}
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
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="calendar-outline"
                  color="#E65100"
                />
              )}
              titleStyle={styles.listTitle}
            />
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          loading={isLoading}
          disabled={isLoading}
          style={styles.logoutBtn}
          contentStyle={styles.logoutContent}
          labelStyle={styles.logoutLabel}
          textColor="#C62828"
        >
          Đăng xuất
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { backgroundColor: "#fff" },
  headerTitle: { fontWeight: "700" },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  avatar: { backgroundColor: "#E65100" },
  name: { fontWeight: "700", color: "#1a1a1a", marginTop: 8 },
  email: { color: "#666" },

  infoCard: { backgroundColor: "#fff", borderRadius: 16 },
  listTitle: { fontWeight: "600", fontSize: 13, color: "#888" },

  logoutBtn: {
    borderRadius: 14,
    borderColor: "#C62828",
    borderWidth: 1.5,
    marginTop: 8,
  },
  logoutContent: { height: 50 },
  logoutLabel: { fontSize: 15, fontWeight: "700" },
});
