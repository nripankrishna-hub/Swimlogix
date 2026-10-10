import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, TextInput } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import ConfirmModal from '../../components/ConfirmModal';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { formatTimeRange, formatDays, statusTone } from '../../utils/format';
import { colors, radius, spacing, typography } from '../../theme';
export default function BatchesScreen({ navigation }) {
  const { data, loading, refreshing, error, run } = useAsync(() => adminApi.listBatches({ limit: 100 }), []);
  const [q, setQ] = useState('');
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = ((data && data.items) || []).filter((b) => !q || b.name.toLowerCase().includes(q.toLowerCase()));
  const remove = async () => { setBusy(true); try { await adminApi.deleteBatch(del._id); setDel(null); run().catch(()=>{}); } catch(e){ setDel({...del, err: errorMessage(e)}); } finally { setBusy(false); } };
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}>
        <SectionHeader title="Training batches" subtitle="Create, schedule and assign coaches" actionLabel="+ New" onAction={() => navigation.navigate('BatchForm', { mode: 'create' })} />
        <View style={styles.search}><TextInput value={q} onChangeText={setQ} placeholder="Search batches" style={styles.input} /></View>
      </View>
      <FlatList data={items} keyExtractor={(b)=>String(b._id)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}
        ListEmptyComponent={<EmptyState icon="albums-outline" title="No batches" message="Create your first training batch." />}
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.top}><Text style={styles.name}>{item.name}</Text><Badge label={item.status||'active'} tone={statusTone(item.status)} /></View>
            <Text style={styles.meta}>{formatTimeRange(item.timing)} · {formatDays(item.days)}</Text>
            <Text style={styles.meta}>Coach: {(item.coachId && item.coachId.name) || 'Unassigned'} · Cap {item.capacity||'—'}</Text>
            <View style={styles.row}>
              <Pressable style={styles.btn} onPress={()=>navigation.navigate('BatchForm',{mode:'edit',batch:item})}><Text style={styles.btnT}>Edit</Text></Pressable>
              <Pressable style={styles.btn} onPress={()=>navigation.navigate('BatchDetail',{batchId:item._id})}><Text style={styles.btnT}>Roster</Text></Pressable>
              <Pressable style={[styles.btn,styles.delBtn]} onPress={()=>setDel(item)}><Text style={[styles.btnT,{color:colors.danger}]}>Delete</Text></Pressable>
            </View>
          </Card>)} />
      <ConfirmModal visible={!!del} title="Delete batch?" message={(del&&del.err)||'Blocked while students are enrolled.'} icon="trash-outline" tone="danger" confirmLabel="Delete" loading={busy} onCancel={()=>setDel(null)} onConfirm={remove} rows={del?[{label:'Batch',value:del.name}]:[]} />
    </Screen>
  );
}
const styles = StyleSheet.create({ head:{paddingHorizontal:spacing.lg,paddingTop:spacing.md}, search:{backgroundColor:colors.card,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,paddingHorizontal:spacing.md,minHeight:46,justifyContent:'center',marginBottom:spacing.sm}, input:{...typography.body}, list:{padding:spacing.lg}, card:{marginBottom:spacing.md}, top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, name:{...typography.title}, meta:{...typography.small,marginTop:4}, row:{flexDirection:'row',marginTop:spacing.md}, btn:{backgroundColor:colors.bg,borderRadius:radius.pill,paddingHorizontal:spacing.md,paddingVertical:8,marginRight:spacing.sm}, delBtn:{backgroundColor:'#FDECEC'}, btnT:{fontWeight:'700',fontSize:13,color:colors.primary} });
