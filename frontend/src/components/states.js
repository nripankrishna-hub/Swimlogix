import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../theme';

/** Full-screen translucent loader with optional caption. */
export const LoadingOverlay = ({ visible, message = 'Loading…' }) => {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={[styles.overlayCard, shadow.raised]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.overlayText}>{message}</Text>
      </View>
    </View>
  );
};

/** Shimmer-free skeleton block: renders a soft grey placeholder. */
export const SkeletonBlock = ({ height = 16, width = '100%', radius: r = radius.sm, style }) => (
  <View style={[{ height, width, borderRadius: r, backgroundColor: colors.bgDark }, style]} />
);

/** Skeleton placeholder mimicking a list of cards while data loads. */
export const SkeletonList = ({ count = 4, itemHeight = 76 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.skeletonCard, shadow.card]}>
        <SkeletonBlock height={38} width={38} radius={radius.md} />
        <View style={styles.skeletonLines}>
          <SkeletonBlock height={13} width="65%" />
          <SkeletonBlock height={11} width="40%" style={{ marginTop: 8 }} />
        </View>
        <SkeletonBlock height={itemHeight / 3} width={54} radius={radius.pill} />
      </View>
    ))}
  </View>
);

/** Friendly empty state with optional CTA. */
export const EmptyState = ({ icon = 'water-outline', title, message, actionLabel, onAction }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name={icon} size={30} color={colors.primaryLight} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    {actionLabel ? (
      <Pressable onPress={onAction} style={styles.emptyAction} hitSlop={8}>
        <Text style={styles.emptyActionText}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

/** Inline error card for failed fetches. */
export const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: '#FDECEC' }]}>
      <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    {onRetry ? (
      <Pressable onPress={onRetry} style={styles.emptyAction} hitSlop={8}>
        <Text style={styles.emptyActionText}>Try again</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  overlayCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  overlayText: { ...typography.small, marginTop: spacing.md },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonLines: { flex: 1, marginLeft: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E6F0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyMessage: { ...typography.small, textAlign: 'center', marginTop: spacing.xs, lineHeight: 19 },
  emptyAction: { marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  emptyActionText: { ...typography.title, color: colors.accent },
});
