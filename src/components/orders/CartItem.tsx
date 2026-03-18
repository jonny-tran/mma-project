import React, { memo, useCallback } from "react";
import { Image, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
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
    <View style={styles.container}>
      <Image
        source={{ uri: item.product.imageUrl || PLACEHOLDER_IMAGE }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text variant="titleSmall" numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text variant="labelSmall" style={styles.sku}>
          {item.product.sku}
        </Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.quantityRow}>
          <IconButton
            icon="minus"
            mode="outlined"
            size={16}
            onPress={handleDecrement}
            style={styles.iconBtn}
          />
          <Text variant="titleMedium" style={styles.qty}>
            {item.quantity}
          </Text>
          <IconButton
            icon="plus"
            mode="contained"
            size={16}
            onPress={handleIncrement}
            style={styles.iconBtn}
          />
        </View>
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor="#C62828"
          onPress={handleRemove}
          style={styles.deleteBtn}
        />
      </View>
    </View>
  );
}

export const CartItemComponent = memo(CartItemInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  image: {
    width: 56,
    height: 56,
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
  actions: {
    alignItems: "center",
    gap: 4,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  iconBtn: {
    margin: 0,
  },
  qty: {
    minWidth: 28,
    textAlign: "center",
  },
  deleteBtn: {
    margin: 0,
  },
});
