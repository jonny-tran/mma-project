import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';

interface BatchExpiryBadgeProps {
  expiryDate: string;
}

export default function BatchExpiryBadge({ expiryDate }: BatchExpiryBadgeProps) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let color = '#2E7D32'; // Green
  let label = `HSD: ${diffDays} ngày`;

  if (diffDays <= 3) {
    color = '#C62828'; // Red
  } else if (diffDays <= 7) {
    color = '#E65100'; // Orange
  }

  if (diffDays < 0) {
    label = 'Đã hết hạn';
    color = '#000000';
  }

  return (
    <Chip
      mode="flat"
      compact
      style={[styles.chip, { backgroundColor: color + '15', borderColor: color }]}
      textStyle={[styles.text, { color }]}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    height: 24,
    borderRadius: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
});
