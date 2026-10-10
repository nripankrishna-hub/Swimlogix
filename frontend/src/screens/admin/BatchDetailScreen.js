import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card, KeyValueRow, Badge } from '../../components/primitives';
import { SkeletonList, ErrorState, EmptyState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync, { useReloadOnFocus } from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { formatTimeRange, formatDays } from '../../utils/format';
import { spacing, typography, colors, radius } from '../../theme';

const LEVEL_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#2196F3',
  advanced: '#9C27B0',
  competitive: '#F44336',
  adult: '#FF9800',
};

export default function BatchDetailScreen({ route, navigation }) {
  const { batchId } = route.params || {};
  const { data, loading, error, run } = useAsync(() => adminApi.getBatch(batchId), [batchId]);

  useReloadOnFocus(run);

  if (loading && !data) return <Screen><SkeletonList count={5} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={() => run()} /></Screen>;

  const batch = data?.batch || data || {};
  const roster = data?.roster || [];
  const levelColor = LEVEL_COLORS[batch.level] || colors.primary;
  const slotsLeft = (batch.capacity || 0) - (batch.enrolledCount || roster.length);

  return (
    <Screen scroll>
      {/* ── Header ── */}
      <View style={styles.hero}>
        <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
        <View style={styles.heroText}>
          <Text style={styles.title}>{batch.name}</Text>
          <Text style={styles.sub}>{formatTimeRange(batch.timing)}</Text>
          <Text style={styles.subDays}>{formatDays(batch.days)}</Text>
        </View>
        <AppButton
          title="Edit"
          variant="outline"
          size="sm"
          iconRight="pencil-outline"
          onPress={() => navigation.navigate('BatchForm', { mode: 'edit', batch })}
        />
      </View>

      {/* ── Info Card ── */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <InfoTile icon="person-outline" label="Coach" value={(batch.coachId && batch.coachId.name) || 'Unassigned'} />
          <InfoTile icon="layers-outline" label="Level" value={batch.level || '—'} valueColor={levelColor} />
          <InfoTile icon="people-outline" label="Capacity" value={`${roster.length}/${batch.capacity || '—'}`} valueColor={slotsLeft <= 2 ? colors.danger : colors.success} />
        </View>

        {batch.swimTestCriteria ? (
          <View style={styles.criteriaRow}>
            <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
            <Text style={styles.criteriaText}>
              Swim test eligibility: <Text style={{ fontWeight: '700' }}>{batch.swimTestCriteria} days</Text> attendance required
            </Text>
          </View>
        ) : null}
      </Card>

      {/* ── Roster ── */}
      <View style={styles.rh}>
        <Text style={styles.h}>Student Roster</Text>
        <Text style={styles.rCount}>{roster.length} enrolled</Text>
      </View>

      {roster.length === 0 ? (
        <Card>
          <EmptyState icon="people-outline" title="No students" message="Approve members into this batch." />
        </Card>
      ) : (
        roster.map((s, i) => {
          const name = (s.userId && s.userId.name) || 'Member';
          const initial = name.charAt(0).toUpperCase();
          return (
            <Card key={i} style={styles.rosterCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{initial}</Text>
              </View>
              <View style={styles.rosterInfo}>
                <Text style={styles.rn}>{name}</Text>
                {s.userId?.phone ? <Text style={styles.phone}>{s.userId.phone}</Text> : null}
              </View>
              {s.assignedPin ? (
                <View style={styles.pinBadge}>
                  <Ionicons name="keypad-outline" size={12} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={styles.rp}>{s.assignedPin}</Text>
                </View>
              ) : (
                <View style={[styles.pinBadge, styles.pinBadgeEmpty]}>
                  <Text style={styles.rpEmpty}>No PIN</Text>
                </View>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function InfoTile({ icon, label, value, valueColor }) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md, gap: spacing.md },
  levelDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, flexShrink: 0 },
  heroText: { flex: 1 },
  title: { ...typography.h1, color: colors.primary },
  sub: { ...typography.body, color: colors.textDim, marginTop: 2 },
  subDays: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  infoCard: { marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tile: { alignItems: 'center', flex: 1 },
  tileLabel: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  tileValue: { ...typography.body, fontWeight: '700', color: colors.text, marginTop: 2, textAlign: 'center' },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 },
  criteriaText: { ...typography.small, color: colors.textDim, flex: 1 },
  rh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  h: { ...typography.title },
  rCount: { ...typography.small, color: colors.textMuted },
  rosterCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight || '#E6F0F3', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, flexShrink: 0 },
  avatarTxt: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  rosterInfo: { flex: 1 },
  rn: { ...typography.body, fontWeight: '600' },
  phone: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  pinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FBF4', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.success },
  pinBadgeEmpty: { backgroundColor: colors.bgDark, borderColor: colors.border },
  rp: { ...typography.small, fontWeight: '700', color: colors.success, letterSpacing: 1 },
  rpEmpty: { ...typography.caption, color: colors.textMuted },
});
