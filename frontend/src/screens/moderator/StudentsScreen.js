import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import Screen from '../../components/Screen';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { moderatorApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { spacing, typography } from '../../theme';
export default function StudentsScreen({ navigation }) {
  const { data, loading, refreshing, error, run } = useAsync(() => moderatorApi.myBatches(), []);
  const [batchId, setBatchId] = useState('');
  const batches = data || [];
  const session = useAsync(() => (batchId ? moderatorApi.getSession(batchId, new Date().toISOString().slice(0,10)) : Promise.resolve({ items: [] })), [batchId]);
  const rows = (session.data && (session.data.items||session.data.roster)) || [];
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}><SectionHeader title="Students" subtitle="Tap a batch, then a member" />
        {(batches||[]).map((b)=>(<Pressable key={String(b._id)} onPress={()=>setBatchId(String(b._id))}><Card style={styles.b}><Text style={styles.nm}>{b.name}</Text></Card></Pressable>))}
      </View>
      <FlatList data={rows} keyExtractor={(_,i)=>String(i)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{run({isRefresh:true});session.run().catch(()=>{});}} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Select a batch" message="Roster appears here." />}
        renderItem={({item})=>{ const u=item.user||item.userId||{}; const sid=item.studentId?._id||item._id||item.id; return (
          <Pressable onPress={()=>navigation.navigate('ProgressDetail',{studentId:String(sid||'')} )}><Card style={styles.row}><Text style={styles.nm}>{u.name||'Member'}</Text><Text style={styles.sb}>PIN {item.assignedPin||'—'} · <Badge label="progress" tone="info" /></Text></Card></Pressable>);}} />
    </Screen>
  );
}
const styles = StyleSheet.create({ head:{paddingHorizontal:spacing.lg,paddingTop:spacing.md}, b:{marginBottom:spacing.sm}, nm:{...typography.title}, sb:{...typography.small,marginTop:2}, list:{padding:spacing.lg}, row:{marginBottom:spacing.sm} });
