import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, IconButton, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function SuccessScreen() {
  const { replace } = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Surface style={styles.iconCircle} elevation={2}>
            <IconButton icon="check-decagram" iconColor="#2E7D32" size={80} />
        </Surface>
        
        <Text variant="headlineSmall" style={styles.title}>Nhận hàng thành công!</Text>
        <Text variant="bodyMedium" style={styles.desc}>
            Dữ liệu nhận hàng đã được lưu và tồn kho cửa hàng đã được cập nhật tương ứng.
        </Text>

        <View style={styles.actionBox}>
            <Button 
                mode="contained" 
                onPress={() => replace('/(store)')}
                style={styles.btn}
                contentStyle={styles.btnContent}
            >
                Về trang chủ
            </Button>
            <Button 
                mode="outlined" 
                onPress={() => replace('/shipments')}
                style={styles.btnOutlined}
                contentStyle={styles.btnContent}
                labelStyle={{ color: '#E65100' }}
            >
                Xem lô hàng khác
            </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  actionBox: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  btn: {
    borderRadius: 12,
    backgroundColor: '#E65100',
  },
  btnOutlined: {
    borderRadius: 12,
    borderColor: '#E65100',
  },
  btnContent: {
    height: 52,
  }
});
