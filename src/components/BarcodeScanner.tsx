import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Button, IconButton, Surface } from 'react-native-paper';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
}

export default function BarcodeScanner({ visible, onClose, onScanned }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
    setTimeout(() => setScanned(false), 2000); // Cooldown
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeSettings={{
                barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8"],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.middleContainer}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.focusedContainer}>
                  {/* Quét mã vào đây */}
                </View>
                <View style={styles.unfocusedContainer}></View>
              </View>
              <View style={styles.unfocusedContainer}></View>
            </View>

            <Surface style={styles.header} elevation={0}>
                <IconButton 
                    icon="close" 
                    iconColor="white" 
                    size={30} 
                    onPress={onClose} 
                    style={styles.closeBtn}
                />
                <Text style={styles.headerText}>Quét mã Batch</Text>
            </Surface>
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>Hướng camera vào mã QR/Barcode trên kiện hàng</Text>
            </View>
          </CameraView>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Cần quyền truy cập Camera để quét mã</Text>
            <Button mode="contained" onPress={requestPermission} style={styles.btn}>
              Cấp quyền
            </Button>
            <Button mode="text" onPress={onClose}>Đóng</Button>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleContainer: {
    flexDirection: 'row',
    height: 250,
  },
  focusedContainer: {
    width: 250,
    borderWidth: 2,
    borderColor: '#E65100',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden'
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#E65100',
  }
});
