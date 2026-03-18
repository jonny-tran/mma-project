import React, { memo, useCallback } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCartStore, type CartItem as CartItemType } from "@/src/store/useCartStore";

interface CartItemProps {
  item: CartItemType;
}

const PLACEHOLDER_IMAGE = "https://placehold.co/80x80/e0e0e0/757575?text=No+Image";

function CartItemInner({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleIncrement = useCallback(() => {
    updateQuantity(item.product.id, item.quantity + 1);
  }, [item.product.id, item.quantity, updateQuantity]);

  const handleDecrement = useCallback(() => {
    updateQuantity(item.product.id, item.quantity - 1);
  }, [item.product.id, item.quantity, updateQuantity]);

  const handleRemove = useCallback(() => {
    removeItem(item.product.id);
  }, [item.product.id, removeItem]);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{ uri: item.product.imageUrl || PLACEHOLDER_IMAGE }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text variant="titleMedium" style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text variant="bodySmall" style={styles.sku}>
            {item.product.sku}
          </Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={styles.qtyBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="minus" size={18} color="#555" />
            </TouchableOpacity>
            <Text variant="titleMedium" style={styles.qty}>
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={handleIncrement}
              style={[styles.qtyBtn, styles.qtyBtnPlus]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleRemove}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="delete-outline" size={22} color="#C62828" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export const CartItemComponent = memo(CartItemInner);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    marginBottom: 2,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 6,
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
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnPlus: {
    backgroundColor: "#E65100",
    borderColor: "#E65100",
  },
  qty: {
    minWidth: 28,
    textAlign: "center",
    fontWeight: "700",
    color: "#333",
    fontSize: 15,
  },
  deleteBtn: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
