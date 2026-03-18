import React, { memo, useCallback } from "react";
import { Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCartStore } from "@/src/store/useCartStore";
import type { Product } from "@/src/types/product";

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = "https://placehold.co/120x120/e0e0e0/757575?text=No+Image";

const CARD_SHADOW =
  Platform.OS === "web"
    ? { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }
    : {
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      };

function ProductCardInner({ product }: ProductCardProps) {
  const quantity = useCartStore((s) =>
    s.items.find((i) => i.product.id === product.id)?.quantity ?? 0,
  );
  const { addItem, updateQuantity } = useCartStore();

  const handleIncrement = useCallback(() => {
    if (quantity === 0) {
      addItem(product, 1);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  }, [quantity, product, addItem, updateQuantity]);

  const handleDecrement = useCallback(() => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  }, [quantity, product.id, updateQuantity]);

  return (
    <Card style={[styles.card, CARD_SHADOW]}>
      <View style={styles.row}>
        <Image
          source={{ uri: product.imageUrl || PLACEHOLDER_IMAGE }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text variant="titleMedium" style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text variant="bodySmall" style={styles.sku}>
            {product.sku}
          </Text>
          <Text variant="bodySmall" style={styles.shelfLife}>
            HSD: {product.shelfLifeDays} ngày
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={handleDecrement}
            disabled={quantity === 0}
            style={[styles.qtyBtn, styles.qtyBtnMinus, quantity === 0 && styles.qtyBtnDisabled]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={quantity === 0 ? "#bbb" : "#555"}
            />
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.quantityText}>
            {quantity}
          </Text>
          <TouchableOpacity
            onPress={handleIncrement}
            style={[styles.qtyBtn, styles.qtyBtnPlus]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

export const ProductCard = memo(ProductCardInner);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  productName: {
    fontWeight: "700",
    color: "#1a1a1a",
    fontSize: 15,
  },
  sku: {
    color: "#888",
    fontSize: 12,
  },
  shelfLife: {
    color: "#666",
    fontSize: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnMinus: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  qtyBtnPlus: {
    backgroundColor: "#E65100",
  },
  qtyBtnDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#eee",
  },
  quantityText: {
    minWidth: 32,
    textAlign: "center",
    fontWeight: "700",
    color: "#333",
    fontSize: 16,
  },
});
