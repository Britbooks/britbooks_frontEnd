import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface Props {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showCount?: boolean;
  count?: number;
}

export default function StarRating({ rating, maxStars = 5, size = 16, interactive, onRate, showCount, count }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <TouchableOpacity
            key={i}
            disabled={!interactive}
            onPress={() => onRate?.(i + 1)}
            hitSlop={4}
          >
            <Ionicons
              name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
              size={size}
              color={filled || half ? Colors.accent : Colors.textMuted}
            />
          </TouchableOpacity>
        );
      })}
      {showCount && count !== undefined && (
        <Text style={[styles.count, { fontSize: size * 0.85 }]}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  count: {
    color: Colors.textSecondary,
    marginLeft: 2,
  },
});
