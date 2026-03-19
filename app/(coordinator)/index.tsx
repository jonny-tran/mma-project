import { authApi } from "@/src/apis/auth.api";
import { useAuthStore } from "@/src/store/authStore";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Card,
  Icon,
  Surface,
  Text,
} from "react-native-paper";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function CoordinatorHomeScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch profile
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
  }, [updateUser]);

  // Logout
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

  if (isLoadingProfile) {
    return (
      <View style={styles.container}>
        <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
          <Appbar.Content title="Điều phối Cung ứng" color="#fff" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  const renderActionCard = (
    title: string,
    subtitle: string,
    icon: string,
    color: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.actionCardWrapper}
      onPress={onPress}
    >
      <Surface style={styles.actionCard} elevation={2}>
        <View
          style={[
            styles.actionIconContainer,
            { backgroundColor: color + "15" },
          ]}
        >
          <Icon source={icon} size={32} color={color} />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={{ backgroundColor: "#E65100" }}>
        <Appbar.Content
          title="Điều phối Cung ứng"
          subtitle={`Xin chào, ${user?.username || "Điều phối viên"}`}
          titleStyle={{ color: "#fff", fontWeight: "bold" }}
          subtitleStyle={{ color: "rgba(255,255,255,0.8)" }}
        />
        <Appbar.Action icon="bell-outline" color="#fff" onPress={() => {}} />
        <Appbar.Action icon="logout" color="#fff" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Section */}
        <View style={styles.profileSection}>
          <Avatar.Icon
            size={64}
            icon="account-tie"
            style={{ backgroundColor: "#E6510015" }}
            color="#E65100"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>Chào mừng trở lại,</Text>
            <Text style={styles.userName}>
              {user?.username || "Điều phối viên"}
            </Text>
            <View
              style={[
                styles.roleBadge,
                user?.status === "ACTIVE" ? {} : { backgroundColor: "#FFEBEE" },
              ]}
            >
              <Icon
                source={
                  user?.status === "ACTIVE" ? "check-decagram" : "close-octagon"
                }
                size={16}
                color={user?.status === "ACTIVE" ? "#4CAF50" : "#D32F2F"}
              />
              <Text
                style={[
                  styles.roleText,
                  user?.status === "ACTIVE" ? {} : { color: "#D32F2F" },
                ]}
              >
                {user?.role || "COORDINATOR"}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Actions Grid */}
        <Text style={styles.sectionTitle}>Chức Năng Chính</Text>
        <View style={styles.gridContainer}>
          {renderActionCard(
            "Duyệt Đơn Hàng",
            "Tổng hợp đơn, kiểm tra tồn kho & xử lý thiếu hàng",
            "clipboard-check-outline",
            "#E65100",
            () => router.push("/(coordinator)/supply" as any),
          )}
        </View>

        {/* Account Info Detail */}
        <Text style={styles.sectionTitle}>Thông tin Tài khoản</Text>
        <Card style={styles.activityCard} mode="elevated">
          <Card.Content style={styles.activityContent}>
            <View style={styles.activityItem}>
              <View
                style={[styles.activityIconBg, { backgroundColor: "#ECEFF1" }]}
              >
                <Icon source="email-outline" size={20} color="#607D8B" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>Email</Text>
                <Text style={styles.activityTime}>{user?.email || "—"}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.activityItem}>
              <View
                style={[styles.activityIconBg, { backgroundColor: "#ECEFF1" }]}
              >
                <Icon source="calendar-outline" size={20} color="#607D8B" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>Ngày tạo tài khoản</Text>
                <Text style={styles.activityTime}>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  profileInfo: {
    marginLeft: 18,
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 28,
  },
  actionCardWrapper: {
    // width: (width - 48) / 2, // 2 columns with padding and gap
    flex: 1,
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    alignItems: "flex-start",
    height: 160,
  },
  actionIconContainer: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  activityCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  activityContent: {
    padding: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  activityTime: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
});
