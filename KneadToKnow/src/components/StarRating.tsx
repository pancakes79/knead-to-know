import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onRate, size = 24, readonly = false }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => !readonly && onRate?.(n)}
          disabled={readonly}
          style={{ padding: 2 }}
        >
          <Text style={{
            fontSize: size,
            color: n <= rating ? colors.golden : colors.unchecked,
          }}>
            {n <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
