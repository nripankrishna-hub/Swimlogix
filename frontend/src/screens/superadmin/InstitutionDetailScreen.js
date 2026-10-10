import React, { useState } from 'react';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import ConfirmModal from '../../components/ConfirmModal';
import { Card, KeyValueRow, Badge } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { superAdminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { View, Text, StyleSheet } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { spacing, typography, colors } from '../../theme';
export default function InstitutionDetailScreen({ route, navigation }) {
  const { institutionId } = route.params || {};
  const { data, loading, error, run } = useAsync(() => superAdminApi.getInstitution(institutionId), [institutionId]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [msg, setMsg] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  const inst = data.institution || data || {};
  const usage = data.usage || {};
  const admins = data.admins || [];
  const addAdmin = async () => { setBusy(true); setMsg(''); try { const r = await superAdminApi.addAdmin(inst._id || institutionId, { name: form.name, phone: form.phone }); setTempPass(r.temporaryPassword||''); setMsg('Admin created'); } catch(e){ setMsg(errorMessage(e)); } finally{ setBusy(false); } };
  return (
    <Screen scroll>
      <View style={styles.top}><View style={{flex:1}}><Text style={styles.title}>{inst.name}</Text><Text style={styles.sub}>{inst.code} · valid till {formatDate(inst.subscriptionValidity)}</Text></View><Badge label={inst.status||'active'} tone={inst.status==='active'?'success':'danger'} /></View>
      <Card><KeyValueRow label="Students" value={String(usage.students ?? '—')} /><KeyValueRow label="Moderators" value={String(usage.moderators ?? '—')} /><KeyValueRow label="Batches" value={String(usage.batches ?? '—')} /></Card>
      <View style={{height:spacing.sm}} />
      <Card><Text style={styles.h}>Admins</Text>{admins.length ? admins.map((a)=>(<View key={String(a._id)} style={styles.adminRow}><View style={{flex:1}}><Text style={styles.nm}>{a.name || '—'}</Text><Text style={styles.sub}>{a.phone}{a.lastLoginAt ? ` · last login ${formatDate(a.lastLoginAt)}` : ''}</Text></View><Badge label={a.status||'active'} tone={a.status==='active'?'success':'danger'} /></View>)) : <Text style={styles.sub}>No admin accounts yet.</Text>}</Card>
      <View style={{height:spacing.md}} />
      <Card><Text style={styles.h}>Add admin</Text><AppTextInput label="Name" value={form.name} onChangeText={(t)=>setForm({...form,name:t})} /><AppTextInput label="Mobile" value={form.phone} onChangeText={(t)=>setForm({...form,phone:t})} keyboardType="phone-pad" />{msg?<Text style={styles.msg}>{msg}</Text>:null}<AppButton title="Create admin" loading={busy} onPress={addAdmin} /></Card>
      <ConfirmModal visible={!!tempPass} title="Temp password" message="Copy now — shown only once." icon="key-outline" tone="warning" confirmLabel="Done" onCancel={()=>setTempPass('')} onConfirm={()=>setTempPass('')} rows={[{label:'Password',value:tempPass}]} />
    </Screen>
  );
}
const styles = StyleSheet.create({ top:{flexDirection:'row',alignItems:'center',marginBottom:spacing.md}, title:{...typography.h2}, sub:{...typography.small}, h:{...typography.title,marginBottom:spacing.sm}, nm:{...typography.title}, adminRow:{flexDirection:'row',alignItems:'center',paddingVertical:spacing.xs}, msg:{...typography.small,color:colors.primary,fontWeight:'700',marginBottom:spacing.sm} });
