import React from 'react';
import { Text, StyleSheet, ActivityIndicator, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, gradients, shadow } from '../theme';

const VARIANTS = {
  primary: { gradient: gradients.primary, text: colors.textOnPrimary, border: 'transparent' },
  gold: { gradient: gradients.gold, text: '#3A2A00', border: 'transparent' },
  accent: { gradient: [colors.accent, colors.accentLight], text: colors.textOnPrimary, border: 'transparent' },
  outline: { gradient: null, text: colors.primary, border: colors.primary },
  ghost: { gradient: null, text: colors.primary, border: 'transparent' },
  danger: { gradient: null, text: colors.danger, border: colors.danger },
};

const SIZES = {
  sm: { height: 42, padding: spacing.lg, fontSize: 14 },
  md: { height: 52, padding: spacing.xl, fontSize: 16 },
  lg: { height: 58, padding: spacing.xl, fontSize: 17 },
};

/**
 * Primary CTA. `variant` selects the gradient/outline treatment,
 * `loading` swaps the label for a spinner and blocks presses.
 */
export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  fullWidth = true,
  testID,
}) {
  const theme = VARIANTS[variant] || VARIANTS.primary;
  const dims = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={dims.fontSize + 3} color={theme.text} style={styles.iconLeft} /> : null}
          <Text style={[styles.label, { color: theme.text, fontSize: dims.fontSize }]} numberOfLines={1}>
            {title}
          </Text>
          {iconRight ? (
            <Ionicons name={iconRight} size={dims.fontSize + 3} color={theme.text} style={styles.iconRight} />
          ) : null}
        </>
      )}
    </View>
  );

  const body = theme.gradient ? (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { height: dims.height, paddingHorizontal: dims.padding }]}
    >
      {content}
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.padding,
          backgroundColor: variant === 'ghost' ? 'transparent' : colors.card,
          borderColor: theme.border,
          borderWidth: theme.border === 'transparent' ? 0 : 1.5,
        },
      ]}
    >
      {content}
    </View>
  );

  return (
    <Pressable
      testID={testID}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        fullWidth ? styles.full : styles.auto,
        shadow.card,
        { opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1 },
        style,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  auto: { alignSelf: 'flex-start' },
  base: { borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.button },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});
