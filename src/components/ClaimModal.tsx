import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  IconButton,
  Divider,
  Surface,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

interface ClaimModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (damagedQty: number, evidenceUrls: string[]) => void;
  productName: string;
  batchCode: string;
  expectedQty: number;
  actualQty: number;
  initialDamagedQty?: number;
  initialEvidence?: string[];
}

export default function ClaimModal({
  visible,
  onClose,
  onSubmit,
  productName,
  batchCode,
  expectedQty,
  actualQty,
  initialDamagedQty = 0,
  initialEvidence = [],
}: ClaimModalProps) {
  const [damagedQty, setDamagedQty] = useState(initialDamagedQty);
  const [images, setImages] = useState<string[]>(initialEvidence);

  const missingQty = Math.max(0, expectedQty - actualQty);

  useEffect(() => {
    if (visible) {
      setDamagedQty(initialDamagedQty);
      setImages(initialEvidence);
    }
  }, [visible, initialDamagedQty, initialEvidence]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (damagedQty > actualQty) {
      Toast.show({
        type: "error",
        text1: "Số lượng hỏng không hợp lệ",
        text2: "Số hỏng không được lớn hơn số thực nhận.",
      });
      return;
    }
    if ((missingQty > 0 || damagedQty > 0) && images.length === 0) {
      Toast.show({
        type: "error",
        text1: "Thiếu hình ảnh",
        text2: "Vui lòng chụp ít nhất 1 ảnh làm bằng chứng",
      });
      return;
    }
    onSubmit(damagedQty, images);
    onClose();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <ScrollView>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              Báo cáo sai lệch
            </Text>
            <IconButton icon="close" onPress={onClose} />
          </View>
          <Divider />

          <View style={styles.content}>
            <Surface style={styles.infoCard} elevation={1}>
              <Text variant="bodyMedium" style={styles.productName}>
                {productName}
              </Text>
              <Text variant="bodySmall" style={styles.batchCode}>
                Lô: {batchCode}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Yêu cầu
                  </Text>
                  <Text variant="titleMedium" style={styles.statValue}>
                    {expectedQty}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Thực nhận
                  </Text>
                  <Text variant="titleMedium" style={styles.statValue}>
                    {actualQty}
                  </Text>
                </View>
                {missingQty > 0 && (
                  <View style={[styles.statBox, styles.statBoxDanger]}>
                    <Text variant="labelSmall" style={styles.statLabel}>
                      Thiếu
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={[styles.statValue, { color: "#C62828" }]}
                    >
                      {missingQty}
                    </Text>
                  </View>
                )}
              </View>
            </Surface>

            <Text variant="titleSmall" style={styles.label}>
              Số lượng hàng hỏng (trong số thực nhận)
            </Text>
            <View style={styles.damagedRow}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() => setDamagedQty((q) => Math.max(0, q - 1))}
                style={styles.qtyBtn}
                iconColor="#E65100"
              />
              <TextInput
                mode="outlined"
                value={String(damagedQty)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!isNaN(n)) setDamagedQty(Math.max(0, n));
                  else if (t === "") setDamagedQty(0);
                }}
                keyboardType="number-pad"
                style={styles.damagedInput}
                outlineColor="#ddd"
                activeOutlineColor="#E65100"
                dense
              />
              <IconButton
                icon="plus"
                size={20}
                onPress={() =>
                  setDamagedQty((q) => Math.min(actualQty, q + 1))
                }
                style={styles.qtyBtn}
                iconColor="#E65100"
              />
            </View>

            <Text variant="titleSmall" style={styles.label}>
              Hình ảnh bằng chứng *
            </Text>
            <View style={styles.captureRow}>
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handlePickImage}
              >
                <IconButton icon="camera" iconColor="#E65100" size={28} />
                <Text style={styles.captureText}>Chụp ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handlePickFromGallery}
              >
                <IconButton icon="image-multiple" iconColor="#E65100" size={28} />
                <Text style={styles.captureText}>Thư viện</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <IconButton
                    icon="close-circle"
                    size={20}
                    iconColor="#C62828"
                    style={styles.removeIcon}
                    onPress={() => removeImage(index)}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Button mode="outlined" onPress={onClose} style={styles.btn}>
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={[styles.btn, styles.primaryBtn]}
            >
              Xác nhận
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingVertical: 10,
  },
  title: { fontWeight: "700", color: "#333" },
  content: { padding: 16, gap: 16 },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    gap: 4,
  },
  productName: { fontWeight: "700", color: "#E65100" },
  batchCode: { color: "#666" },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
  },
  statBoxDanger: { backgroundColor: "#FFEBEE" },
  statLabel: { color: "#888", textTransform: "uppercase", fontSize: 10 },
  statValue: { fontWeight: "700", color: "#333" },
  label: { fontWeight: "700", color: "#555", marginBottom: -8 },
  damagedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  qtyBtn: { margin: 0 },
  damagedInput: {
    width: 80,
    backgroundColor: "#fff",
    textAlign: "center",
  },
  captureRow: { flexDirection: "row", gap: 12 },
  captureBtn: {
    flex: 1,
    height: 90,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E65100",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F1",
  },
  captureText: {
    color: "#E65100",
    fontWeight: "600",
    marginTop: -10,
    fontSize: 12,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  imageWrapper: { position: "relative" },
  image: { width: 80, height: 80, borderRadius: 8 },
  removeIcon: {
    position: "absolute",
    top: -12,
    right: -12,
    margin: 0,
    backgroundColor: "#fff",
  },
  footer: { flexDirection: "row", padding: 16, gap: 12 },
  btn: { flex: 1, borderRadius: 10 },
  primaryBtn: { backgroundColor: "#E65100" },
});
