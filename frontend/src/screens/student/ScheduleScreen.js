import React from 'react';
import Screen from '../../components/Screen';
import { Card, KeyValueRow } from '../../components/primitives';
import { SkeletonList, ErrorState, EmptyState } from '../../components/states';
import { studentApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { Text, StyleSheet } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { formatTimeRange, formatDays } from '../../utils/format';
import { spacing, typography } from '../../theme';
export default function ScheduleScreen() {
  const { data, loading, error, run } = useAsync(() => studentApi.schedule(), []);
  if (loading && !data) return <Screen><SkeletonList count={2} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  const b = data.batch;
  return (
    <Screen scroll>
      <Text style={styles.title}>Class schedule</Text>
      {!b?<EmptyState icon="calendar-outline" title="No batch yet" message="Your admin will assign a batch after approval." />:(
        <Card><KeyValueRow label="Batch" value={b.name} /><KeyValueRow label="Timing" value={formatTimeRange(b.timing)} /><KeyValueRow label="Days" value={formatDays(b.days)} /><KeyValueRow label="Coach" value={b.coachId?.name||'—'} /></Card>)}
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md} });
