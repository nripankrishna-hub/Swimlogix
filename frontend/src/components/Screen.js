import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

/**
 * Standard screen wrapper: safe areas, optional scrolling, keyboard avoidance
 * and pull-to-refresh support.
 */
export default function Screen({
  children,
  scroll = false,
  padded = true,
  background = colors.bg,
  refreshControl,
  edges = ['bottom'],
  contentContainerStyle,
  style,
}) {
  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={[
        padded && styles.padded,
        { paddingBottom: spacing.xxl * 1.5 },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }, style]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const useScreenRefresh = (onRefresh, refreshing) => (
  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
