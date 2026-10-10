import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { formatDate, statusTone } from '../../utils/format';
import { colors, radius, spacing, typography } from '../../theme';
export default function MonitoringScreen({ route }) {
  const directId = route?.params?.studentId;
  const [tab, setTab] = useState('attendance');
  const [studentId, setStudentId] = useState(directId || '');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [backfilling, setBackfilling] = useState(false);

  const handleBackfill = async () => {
    Alert.alert(
      'Backfill Absences',
      'This will mark all students with no attendance record on their scheduled batch days (last 7 days) as Absent. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Run', style: 'destructive', onPress: async () => {
          setBackfilling(true);
          try {
            const r = await adminApi.backfillAbsences(7);
            Alert.alert('Done', r.message || 'Backfill complete.');
            run({ isRefresh: true });
          } catch (e) {
            Alert.alert('Error', errorMessage(e));
          } finally {
            setBackfilling(false);
          }
        }},
      ]
    );
  };
  
  const fetcher = async () => {
    const batchesRes = await adminApi.listBatches({ limit: 100 }).catch(() => ({ items: [] }));
    let res;
    if (tab === 'attendance') {
      res = await adminApi.attendanceLogs({ limit: 50, batchId: selectedBatch || undefined });
    } else if (tab === 'tests') {
      res = await adminApi.swimTestResults({ limit: 50, batchId: selectedBatch || undefined });
    } else {
      res = await adminApi.studentProgress(studentId || directId || 'none');
    }
    return { ...res, batches: batchesRes.items || [] };
  };

  const { data, loading, refreshing, error, run } = useAsync(fetcher, [tab, studentId, directId, selectedBatch]);
  const rows = (data && (data.items || data.recentAttendance)) || [];
  const batches = data?.batches || [];

  if (loading && !data && !refreshing) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <SectionHeader title="Monitoring" subtitle="Attendance, swim tests, progress" />
          {tab === 'attendance' && (
            <Pressable
              style={[styles.backfillBtn, backfilling && { opacity: 0.5 }]}
              onPress={handleBackfill}
              disabled={backfilling}
            >
              <Ionicons name="timer-outline" size={14} color={colors.warning} />
              <Text style={styles.backfillTxt}>{backfilling ? '…' : 'Backfill'}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.tabs}>{[['attendance','Attendance'],['tests','Swim tests'],['progress','Progress']].map(([k,l])=>(<Text key={k} onPress={()=>setTab(k)} style={[styles.tab,tab===k&&styles.on]}>{l}</Text>))}</View>
        
        {tab === 'progress' ? (
          <>
            <View style={styles.search}>
              <TextInput value={studentId} onChangeText={setStudentId} placeholder="Student ID" style={styles.in} onSubmitEditing={()=>run().catch(()=>{})} />
            </View>
            {data && data.batchInfo && (
              <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: data.batchInfo.isEligibleForSwimTest ? '#E8F5E9' : '#FFF3E0', borderRadius: radius.md }}>
                <Text style={{ ...typography.small, fontWeight: '700', color: data.batchInfo.isEligibleForSwimTest ? colors.success : colors.warning }}>
                  {data.batchInfo.isEligibleForSwimTest ? '✓ Eligible for Swim Test' : '⚠ Not Eligible for Swim Test'}
                </Text>
                {data.batchInfo.swimTestCriteria ? (
                  <Text style={{ ...typography.caption, marginTop: 2 }}>
                    Batch: {data.batchInfo.name} · Requires {data.batchInfo.swimTestCriteria} days attendance
                  </Text>
                ) : (
                  <Text style={{ ...typography.caption, marginTop: 2 }}>Batch: {data.batchInfo.name} · No criteria set</Text>
                )}
              </View>
            )}
          </>
        ) : (
          batches.length > 0 && (
            <View style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
              <Text style={{ ...typography.caption, color: colors.textDim, marginBottom: spacing.xs }}>Filter by Batch:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <Text onPress={() => setSelectedBatch(null)} style={[styles.chip, selectedBatch === null && styles.chipOn]}>All</Text>
                {batches.map(b => (
                  <Text key={b._id||b.id} onPress={() => setSelectedBatch(b._id||b.id)} style={[styles.chip, selectedBatch === (b._id||b.id) && styles.chipOn]}>
                    {b.name}
                  </Text>
                ))}
              </View>
            </View>
          )
        )}
        
        {data&&data.summary?<Text style={styles.sum}>Attendance {data.summary.percentage||0}% · Present {data.summary.present||0} · Absent {data.summary.absent||0}</Text>:null}
      </View>
      <FlatList data={Array.isArray(rows)?rows:(data?.swimTests||[])} keyExtractor={(_,i)=>String(i)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}
        ListEmptyComponent={<EmptyState icon="analytics-outline" title="No records" message="Records appear after moderators mark them." />}
        renderItem={({item})=>{
          const stuName = item.studentId?.userId?.name;
          const pinStr = item.studentId?.assignedPin ? ` (PIN ${item.studentId.assignedPin})` : '';
          const title = item.testName || (stuName ? stuName + pinStr : pinStr.trim() || 'Record');
          return (
          <Card style={styles.row}>
            <View style={styles.top}>
              <Text style={styles.nm}>{title}</Text>
              <Badge label={item.status||item.result||'—'} tone={statusTone(item.status||item.result)} />
            </View>
            <Text style={styles.sb}>{formatDate(item.date||item.testDate||item.markedAt)} · {item.marks!==undefined?`${item.marks}/${item.maxMarks||100}`:''} {(item.batchId&&item.batchId.name)||''}</Text>
          </Card>
          );
        }} />
    </Screen>
  );
}
const styles = StyleSheet.create({ 
  head:{paddingHorizontal:spacing.lg,paddingTop:spacing.md}, 
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  backfillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6, borderWidth: 1, borderColor: colors.warning, marginTop: spacing.sm },
  backfillTxt: { ...typography.caption, color: colors.warning, fontWeight: '700' },
  tabs:{flexDirection:'row',marginVertical:spacing.sm}, 
  tab:{...typography.small,fontWeight:'800',backgroundColor:colors.bgDark,borderRadius:radius.pill,paddingHorizontal:spacing.md,paddingVertical:8,marginRight:spacing.sm,overflow:'hidden'}, 
  on:{backgroundColor:colors.primary,color:'#fff'}, 
  search:{backgroundColor:colors.card,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,paddingHorizontal:spacing.md,minHeight:46,justifyContent:'center'}, 
  in:{...typography.body}, 
  sum:{...typography.small,fontWeight:'700',color:colors.primary,marginTop:spacing.sm}, 
  list:{padding:spacing.lg}, 
  row:{marginBottom:spacing.md}, 
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, 
  nm:{...typography.title}, 
  sb:{...typography.small,marginTop:4},
  chip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, marginRight: spacing.sm, marginBottom: spacing.sm, overflow: 'hidden', ...typography.small, color: colors.text },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary, color: colors.card, fontWeight: '700' }
});

