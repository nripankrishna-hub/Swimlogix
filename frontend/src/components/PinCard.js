import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, spacing, typography, shadow } from '../theme';

/**
 * Digital attendance PIN card - the hero element of the member dashboard.
 * Shows the 4-digit PIN spaced out like an ATM card so it can be read aloud
 * or scanned visually by the moderator at the poolside.
 */
export default function PinCard({ pin, name, institutionName, batchName, compact = false }) {
  const digits = String(pin || '••••').padEnd(4, '•').slice(0, 4).split('');
  const active = Boolean(pin);

  return (
    <LinearGradient
      colors={active ? gradients.primary : ['#5B7383', '#7C8F9C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact && styles.compact, shadow.raised]}
    >
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Ionicons name="water" size={16} color={colors.amber} />
          <Text style={styles.brand}>SWIMLOGIX</Text>
        </View>
        <View style={styles.chip} />
      </View>

      <Text style={styles.label}>ATTENDANCE PIN</Text>

      <View style={styles.digitRow}>
        {digits.map((d, i) => (
          <View key={i} style={styles.digitBox}>
            <Text style={styles.digit}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerBlock}>
          <Text style={styles.footerLabel}>MEMBER</Text>
          <Text style={styles.footerValue} numberOfLines={1}>
            {name || '—'}
          </Text>
        </View>
        <View style={[styles.footerBlock, styles.footerRight]}>
          <Text style={styles.footerLabel}>INSTITUTION</Text>
          <Text style={styles.footerValue} numberOfLines={1}>
            {institutionName || '—'}
          </Text>
        </View>
      </View>

      {batchName ? <Text style={styles.batch}>Batch · {batchName}</Text> : null}
      {!active ? <Text style={styles.pending}>PIN unlocks after admin approval</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.lg, minHeight: 190, justifyContent: 'space-between' },
  compact: { minHeight: 150, paddingVertical: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brand: { color: colors.textOnPrimary, fontWeight: '800', letterSpacing: 1.6, fontSize: 12, marginLeft: 6 },
  chip: { width: 34, height: 24, borderRadius: radius.sm, backgroundColor: 'rgba(245,179,1,0.85)' },
  label: { ...typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: spacing.md },
  digitRow: { flexDirection: 'row', marginTop: spacing.sm },
  digitBox: {
    flex: 1,
    height: 54,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 26, fontWeight: '800', color: colors.textOnPrimary, letterSpacing: 1 },
  footer: { flexDirection: 'row', marginTop: spacing.md },
  footerBlock: { flex: 1 },
  footerRight: { alignItems: 'flex-end' },
  footerLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  footerValue: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13, marginTop: 2 },
  batch: { color: colors.amber, fontWeight: '700', fontSize: 12, marginTop: spacing.sm },
  pending: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: spacing.sm },
});
