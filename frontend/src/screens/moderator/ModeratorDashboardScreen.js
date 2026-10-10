import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card, StatTile, SectionHeader, Badge } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { moderatorApi } from '../../api/endpoints';
import useAsync, { useReloadOnFocus } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { errorMessage } from '../../utils/errors';
import { formatTimeRange, formatDays } from '../../utils/format';
import { spacing, typography } from '../../theme';

export default function ModeratorDashboardScreen() {
  const { user, logout } = useAuth();
  const { data, loading, refreshing, error, run } = useAsync(() => moderatorApi.dashboard(), []);
  
  useReloadOnFocus(run);
  
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  
  const batches = data.batches || [];
  const today = data.today || {};
  
  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}>
      <Text style={styles.title}>Hello, {user?.name||'Coach'}</Text>
      <Text style={styles.sub}>Today: {today.attended||0}/{today.total||0} attended · {today.recordsMarked||0} records</Text>
      <View style={styles.stats}>
        <StatTile label="My batches" value={String(batches.length)} icon="albums-outline" />
        <StatTile label="Students" value={String(data.students||0)} icon="people-outline" tone="gold" />
        <StatTile label="Present today" value={String(today.present||0)} icon="checkmark-done-outline" tone="success" />
      </View>
      <SectionHeader title="Assigned batches" />
      {(batches||[]).map((b)=>(
        <Card key={String(b._id||b.id)} style={{marginBottom:spacing.sm}}>
          <View style={styles.row}>
            <View style={{flex:1}}>
              <Text style={styles.nm}>{b.name}</Text>
              <Text style={styles.sb}>{formatTimeRange(b.timing)} · {formatDays(b.days)}</Text>
            </View>
            <Badge label={b.status||'active'} tone="success" />
          </View>
        </Card>
      ))}
      
      <View style={{ height: spacing.xl }} />
      <AppButton title="Sign out" variant="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({ title:{...typography.h2}, sub:{...typography.small,marginBottom:spacing.md}, stats:{flexDirection:'row',gap:8,marginBottom:spacing.md}, row:{flexDirection:'row',alignItems:'center'}, nm:{...typography.title}, sb:{...typography.small,marginTop:2} });
