import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Searchbar,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { storeOrderApi } from "@/src/apis/order.api";
import { useCartStore } from "@/src/store/useCartStore";
import { ProductCard } from "@/src/components/orders/ProductCard";
import type { Product } from "@/src/types/product";

export default function CreateOrderScreen() {
  const { push } = useRouter();
  const cartItemCount = useCartStore((s) => s.items.length);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const data = await storeOrderApi.getCatalog();
        setProducts(data.items ?? []);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải danh mục sản phẩm";
        Toast.show({
          type: "error",
          text1: "Lỗi tải danh mục",
          text2: message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    const lower = debouncedSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower),
    );
  }, [products, debouncedSearch]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Product) => String(item.id), []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" color="#E65100" />
        <Text style={styles.loadingText}>Đang tải danh mục...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Tìm sản phẩm theo tên hoặc SKU..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#E65100"
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={56}
              color="#ddd"
            />
            <Text variant="bodyLarge" style={styles.emptyText}>
              Không tìm thấy sản phẩm
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, cartItemCount > 0 && styles.fabActive]}
        onPress={() => push("/orders/cart")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="cart"
          size={24}
          color="#fff"
        />
        <Text style={styles.fabLabel}>
          {cartItemCount > 0 ? `Giỏ hàng (${cartItemCount})` : "Giỏ hàng"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchbar: {
    backgroundColor: "#F5F5F5",
    elevation: 0,
    height: 48,
    borderRadius: 14,
  },
  searchInput: {
    fontSize: 15,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: "#999",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: "#E65100",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 16px rgba(230,81,0,0.4)" }
      : {
          elevation: 6,
          shadowColor: "#E65100",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }),
  },
  fabActive: {
    paddingHorizontal: 22,
  },
  fabLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
