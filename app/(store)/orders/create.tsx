import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  FAB,
  Searchbar,
  Text,
} from "react-native-paper";
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
        <ActivityIndicator animating size="large" />
        <Text style={styles.loadingText}>Đang tải danh mục...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm sản phẩm theo tên hoặc SKU..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Không tìm thấy sản phẩm
            </Text>
          </View>
        }
      />

      <FAB
        icon="cart"
        label={cartItemCount > 0 ? `Giỏ hàng (${cartItemCount})` : "Giỏ hàng"}
        style={styles.fab}
        onPress={() => push("/orders/cart")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  },
  searchContainer: {
    padding: 12,
    paddingBottom: 4,
    backgroundColor: "#fff",
  },
  searchbar: {
    backgroundColor: "#f0f0f0",
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
  emptyText: {
    color: "#999",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
  },
});
