import React, { memo, useCallback } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";
import { useCartStore } from "@/src/store/useCartStore";
import type { Product } from "@/src/types/product";

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = "https://placehold.co/120x120/e0e0e0/757575?text=No+Image";

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
    <Card style={styles.card} mode="elevated">
      <View style={styles.row}>
        <Image
          source={{ uri: product.imageUrl || PLACEHOLDER_IMAGE }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text variant="labelSmall" style={styles.sku}>
            {product.sku}
          </Text>
          <Text variant="titleSmall" numberOfLines={2}>
            {product.name}
          </Text>
          <Text variant="bodySmall" style={styles.shelfLife}>
            HSD: {product.shelfLifeDays} ngày
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <IconButton
            icon="minus"
            mode="outlined"
            size={18}
            onPress={handleDecrement}
            disabled={quantity === 0}
            style={styles.iconBtn}
          />
          <Text variant="titleMedium" style={styles.quantityText}>
            {quantity}
          </Text>
          <IconButton
            icon="plus"
            mode="contained"
            size={18}
            onPress={handleIncrement}
            style={styles.iconBtn}
          />
        </View>
      </View>
    </Card>
  );
}

export const ProductCard = memo(ProductCardInner);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  sku: {
    color: "#888",
  },
  shelfLife: {
    color: "#666",
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    margin: 0,
  },
  quantityText: {
    minWidth: 28,
    textAlign: "center",
  },
});
