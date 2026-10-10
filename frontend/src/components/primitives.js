import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../theme';

/** Elevated white surface used across every screen. */
export const Card = ({ children, style, onPress, padded = true }) => {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={[styles.card, padded && styles.cardPadded, shadow.card, style]}
    >
      {children}
    </Wrapper>
  );
};

/** Section heading with optional right-aligned action. */
export const SectionHeader = ({ title, subtitle, actionLabel, onAction, style, icon }) => (
  <View style={[styles.sectionHeader, style]}>
    <View style={styles.sectionTitleRow}>
      {icon ? <Ionicons name={icon} size={18} color={colors.primary} style={{ marginRight: spacing.sm }} /> : null}
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    {actionLabel ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const TONES = {
  neutral: { bg: '#EEF3F8', fg: colors.textMuted },
  success: { bg: '#E6F6EC', fg: colors.success },
  danger: { bg: '#FDECEC', fg: colors.danger },
  warning: { bg: '#FFF5E5', fg: colors.warning },
  info: { bg: '#E8F0FE', fg: colors.info },
  gold: { bg: '#FFF6E0', fg: colors.goldDark },
  primary: { bg: '#E6F0F3', fg: colors.primary },
};

/** Small status chip: tone + label. */
export const Badge = ({ label, tone = 'neutral', icon, style }) => {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]}>{String(label).replace(/_/g, ' ')}</Text>
    </View>
  );
};

export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

export const Spacer = ({ size = spacing.lg }) => <View style={{ height: size }} />;

/** Compact KPI tile used on dashboards. */
export const StatTile = ({ label, value, icon, tone = 'primary', style, onPress }) => {
  const t = TONES[tone] || TONES.primary;
  return (
    <Card style={[styles.statTile, style]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={18} color={t.fg} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
};

/** Thin horizontal progress meter. */
export const ProgressBar = ({ value = 0, color = colors.accent, height = 8, style }) => (
  <View style={[styles.progressTrack, { height }, style]}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color, height },
      ]}
    />
  </View>
);

/** Label / value row used in detail lists. */
export const KeyValueRow = ({ label, value, style }) => (
  <View style={[styles.kvRow, style]}>
    <Text style={styles.kvLabel}>{label}</Text>
    <Text style={styles.kvValue} numberOfLines={2}>
      {value === undefined || value === null || value === '' ? '—' : String(value)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  cardPadded: { padding: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionTitle: { ...typography.h3 },
  sectionSubtitle: { ...typography.small, marginTop: 2 },
  sectionAction: { ...typography.small, color: colors.accent, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize', letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  statTile: { flex: 1, minWidth: 100, padding: spacing.md },
  statIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { ...typography.small, marginTop: 2 },
  progressTrack: { width: '100%', borderRadius: radius.pill, backgroundColor: colors.bgDark, overflow: 'hidden' },
  progressFill: { borderRadius: radius.pill },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  kvLabel: { ...typography.small },
  kvValue: { ...typography.body, flex: 1, textAlign: 'right', marginLeft: spacing.md },
});
