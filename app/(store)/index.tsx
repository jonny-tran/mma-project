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
  Surface,
  Text,
} from "react-native-paper";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function StoreHomeScreen() {
  const { push } = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      Toast.show({
        type: "success",
        text1: "Đăng xuất thành công",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Đăng xuất thất bại",
        text2: "Vui lòng thử lại.",
      });
    }
  }, [logout]);

  if (isLoadingProfile) {
    return (
      <View style={styles.container}>
        <Appbar.Header elevated>
          <Appbar.Content title="Cửa hàng Franchise" />
        </Appbar.Header>
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.Content
          title="Cửa hàng Franchise"
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Chào mừng ── */}
        <Surface style={styles.welcomeCard} elevation={2}>
          <View style={styles.welcomeRow}>
            <Avatar.Icon
              size={52}
              icon="account-circle"
              style={styles.avatar}
            />
            <View style={styles.welcomeInfo}>
              <Text variant="titleMedium" style={styles.welcomeName}>
                Xin chào, {user?.username ?? "—"}
              </Text>
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
            </View>
          </View>
        </Surface>

        {/* ── Thao tác nhanh ── */}
        <Text variant="titleSmall" style={styles.sectionLabel}>
          Thao tác nhanh
        </Text>
        <View style={styles.quickActions}>
          <Surface style={styles.actionCard} elevation={1}>
            <Button
              icon="plus-circle-outline"
              mode="contained"
              onPress={() => push("/orders/create")}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
              labelStyle={styles.actionBtnLabel}
            >
              Đặt hàng mới
            </Button>
            <Text variant="bodySmall" style={styles.actionDesc}>
              Chọn sản phẩm từ danh mục Bếp Trung Tâm
            </Text>
          </Surface>

          <Surface style={styles.actionCard} elevation={1}>
            <Button
              icon="clipboard-list-outline"
              mode="outlined"
              onPress={() => push("/orders")}
              style={styles.actionBtnOutlined}
              contentStyle={styles.actionBtnContent}
              labelStyle={styles.actionBtnLabelOutlined}
            >
              Lịch sử đơn hàng
            </Button>
            <Text variant="bodySmall" style={styles.actionDesc}>
              Xem trạng thái và theo dõi đơn
            </Text>
          </Surface>

          <Surface style={styles.actionCard} elevation={1}>
            <Button
              icon="truck-delivery-outline"
              mode="outlined"
              onPress={() => push("/shipments" as any)}
              style={styles.shipmentBtnOutlined}
              contentStyle={styles.actionBtnContent}
              labelStyle={styles.shipmentBtnLabel}
            >
              Nhận hàng vận chuyển
            </Button>
            <Text variant="bodySmall" style={styles.actionDesc}>
              Kiểm đếm và báo cáo sai lệch
            </Text>
          </Surface>

          <Surface style={styles.actionCard} elevation={1}>
            <Button
              icon="warehouse"
              mode="outlined"
              onPress={() => push("/inventory" as any)}
              style={styles.actionBtnOutlined}
              contentStyle={styles.actionBtnContent}
              labelStyle={styles.actionBtnLabelOutlined}
            >
              Kho hàng
            </Button>
            <Text variant="bodySmall" style={styles.actionDesc}>
              Xem tồn kho và lịch sử xuất nhập
            </Text>
          </Surface>

          <Surface style={styles.actionCard} elevation={1}>
            <Button
              icon="file-document-edit-outline"
              mode="outlined"
              onPress={() => push("/claims" as any)}
              style={styles.actionBtnOutlined}
              contentStyle={styles.actionBtnContent}
              labelStyle={styles.actionBtnLabelOutlined}
            >
              Khiếu nại
            </Button>
            <Text variant="bodySmall" style={styles.actionDesc}>
              Theo dõi & tạo khiếu nại sai lệch
            </Text>
          </Surface>
        </View>


        {/* ── Thông tin tài khoản ── */}
        <Text variant="titleSmall" style={styles.sectionLabel}>
          Thông tin tài khoản
        </Text>
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <List.Item
              title="Email"
              description={user?.email ?? "—"}
              left={(props) => <List.Icon {...props} icon="email-outline" />}
            />
            <Divider />
            <List.Item
              title="Vai trò"
              description={user?.role ?? "—"}
              left={(props) => <List.Icon {...props} icon="badge-account-outline" />}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#666", fontSize: 14 },
  header: { backgroundColor: "#fff" },
  headerTitle: { fontWeight: "700" },
  content: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },

  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: { backgroundColor: "#E65100" },
  welcomeInfo: { flex: 1, gap: 6 },
  welcomeName: { fontWeight: "700" },
  chipActive: { borderColor: "#2E7D32", alignSelf: "flex-start" },
  chipActiveText: { color: "#2E7D32", fontSize: 11 },
  chipInactive: { borderColor: "#C62828", alignSelf: "flex-start" },
  chipInactiveText: { color: "#C62828", fontSize: 11 },

  sectionLabel: {
    fontWeight: "700",
    color: "#555",
    marginTop: 8,
    marginLeft: 4,
  },

  quickActions: { gap: 10 },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  actionBtn: {
    borderRadius: 10,
    backgroundColor: "#E65100",
  },
  actionBtnOutlined: {
    borderRadius: 10,
    borderColor: "#E65100",
  },
  actionBtnContent: { paddingVertical: 4 },
  actionBtnLabel: { fontWeight: "700", fontSize: 14 },
  actionBtnLabelOutlined: { fontWeight: "700", fontSize: 14, color: "#E65100" },
  shipmentBtnOutlined: {
    borderRadius: 10,
    borderColor: "#E65100",
    backgroundColor: "#FFF3E0",
  },
  shipmentBtnLabel: { fontWeight: "700", fontSize: 14, color: "#E65100" },
  actionDesc: { color: "#888", marginLeft: 4 },

  infoCard: { backgroundColor: "#fff", borderRadius: 12 },
  infoContent: { gap: 0 },
});
