import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";

interface DiscrepancyFormProps {
  expectedQty: number;
  actualQty: number;
  damagedQty: number;
  hasEvidence: boolean;
  onPress: () => void;
}

export default function DiscrepancyForm({
  expectedQty,
  actualQty,
  damagedQty,
  hasEvidence,
  onPress,
}: DiscrepancyFormProps) {
  const missingQty = Math.max(0, expectedQty - actualQty);
  const hasIssue = missingQty > 0 || damagedQty > 0;

  if (!hasIssue) return null;

  return (
    <Surface style={styles.container} elevation={1} onTouchEnd={onPress}>
      <View style={styles.row}>
        <IconButton
          icon={hasEvidence ? "check-circle" : "alert-circle"}
          iconColor={hasEvidence ? "#2E7D32" : "#C62828"}
          size={20}
          style={styles.icon}
        />
        <View style={styles.info}>
          {missingQty > 0 && (
            <Text variant="bodySmall" style={styles.text}>
              Thiếu: {missingQty}
            </Text>
          )}
          {damagedQty > 0 && (
            <Text variant="bodySmall" style={styles.text}>
              Hỏng: {damagedQty}
            </Text>
          )}
          <Text variant="labelSmall" style={styles.hint}>
            {hasEvidence ? "Đã có ảnh minh chứng" : "Chạm để bổ sung ảnh"}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FFF8F1",
  },
  row: { flexDirection: "row", alignItems: "center" },
  icon: { margin: 0 },
  info: { flex: 1, marginLeft: 4 },
  text: { color: "#333", fontWeight: "600" },
  hint: { color: "#888", marginTop: 2 },
});
