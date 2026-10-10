import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, TextInput } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { statusTone } from '../../utils/format';
import { colors, radius, spacing, typography } from '../../theme';
export default function StudentsApprovalScreen({ navigation }) {
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState(null);
  const fetchFn = () => tab==='pending' ? adminApi.listPendingStudents({limit:100}) : adminApi.listStudents({limit:100, search:q||undefined});
  const { data, loading, refreshing, error, run } = useAsync(fetchFn, [tab, q]);
  const items = (data && data.items) || [];
  const approve = async (id) => { setBusyId(id); try { const r=await adminApi.approveStudent(id,{}); setMsg(`Approved! PIN ${r.student?.assignedPin||r.assignedPin||'issued'}`); run().catch(()=>{}); } catch(e){ setMsg(errorMessage(e)); } finally{ setBusyId(null); } };
  const reject = async (id) => { setBusyId(id); try { await adminApi.rejectStudent(id,'Incomplete details'); setMsg('Rejected'); run().catch(()=>{}); } catch(e){ setMsg(errorMessage(e)); } finally{ setBusyId(null); } };
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}>
        <SectionHeader title="Approvals" subtitle="Review enrollment, issue PIN" />
        <View style={styles.tabs}>{['pending','all'].map((t)=>(<Pressable key={t} onPress={()=>setTab(t)} style={[styles.tab,tab===t&&styles.on]}><Text style={[styles.tabT,tab===t&&styles.onT]}>{t==='pending'?'Pending':'All'}</Text></Pressable>))}</View>
        <View style={styles.search}><TextInput value={q} onChangeText={setQ} placeholder="Search name/phone/PIN" style={styles.in} returnKeyType="search" onSubmitEditing={()=>{setTab('all');run().catch(()=>{});}} /></View>
        {msg?<Text style={styles.msg}>{msg}</Text>:null}
      </View>
      <FlatList data={items} keyExtractor={(it,i)=>String(it._id||it.id||i)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}
        ListEmptyComponent={<EmptyState icon="person-add-outline" title="Nothing here" message="No registrations found." />}
        renderItem={({item})=>{ const u=item.user||item.userId||{}; const id=String(item._id||item.id); const rD=item.registrationData||{}; const stuName = rD.student_name||rD.studentName||rD['Student Name']||rD.full_name||rD.fullName||rD.name||u.name||'Student'; return (
          <Card style={styles.card}>
            <View style={styles.top}><View style={styles.av}><Text style={styles.avT}>{String(stuName).slice(0,1).toUpperCase()}</Text></View>
            <View style={styles.mid}><Text style={styles.nm}>{stuName}</Text><Text style={styles.sb}>{u.phone||''} · PIN {item.assignedPin||'—'}</Text></View>
            <Badge label={item.approvalStatus||'pending'} tone={statusTone(item.approvalStatus)} /></View>
            <View style={styles.row}>
              <Pressable style={styles.b} onPress={()=>navigation.navigate('StudentDetail',{studentId:id})}><Text style={styles.bt}>View</Text></Pressable>
              <Pressable style={[styles.b,styles.ok]} onPress={()=>approve(id)}><Text style={[styles.bt,{color:colors.success}]}>{busyId===id?'...':'Approve'}</Text></Pressable>
              <Pressable style={[styles.b,styles.no]} onPress={()=>reject(id)}><Text style={[styles.bt,{color:colors.danger}]}>Reject</Text></Pressable>
            </View>
          </Card>);}} />
    </Screen>
  );
}
const styles = StyleSheet.create({ head:{paddingHorizontal:spacing.lg,paddingTop:spacing.md}, tabs:{flexDirection:'row',backgroundColor:colors.bgDark,borderRadius:radius.pill,padding:4,marginVertical:spacing.sm}, tab:{flex:1,paddingVertical:8,alignItems:'center',borderRadius:radius.pill}, on:{backgroundColor:colors.card}, tabT:{...typography.small,fontWeight:'700'}, onT:{color:colors.primary}, search:{backgroundColor:colors.card,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,paddingHorizontal:spacing.md,minHeight:46,justifyContent:'center'}, in:{...typography.body}, msg:{...typography.small,color:colors.primary,fontWeight:'700',marginTop:spacing.sm}, list:{padding:spacing.lg}, card:{marginBottom:spacing.md}, top:{flexDirection:'row',alignItems:'center'}, av:{width:40,height:40,borderRadius:20,backgroundColor:'#E6F0F3',alignItems:'center',justifyContent:'center'}, avT:{fontWeight:'800',color:colors.primary}, mid:{flex:1,marginHorizontal:spacing.sm}, nm:{...typography.title}, sb:{...typography.small}, row:{flexDirection:'row',marginTop:spacing.sm}, b:{backgroundColor:colors.bg,borderRadius:radius.pill,paddingHorizontal:spacing.md,paddingVertical:8,marginRight:spacing.sm}, ok:{backgroundColor:'#E6F6EC'}, no:{backgroundColor:'#FDECEC'}, bt:{fontWeight:'700',fontSize:13,color:colors.primary} });
