import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Appbar } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ProductInventoryDetail() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title="Chi tiết sản phẩm"
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={styles.text}>
          Chi tiết tồn kho cho sản phẩm #{productId}
        </Text>
        <Text variant="bodySmall" style={styles.subtext}>
          (Tính năng đang phát triển)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { backgroundColor: "#fff" },
  headerTitle: { fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  text: { textAlign: "center", color: "#333" },
  subtext: { color: "#999", marginTop: 4 },
});
