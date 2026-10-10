import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card, KeyValueRow, Badge } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { errorMessage } from '../../utils/errors';
import { spacing, typography, colors, radius } from '../../theme';

export default function StudentDetailScreen({ route, navigation }) {
  const { studentId } = route.params || {};
  const { institution } = useAuth();

  const { data: student, loading: sLoad, error: sErr, run: sRun } = useAsync(
    () => adminApi.getStudent(studentId), [studentId]
  );
  const { data: progress, loading: pLoad } = useAsync(
    () => adminApi.studentProgress(studentId), [studentId]
  );

  if (sLoad && !student) return <Screen><SkeletonList count={5} /></Screen>;
  if (sErr && !student) return <Screen><ErrorState message={errorMessage(sErr)} onRetry={() => sRun()} /></Screen>;

  const u = student?.userId || student?.user || {};
  const rD = student?.registrationData || {};
  const stuName =
    rD.student_name || rD.studentName || rD['Student Name'] ||
    rD.full_name || rD.fullName || rD.name || u.name || 'Student';

  const att = progress?.attendance;
  const batch = progress?.batchInfo;
  const eligible = batch?.isEligibleForSwimTest;

  return (
    <Screen scroll>
      {/* ── Name Header ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{stuName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{stuName}</Text>
          {u.phone ? <Text style={styles.phone}>{u.phone}</Text> : null}
        </View>
        <Badge
          label={student?.approvalStatus || '—'}
          tone={student?.approvalStatus === 'approved' ? 'success' : student?.approvalStatus === 'pending' ? 'warning' : 'danger'}
        />
      </View>

      {/* ── Details ── */}
      <Card style={styles.card}>
        <KeyValueRow label="PIN" value={student?.assignedPin || '—'} />
        <KeyValueRow label="Batch" value={student?.batchId?.name || batch?.name || '—'} />
        <KeyValueRow label="Fees" value={student?.feeStatus || '—'} />
        <KeyValueRow label="Institution" value={institution?.name || ''} />
      </Card>

      {/* ── Attendance Stats ── */}
      {!pLoad && att ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Attendance</Text>
          <View style={styles.statRow}>
            <StatBox icon="checkmark-circle-outline" label="Present" value={att.present} color={colors.success} />
            <StatBox icon="time-outline" label="Late" value={att.late} color={colors.warning} />
            <StatBox icon="close-circle-outline" label="Absent" value={att.absent} color={colors.danger} />
            <StatBox icon="trending-up-outline" label="Rate" value={`${Math.round(att.percentage || 0)}%`} color={colors.primary} />
          </View>
        </Card>
      ) : null}

      {/* ── Swim Test Eligibility ── */}
      {!pLoad && batch ? (
        <View style={[styles.eligibilityCard, eligible ? styles.eligibleBg : styles.ineligibleBg]}>
          <Ionicons
            name={eligible ? 'ribbon' : 'ribbon-outline'}
            size={20}
            color={eligible ? colors.success : colors.warning}
          />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[styles.eligibilityTitle, { color: eligible ? colors.success : colors.warning }]}>
              {eligible ? 'Eligible for Swim Test' : 'Not Eligible Yet'}
            </Text>
            {batch.swimTestCriteria ? (
              <Text style={styles.eligibilityDetail}>
                {att?.attended || 0} of {batch.swimTestCriteria} days attended in {batch.name}
              </Text>
            ) : (
              <Text style={styles.eligibilityDetail}>{batch.name} · No criteria set</Text>
            )}
          </View>
        </View>
      ) : null}

      <View style={{ height: spacing.md }} />
      <AppButton
        title="View Full Progress"
        variant="outline"
        iconRight="arrow-forward"
        onPress={() => navigation.navigate('Monitoring', { studentId })}
      />
    </Screen>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight || '#E6F0F3', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { ...typography.h2, color: colors.primary, fontWeight: '700' },
  name: { ...typography.h2 },
  phone: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.caption, textTransform: 'uppercase', color: colors.textMuted, marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { ...typography.h2, fontWeight: '800', marginTop: 4 },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  eligibilityCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1 },
  eligibleBg: { backgroundColor: '#E8F5E9', borderColor: colors.success },
  ineligibleBg: { backgroundColor: '#FFF8E1', borderColor: colors.warning },
  eligibilityTitle: { ...typography.body, fontWeight: '700' },
  eligibilityDetail: { ...typography.small, color: colors.textDim, marginTop: 2 },
});
