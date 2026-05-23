import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/Colors';

interface Props {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export default function OtpInput({ length = 6, value, onChange }: Props) {
  const inputs = useRef<(TextInput | null)[]>([]);

  function handleChange(text: string, index: number) {
    const digits = text.replace(/\D/g, '');
    if (digits.length > 1) {
      const newValue = (value + digits).slice(0, length);
      onChange(newValue.padEnd(length, '').slice(0, length).replace(/ /g, ''));
      onChange(newValue);
      inputs.current[Math.min(newValue.length, length - 1)]?.focus();
      return;
    }
    const arr = value.split('');
    arr[index] = digits;
    const newVal = arr.join('').slice(0, length);
    onChange(newVal);
    if (digits && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const arr = value.split('');
      arr[index - 1] = '';
      onChange(arr.join(''));
    }
  }

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref; }}
          style={[styles.cell, value[i] && styles.cellFilled]}
          value={value[i] || ''}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  cellFilled: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}15`,
  },
});
