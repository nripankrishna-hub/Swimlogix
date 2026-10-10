import React from 'react';
import Screen from '../../components/Screen';
import { Card, Badge, ProgressBar } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import PinCard from '../../components/PinCard';
import { studentApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { formatDate, statusTone } from '../../utils/format';
import { spacing, typography } from '../../theme';
export default function ProgressScreen() {
  const { user } = useAuth();
  const { data, loading, error, run } = useAsync(() => studentApi.progress(), []);
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  const att = data.attendance || {};
  return (
    <Screen scroll>
      <PinCard pin={data.pin} name={user?.name} compact />
      <View style={{height:spacing.md}} />
      <Card><Text style={styles.h}>Attendance {att.percentage||0}%</Text><ProgressBar value={att.percentage||0} style={{marginVertical:spacing.sm}} /><Text style={styles.sb}>Present {att.present||0} · Late {att.late||0} · Absent {att.absent||0}</Text></Card>
      <View style={{height:spacing.md}} />
      <Card><Text style={styles.h}>Swim tests ({(data.swimTests||[]).length})</Text>{(data.swimTests||[]).map((t,i)=>(<View key={i} style={styles.r}><Text style={styles.sb}>{t.testName} · {t.marks}/{t.maxMarks||100} · {formatDate(t.testDate)}</Text><Badge label={t.result||'pending'} tone={statusTone(t.result)} /></View>))}</Card>
      <View style={{height:spacing.md}} />
      <Card><Text style={styles.h}>Milestones</Text>{(data.milestones||[]).map((m,i)=>(<Text key={i} style={styles.sb}>• {m.title} — {m.status}</Text>))}</Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ h:{...typography.title}, sb:{...typography.small,marginTop:4}, r:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:spacing.sm} });
