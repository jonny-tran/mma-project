import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text, IconButton, Chip } from "react-native-paper";
import BatchExpiryBadge from "./BatchExpiryBadge";
import QuantityAdjuster from "./QuantityAdjuster";
import type { ShipmentItem } from "@/src/types/shipment";

interface ShipmentItemCardProps {
  item: ShipmentItem;
  actualQty: number;
  damagedQty: number;
  hasEvidence: boolean;
  onUpdateQty: (val: number) => void;
  onOpenClaim: () => void;
}

export default function ShipmentItemCard({
  item,
  actualQty,
  damagedQty,
  hasEvidence,
  onUpdateQty,
  onOpenClaim,
}: ShipmentItemCardProps) {
  const isShort = actualQty < item.quantity;
  const hasDamage = damagedQty > 0;
  const hasDiscrepancy = isShort || hasDamage;
  const needsEvidence = hasDiscrepancy && !hasEvidence;

  return (
    <Card style={[styles.card, hasDiscrepancy && styles.discrepantCard]}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {item.productName}
            </Text>
            <Text variant="bodySmall" style={styles.batchCode}>
              Mã lô: {item.batchCode}
            </Text>
          </View>
          <BatchExpiryBadge expiryDate={item.expiryDate} />
        </View>

        <View style={styles.body}>
          <View style={styles.qtyContainer}>
            <View style={styles.qtyBox}>
              <Text variant="labelSmall" style={styles.qtyLabel}>
                Yêu cầu
              </Text>
              <Text variant="titleLarge" style={styles.qtyValue}>
                {item.quantity}
              </Text>
            </View>
            <IconButton icon="arrow-right" size={16} style={styles.arrow} />
            <View style={[styles.qtyBox, styles.actualBox]}>
              <Text variant="labelSmall" style={styles.qtyLabel}>
                Thực nhận
              </Text>
              <QuantityAdjuster
                value={actualQty}
                max={item.quantity}
                onChange={onUpdateQty}
                unit={item.unit}
              />
            </View>
          </View>

          {hasDamage && (
            <Chip
              icon="alert-outline"
              compact
              style={styles.damageChip}
              textStyle={styles.damageChipText}
            >
              Hỏng: {damagedQty}
            </Chip>
          )}

          {needsEvidence && (
            <TouchableOpacity style={styles.warningBox} onPress={onOpenClaim}>
              <IconButton
                icon="alert-circle"
                iconColor="#C62828"
                size={20}
                style={styles.warningIcon}
              />
              <Text
                variant="bodySmall"
                style={[styles.warningText, { color: "#C62828" }]}
              >
                Cần bổ sung ảnh bằng chứng (Chạm để nhập)
              </Text>
            </TouchableOpacity>
          )}

          {hasDiscrepancy && hasEvidence && (
            <TouchableOpacity style={styles.successBox} onPress={onOpenClaim}>
              <IconButton
                icon="check-circle"
                iconColor="#2E7D32"
                size={20}
                style={styles.warningIcon}
              />
              <Text
                variant="bodySmall"
                style={[styles.warningText, { color: "#2E7D32" }]}
              >
                Đã có ảnh minh chứng
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 1,
  },
  discrepantCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#E65100",
  },
  cardContent: { padding: 14 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: { flex: 1, marginRight: 8 },
  productName: { fontWeight: "700", color: "#333" },
  batchCode: { color: "#777", marginTop: 2 },
  body: { gap: 12 },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    borderRadius: 8,
  },
  actualBox: {
    flex: 2,
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  qtyLabel: {
    color: "#888",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  qtyValue: { fontWeight: "700", color: "#333" },
  arrow: { marginHorizontal: -12 },
  damageChip: {
    alignSelf: "flex-start",
    backgroundColor: "#FFEBEE",
    borderColor: "#C62828",
    borderWidth: 1,
  },
  damageChipText: { color: "#C62828", fontWeight: "700", fontSize: 11 },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    paddingRight: 10,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingRight: 10,
  },
  warningIcon: { margin: 0 },
  warningText: { fontWeight: "600" },
});
