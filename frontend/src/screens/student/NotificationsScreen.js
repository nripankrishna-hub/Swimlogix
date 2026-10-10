import React from 'react';
import Screen from '../../components/Screen';
import { Card, Badge } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { studentApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';
import { spacing, typography } from '../../theme';
export default function NotificationsScreen() {
  const { data, loading, refreshing, error, run } = useAsync(() => studentApi.notifications({ limit: 50 }), []);
  const items = (data && data.items) || [];
  const open = async (id, isRead) => { if (!isRead) { try { await studentApi.markRead(id); run({isRefresh:true}).catch(()=>{}); } catch(e){} } };
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  return (
    <Screen padded={false} edges={['top']}>
      <FlatList data={items} keyExtractor={(_,i)=>String(i)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}
        ListEmptyComponent={<EmptyState icon="notifications-outline" title="All caught up" message="Announcements from your institution appear here." />}
        renderItem={({item})=>(
          <Pressable onPress={()=>open(item._id,item.isRead)}><Card style={[styles.row,!item.isRead&&styles.unread]}><View style={styles.top}><Text style={styles.t}>{item.title}</Text>{!item.isRead?<Badge label="new" tone="info" />:null}</View><Text style={styles.b}>{item.body}</Text><Text style={styles.d}>{formatDateTime(item.timestamp)}</Text></Card></Pressable>)} />
    </Screen>
  );
}
const styles = StyleSheet.create({ list:{padding:spacing.lg}, row:{marginBottom:spacing.sm}, unread:{borderWidth:1.5}, top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, t:{...typography.title,flex:1}, b:{...typography.small,marginTop:4}, d:{...typography.small,marginTop:4,opacity:0.7} });
