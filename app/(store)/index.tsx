import { authApi } from "@/src/apis/auth.api";
import { useAuthStore } from "@/src/store/authStore";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const QUICK_ACTIONS = [
  {
    icon: "plus-circle" as const,
    label: "Đặt hàng",
    desc: "Tạo đơn hàng mới",
    route: "/orders/create",
    color: "#E65100",
    bg: "#FFF3E0",
  },
  {
    icon: "clipboard-text-clock" as const,
    label: "Lịch sử",
    desc: "Xem đơn hàng",
    route: "/orders",
    color: "#1565C0",
    bg: "#E3F2FD",
  },
  {
    icon: "warehouse" as const,
    label: "Kho hàng",
    desc: "Tồn kho & giao dịch",
    route: "/inventory",
    color: "#2E7D32",
    bg: "#E8F5E9",
  },
  {
    icon: "file-document-edit" as const,
    label: "Khiếu nại",
    desc: "Tạo & theo dõi",
    route: "/claims",
    color: "#6A1B9A",
    bg: "#F3E5F5",
  },
];

export default function StoreHomeScreen() {
  const { push } = useRouter();
  const { user, updateUser } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profile = await authApi.getMe();
        updateUser(profile);
      } catch {
        /* ignore */
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoadingProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Cửa hàng</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color="#E65100" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>{greeting}</Text>
          <Text style={styles.headerName}>{user?.username ?? "—"}</Text>
        </View>
        <TouchableOpacity
          onPress={() => push("/profile" as any)}
          activeOpacity={0.7}
        >
          <Avatar.Icon size={42} icon="account" style={styles.headerAvatar} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Nhận hàng - Hero Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => push("/shipments" as any)}
        >
          <Surface style={styles.heroCard} elevation={2}>
            <View style={styles.heroLeft}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={28}
                  color="#fff"
                />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Nhận hàng vận chuyển</Text>
                <Text style={styles.heroDesc}>
                  Kiểm đếm, xác nhận & báo cáo sai lệch
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#E65100"
            />
          </Surface>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.gridItem}
              activeOpacity={0.75}
              onPress={() => push(action.route as any)}
            >
              <Surface style={styles.gridCard} elevation={1}>
                <View
                  style={[styles.gridIconWrap, { backgroundColor: action.bg }]}
                >
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={26}
                    color={action.color}
                  />
                </View>
                <Text style={styles.gridLabel}>{action.label}</Text>
                <Text style={styles.gridDesc}>{action.desc}</Text>
              </Surface>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng,";
  if (h < 18) return "Chào buổi chiều,";
  return "Chào buổi tối,";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#888", fontSize: 14 },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 13, color: "#888", fontWeight: "500" },
  headerName: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  headerAvatar: { backgroundColor: "#E65100" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 32 },

  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    borderLeftColor: "#E65100",
  },
  heroLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 14 },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E65100",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  heroDesc: { fontSize: 12, color: "#888", marginTop: 2 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#555",
    marginLeft: 2,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "47%",
    flexGrow: 1,
  },
  gridCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  gridIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  gridLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  gridDesc: { fontSize: 11, color: "#888", textAlign: "center" },
});
