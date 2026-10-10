import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Segmented OTP entry: auto-advances on input, backspace walks backwards,
 * and tapping anywhere re-focuses the hidden active field.
 * The last box auto-submits when `onComplete` is provided.
 */
export default function OtpInput({ length = 6, value = '', onChange, onComplete, autoFocus = true, error }) {
  const refs = useRef([]);
  const digits = value.split('').slice(0, length);

  useEffect(() => {
    if (autoFocus && refs.current[0]) {
      const timer = setTimeout(() => refs.current[0] && refs.current[0].focus(), 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoFocus]);

  const setDigit = (index, char) => {
    const cleaned = char.replace(/\D/g, '');
    if (cleaned.length > 1) {
      // Handle paste: distribute the characters across the boxes.
      const next = (value + cleaned).replace(/\D/g, '').slice(0, length);
      onChange(next);
      const lastIndex = Math.min(next.length, length - 1);
      refs.current[lastIndex] && refs.current[lastIndex].focus();
      if (next.length === length && onComplete) onComplete(next);
      return;
    }

    const arr = Array.from({ length }, (_, i) => digits[i] || '');
    arr[index] = cleaned;
    const next = arr.join('').slice(0, length);
    onChange(next);

    if (cleaned && index < length - 1) refs.current[index + 1] && refs.current[index + 1].focus();
    if (next.replace(/\s/g, '').length === length && onComplete) onComplete(next);
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const arr = Array.from({ length }, (_, i) => digits[i] || '');
      arr[index - 1] = '';
      onChange(arr.join(''));
      refs.current[index - 1] && refs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => (
        <Pressable key={index} style={styles.boxWrapper} onPress={() => refs.current[index] && refs.current[index].focus()}>
          <TextInput
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={digits[index] || ''}
            onChangeText={(text) => setDigit(index, text)}
            onKeyPress={(e) => handleKeyPress(index, e.nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={length}
            selectTextOnFocus
            style={[styles.box, digits[index] ? styles.boxFilled : null, error ? styles.boxError : null]}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  boxWrapper: { flex: 1, marginHorizontal: 3 },
  box: {
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    ...typography.h2,
    color: colors.text,
  },
  boxFilled: { borderColor: colors.primary, backgroundColor: '#F0F7FA' },
  boxError: { borderColor: colors.danger },
});
