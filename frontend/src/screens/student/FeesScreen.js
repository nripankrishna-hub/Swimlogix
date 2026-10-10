import React from 'react';
import Screen from '../../components/Screen';
import { Card, KeyValueRow, Badge } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { studentApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { View, Text, StyleSheet } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { formatCurrency, formatDate } from '../../utils/format';
import { spacing, typography } from '../../theme';
export default function FeesScreen() {
  const { data, loading, error, run } = useAsync(() => studentApi.fees(), []);
  if (loading && !data) return <Screen><SkeletonList count={3} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  return (
    <Screen scroll>
      <Text style={styles.title}>Fees</Text>
      <Card><View style={styles.top}><Text style={styles.amt}>{formatCurrency(data.dueAmount)}</Text><Badge label={data.status||'pending'} tone={data.status==='paid'?'success':'warning'} /></View><KeyValueRow label="Payable to" value={data.payableTo} /><KeyValueRow label="Due date" value={formatDate(data.dueDate)} /><KeyValueRow label="Contact" value={data.contact?.phone||''} /></Card>
      <View style={{height:spacing.md}} />
      <Card><Text style={styles.h}>Fee structure</Text>{(data.feeStructure||[]).map((f,i)=>(<KeyValueRow key={i} label={f.name} value={formatCurrency(f.amount)} />))}</Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md}, top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, amt:{fontSize:26,fontWeight:'800'}, h:{...typography.title,marginBottom:spacing.sm} });
