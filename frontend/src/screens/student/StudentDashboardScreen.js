import React from 'react';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import PinCard from '../../components/PinCard';
import { Card, StatTile, SectionHeader, ProgressBar, KeyValueRow } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { studentApi } from '../../api/endpoints';
import useAsync, { useReloadOnFocus } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { formatTimeRange, formatDays } from '../../utils/format';
import { spacing, typography } from '../../theme';
export default function StudentDashboardScreen({ navigation }) {
  const { user, institution } = useAuth();
  const { data, loading, refreshing, error, run } = useAsync(() => studentApi.dashboard(), []);
  useReloadOnFocus(run);
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  const att = data.attendance || {};
  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}>
      <PinCard pin={data.pin} name={user?.name} institutionName={institution?.name} batchName={data.batch?.name} />
      <View style={{height:spacing.md}} />
      <View style={styles.stats}>
        <StatTile label="Attendance" value={`${att.percentage||0}%`} icon="checkmark-done-outline" tone="success" />
        <StatTile label="Tests passed" value={String(data.swimTestSummary?.passed||0)} icon="stopwatch-outline" tone="gold" />
        <StatTile label="Unread" value={String(data.unreadNotifications||0)} icon="notifications-outline" />
      </View>
      <SectionHeader title="Progress" actionLabel="Details" onAction={()=>navigation.navigate('Progress')} />
      <Card><ProgressBar value={att.percentage||0} style={{marginBottom:spacing.sm}} /><KeyValueRow label="Batch" value={data.batch?`${data.batch.name} · ${formatTimeRange(data.batch.timing)} · ${formatDays(data.batch.days)}`:'Not assigned'} /><KeyValueRow label="Fees" value={data.fee?.status||'—'} /></Card>
      <View style={{height:spacing.md}} />
      <AppButton title="Class schedule" variant="outline" onPress={()=>navigation.navigate('Schedule')} />
      <View style={{height:spacing.sm}} />
      <Text style={styles.hint}>Show your PIN at the poolside for instant attendance.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({ stats:{flexDirection:'row',gap:8}, hint:{...typography.small,textAlign:'center',marginTop:spacing.sm} });
