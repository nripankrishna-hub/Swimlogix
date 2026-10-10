import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/AppButton';
import { Card, SectionHeader, StatTile, ProgressBar, Badge, KeyValueRow } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync, { useReloadOnFocus } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, statusTone } from '../../utils/format';
import { errorMessage } from '../../utils/errors';
import { colors, gradients, radius, spacing, typography } from '../../theme';

/** Institution portal home: live KPIs, subscription state and today's attendance. */
export default function AdminDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { data, loading, refreshing, error, run } = useAsync(() => adminApi.dashboard(), []);
  useReloadOnFocus(run);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message={errorMessage(error)} onRetry={() => run().catch(() => {})} />
      </SafeAreaView>
    );
  }

  const d = data || {};
  const institution = d.institution || {};
  const students = d.students || {};
  const attendance = d.attendance || {};
  const subscription = d.subscription || {};
  const week = attendance.last7Days || { percentage: 0 };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => run({ isRefresh: true })} />}
      >
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Welcome back</Text>
              <Text style={styles.heroName}>{user && user.name ? user.name : 'Admin'}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="business" size={14} color={colors.amber} />
              <Text style={styles.heroBadgeText}>{institution.code || 'SETUP'}</Text>
            </View>
          </View>
          <Text style={styles.heroInstitution}>{institution.name}</Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroMeta}>
              {subscription.validity
                ? `Licence valid till ${formatDate(subscription.validity)}${
                    subscription.daysLeft !== null ? ` · ${subscription.daysLeft}d left` : ''
                  }`
                : 'Subscription validity not set'}
            </Text>
          </View>
        </LinearGradient>

        {d.needsProfileSetup ? (
          <Card style={styles.alertCard}>
            <View style={styles.alertRow}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertTitle}>Complete your institution profile</Text>
                <Text style={styles.alertText}>
                  Add address, policy, logo and fees to generate your Unique Institution Code.
                </Text>
              </View>
            </View>
            <AppButton
              title="Set up profile"
              variant="gold"
              size="sm"
              iconRight="arrow-forward"
              onPress={() => navigation.navigate('InstitutionProfile')}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : null}

        <View style={styles.statsRow}>
          <StatTile label="Students" value={String(students.total || 0)} icon="people-outline" />
          <StatTile label="Pending" value={String(students.pending || 0)} icon="person-add-outline" tone="warning" />
          <StatTile label="Batches" value={String(d.batches || 0)} icon="albums-outline" tone="gold" />
        </View>
        <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
          <StatTile label="Moderators" value={String(d.moderators || 0)} icon="shield-checkmark-outline" tone="info" />
          <StatTile label="Present today" value={String(attendance.today || 0)} icon="checkmark-done-outline" tone="success" />
          <StatTile label="7-day rate" value={`${Math.round(week.percentage || 0)}%`} icon="trending-up-outline" />
        </View>

        <SectionHeader title="Attendance (last 7 days)" />
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Weekly attendance</Text>
            <Text style={styles.bigPct}>{Math.round(week.percentage || 0)}%</Text>
          </View>
          <ProgressBar value={week.percentage || 0} style={{ marginVertical: spacing.sm }} />
          <Text style={styles.meta}>
            Present {week.present || 0} · Late {week.late || 0} · Absent {week.absent || 0}
          </Text>
        </Card>

        <SectionHeader title="Quick actions" />
        <View style={styles.actions}>
          <AppButton title="Approve" size="sm" variant="outline" icon="person-add-outline" fullWidth={false} onPress={() => navigation.navigate('Approvals')} style={styles.actionBtn} />
          <AppButton title="Batches" size="sm" variant="outline" icon="albums-outline" fullWidth={false} onPress={() => navigation.navigate('Batches')} style={styles.actionBtn} />
        </View>
        <View style={styles.actions}>
          <AppButton title="Monitoring" size="sm" variant="outline" icon="analytics-outline" fullWidth={false} onPress={() => navigation.navigate('Monitoring')} style={styles.actionBtn} />
          <AppButton title="Broadcast" size="sm" variant="outline" icon="megaphone-outline" fullWidth={false} onPress={() => navigation.navigate('Communication')} style={styles.actionBtn} />
        </View>
        <View style={styles.actions}>
          <AppButton title="Attendance" size="sm" variant="outline" icon="checkmark-circle-outline" fullWidth={false} onPress={() => navigation.navigate('Attendance')} style={styles.actionBtn} />
        </View>

        <SectionHeader title="Recent swim tests" />
        {(d.recentSwimTests || []).length === 0 ? (
          <Card>
            <Text style={styles.meta}>No swim tests graded yet.</Text>
          </Card>
        ) : (
          (d.recentSwimTests || []).map((t) => (
            <Card key={String(t._id)} style={styles.testCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{t.testName}</Text>
                <Badge label={t.result || 'pending'} tone={statusTone(t.result)} />
              </View>
              <Text style={styles.meta}>
                {formatDate(t.testDate)} · {t.marks}/{t.maxMarks || 100}
                {t.studentId && t.studentId.assignedPin ? ` · PIN ${t.studentId.assignedPin}` : ''}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { padding: spacing.lg },
  scroll: { paddingBottom: spacing.xxl * 2 },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroGreeting: { ...typography.small, color: 'rgba(255,255,255,0.8)' },
  heroName: { ...typography.h1, color: colors.textOnPrimary },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  heroBadgeText: { color: colors.amber, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  heroInstitution: { ...typography.title, color: 'rgba(255,255,255,0.95)', marginTop: spacing.md },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  heroMeta: { ...typography.small, color: 'rgba(255,255,255,0.8)' },
  alertCard: { marginTop: spacing.lg, borderColor: colors.warning, borderWidth: 1 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  alertTextWrap: { flex: 1 },
  alertTitle: { ...typography.title },
  alertText: { ...typography.small, marginTop: 2, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.title },
  bigPct: { fontSize: 20, fontWeight: '800', color: colors.primary },
  meta: { ...typography.small, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  actionBtn: { flex: 1 },
  testCard: { marginBottom: spacing.sm },
});
