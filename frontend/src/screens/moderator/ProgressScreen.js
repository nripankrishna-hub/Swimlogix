import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card, KeyValueRow, ProgressBar } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { moderatorApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { spacing, typography } from '../../theme';
export default function ProgressScreen({ route }) {
  const { studentId } = route.params || {};
  const { data, loading, error, run } = useAsync(() => moderatorApi.studentProgress(studentId), [studentId]);
  const [msg, setMsg] = useState('');
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  const att = data.attendance || {};
  return (
    <Screen scroll>
      <Text style={styles.title}>Progress</Text>
      <Card><KeyValueRow label="Attendance" value={`${att.percentage||0}% (${att.attended||0}/${att.total||0})`} /><ProgressBar value={att.percentage||0} style={{marginTop:spacing.sm}} /></Card>
      <View style={{height:spacing.md}} />
      <Card><Text style={styles.h}>Milestones ({(data.milestones||[]).length})</Text>{(data.milestones||[]).map((m,i)=>(<Text key={i} style={styles.sb}>• {m.title} — {m.status}</Text>))}</Card>
      <View style={{height:spacing.md}} />
      <AppButton title="Add milestone" variant="outline" onPress={async ()=>{ setMsg(''); try { await moderatorApi.addMilestone(studentId,{title:'Poolside note',status:'in-progress'}); setMsg('Note added'); run().catch(()=>{}); } catch(e){ setMsg(errorMessage(e)); } }} />
      {msg?<Text style={styles.msg}>{msg}</Text>:null}
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md}, h:{...typography.title,marginBottom:spacing.sm}, sb:{...typography.small,marginTop:4}, msg:{...typography.small,marginTop:spacing.sm} });
