import { authApi } from "@/src/apis/auth.api";
import { pickingTasksApi } from "@/src/apis/picking-tasks.api";
import { useAuthStore } from "@/src/store/authStore";
import { useFocusEffect, useRouter } from "expo-router";
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

export default function KitchenHomeScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [stats, setStats] = useState({
    pending: 0,
    picking: 0,
    completed: 0,
    alert: 0,
  });

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

  // Fetch Dashboard Stats
  const fetchDashboardData = async () => {
    try {
      const data = await pickingTasksApi.getPickingTasks();
      const tasks = data?.items || [];

      let pendingCount = 0;
      let pickingCount = 0;
      let completedCount = 0;

      tasks.forEach((t) => {
        const s = t.status?.toUpperCase();
        if (s === "PENDING" || s === "APPROVED") pendingCount++;
        if (s === "PICKING" || s === "IN_PROGRESS") pickingCount++;
        if (s === "COMPLETED" || s === "DONE") completedCount++;
      });

      setStats((prev) => ({
        ...prev,
        pending: pendingCount,
        picking: pickingCount,
        completed: completedCount,
      }));
    } catch (error) {
      console.warn("Lỗi cập nhật thống kê đơn hàng:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, []),
  );

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
          <Appbar.Content title="Bếp Trung Tâm" color="#fff" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  const renderStatCard = (
    title: string,
    value: string,
    icon: string,
    color: string,
  ) => (
    <Surface
      style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      elevation={2}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Icon source={icon} size={28} color={color} />
      </View>
    </Surface>
  );

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
          title="Bếp Trung Tâm"
          subtitle={`Xin chào, ${user?.username || "Nhân viên"}`}
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
            icon="chef-hat"
            style={{ backgroundColor: "#FFEDD5" }}
            color="#E65100"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>Chào mừng trở lại,</Text>
            <Text style={styles.userName}>
              {user?.username || "Nhân viên Bếp"}
            </Text>
            <View style={styles.roleBadge}>
              <Icon source="check-decagram" size={16} color="#4CAF50" />
              <Text style={styles.roleText}>
                {user?.role || "CENTRAL_KITCHEN"}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          {renderStatCard(
            "Đơn chờ xử lý",
            stats.pending.toString(),
            "clipboard-text-clock",
            "#F57C00",
          )}
          {renderStatCard(
            "Đang nhặt hàng",
            stats.picking.toString(),
            "pot-steam",
            "#0288D1",
          )}
          {renderStatCard(
            "Đã hoàn thành",
            stats.completed.toString(),
            "check-decagram",
            "#388E3C",
          )}
          {renderStatCard("Cảnh báo tồn", "3", "alert", "#D32F2F")}
        </ScrollView>

        {/* Main Actions Grid */}
        <Text style={styles.sectionTitle}>Chức Năng Chính</Text>
        <View style={styles.gridContainer}>
          {renderActionCard(
            "Đơn Đặt Hàng",
            "Tiếp nhận & xử lý đơn từ chi nhánh",
            "clipboard-list",
            "#F57C00",
            () => router.push("/(kitchen)/orders" as any),
          )}
          {renderActionCard(
            "Kế Hoạch Sản Xuất",
            "Lập lệnh sản xuất & định mức",
            "factory",
            "#0288D1",
            () => router.push("/(kitchen)/production" as any),
          )}
          {renderActionCard(
            "Tiến Độ & Xuất Kho",
            "Cập nhật tiến độ & giao hàng",
            "truck-fast",
            "#388E3C",
            () => router.push("/(kitchen)/shipping" as any),
          )}
          {renderActionCard(
            "Kho & Nguyên Liệu",
            "Quản lý lô, hạn sử dụng, FEFO",
            "package-variant-closed",
            "#7B1FA2",
            () => router.push("/(kitchen)/inventory" as any),
          )}
        </View>

        {/* Recent Activities */}
        <Text style={styles.sectionTitle}>Hoạt Động Gần Đây</Text>
        <Card style={styles.activityCard} mode="elevated">
          <Card.Content style={styles.activityContent}>
            <View style={styles.activityItem}>
              <View
                style={[styles.activityIconBg, { backgroundColor: "#E8F5E9" }]}
              >
                <Icon source="check" size={20} color="#388E3C" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>Hoàn thành sản xuất</Text>
                <Text style={styles.activityTime}>
                  Lô L1234 - Bánh Mì - 10 phút trước
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.activityItem}>
              <View
                style={[styles.activityIconBg, { backgroundColor: "#FFF3E0" }]}
              >
                <Icon source="clipboard-text" size={20} color="#F57C00" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>Có đơn đặt hàng mới</Text>
                <Text style={styles.activityTime}>
                  Cửa hàng Quận 1 - 30 phút trước
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.activityItem}>
              <View
                style={[styles.activityIconBg, { backgroundColor: "#FFEBEE" }]}
              >
                <Icon source="alert-circle" size={20} color="#D32F2F" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>Cảnh báo tồn kho thấp</Text>
                <Text style={styles.activityTime}>
                  Bột mì đa dụng sắp hết - 1 giờ trước
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
  statsScroll: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    width: 160,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  statTitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  iconContainer: {
    padding: 10,
    borderRadius: 16,
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
    width: (width - 48) / 2, // 2 columns with padding and gap
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
