import React, { useState } from 'react';
import Screen from '../../components/Screen';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { superAdminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, TextInput } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { colors, radius, spacing, typography } from '../../theme';
export default function InstitutionsScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const { data, loading, refreshing, error, run } = useAsync(() => superAdminApi.listInstitutions({ search: appliedQ||undefined, limit: 50 }), [appliedQ]);
  const items = (data && data.items) || (data && data.institutions) || [];
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}>
        <SectionHeader title="Institutions" subtitle="Usage + licence expiry" actionLabel="+ Register" onAction={()=>navigation.navigate('CreateInstitution')} />
        <View style={styles.search}><TextInput value={q} onChangeText={setQ} placeholder="Search name/code" style={styles.in} returnKeyType="search" onSubmitEditing={()=>setAppliedQ(q.trim())} /></View>
      </View>
      {loading&&!data?<View style={styles.pad}><SkeletonList count={4} /></View>:error&&!data?<ErrorState message={errorMessage(error)} onRetry={()=>run()} />:(
      <FlatList data={items} keyExtractor={(_,i)=>String(i)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}
        ListEmptyComponent={<EmptyState icon="business-outline" title="No institutions" message="Register the first one." />}
        renderItem={({item})=>(
          <Pressable onPress={()=>navigation.navigate('InstitutionDetail',{institutionId:String(item._id)})}><Card style={styles.row}><View style={styles.top}><View style={{flex:1}}><Text style={styles.nm}>{item.name}</Text><Text style={styles.sb}>{item.code||'NO CODE'} · valid till {formatDate(item.subscriptionValidity)}</Text></View><Badge label={item.status||'active'} tone={item.status==='active'?'success':'danger'} /></View></Card></Pressable>)} />)}
    </Screen>
  );
}
const styles = StyleSheet.create({ head:{paddingHorizontal:spacing.lg,paddingTop:spacing.md}, search:{backgroundColor:colors.card,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,paddingHorizontal:spacing.md,minHeight:46,justifyContent:'center'}, in:{...typography.body}, pad:{padding:spacing.lg}, list:{padding:spacing.lg}, row:{marginBottom:spacing.sm}, top:{flexDirection:'row',alignItems:'center'}, nm:{...typography.title}, sb:{...typography.small,marginTop:2} });
