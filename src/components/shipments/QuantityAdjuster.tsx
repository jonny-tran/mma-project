import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton, Text, Surface } from 'react-native-paper';

interface QuantityAdjusterProps {
  value: number;
  max: number;
  onChange: (val: number) => void;
  unit?: string;
}

export default function QuantityAdjuster({ value, max, onChange, unit }: QuantityAdjusterProps) {
  const handleDec = () => {
    if (value > 0) onChange(value - 1);
  };

  const handleInc = () => {
    if (value < max * 1.5) onChange(value + 1); // Allow extra if they want to report surplus? Backend says report discrepances.
  };

  return (
    <Surface style={styles.container} elevation={1}>
        <IconButton
            icon="minus"
            size={20}
            style={styles.btn}
            iconColor="#E65100"
            onPress={handleDec}
        />
        <View style={styles.inputBox}>
            <Text variant="titleMedium" style={styles.valueText}>{value}</Text>
            {unit && <Text variant="labelSmall" style={styles.unitText}>{unit}</Text>}
        </View>
        <IconButton
            icon="plus"
            size={20}
            style={styles.btn}
            iconColor="#E65100"
            onPress={handleInc}
        />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    height: 44,
  },
  btn: {
    margin: 0,
  },
  inputBox: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
    height: '100%',
  },
  valueText: {
    fontWeight: '700',
    color: '#333',
  },
  unitText: {
    fontSize: 9,
    color: '#888',
    marginTop: -4,
  }
});
