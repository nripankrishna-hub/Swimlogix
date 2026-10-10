import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { colors, radius, spacing, typography } from '../../theme';

function PromoteStudentSection({ onPromote, onCancel }) {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.listBatches({ limit: 100 }),
      adminApi.listStudents({ limit: 500 })
    ]).then(([bRes, sRes]) => {
      setBatches(bRes.items || []);
      setStudents(sRes.items || []);
      setLoading(false);
    }).catch(e => {
      setMsg(errorMessage(e));
      setLoading(false);
    });
  }, []);

  const handlePromote = async () => {
    if (!studentId) return setMsg('Please select a student');
    setBusy(true); setMsg('');
    try {
      const stu = students.find(s => s._id === studentId);
      const userId = stu?.userId?._id || stu?.userId;
      if (!userId) throw new Error('Student does not have a linked user account');
      await adminApi.promoteModerator(userId);
      onPromote();
    } catch (e) {
      setMsg(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const filteredStudents = students.filter(s => s.batchId?._id === batchId || s.batchId === batchId);

  return (
    <Card>
      <Text style={styles.pickerLabel}>1. Select Batch</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={batchId} onValueChange={setBatchId} style={styles.picker}>
          <Picker.Item label="Select a batch..." value="" color={colors.textMuted} />
          {batches.map(b => <Picker.Item key={b._id} label={b.name} value={b._id} />)}
        </Picker>
      </View>

      <Text style={styles.pickerLabel}>2. Select Student</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={studentId} onValueChange={setStudentId} style={styles.picker} enabled={!!batchId}>
          <Picker.Item label="Select a student..." value="" color={colors.textMuted} />
          {filteredStudents.map(s => {
            const rd = s.registrationData || {};
            const name = rd.student_name || rd.full_name || rd.name || 'Unknown';
            return <Picker.Item key={s._id} label={name} value={s._id} />;
          })}
        </Picker>
      </View>
      
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      <View style={styles.actionRow}>
        <View style={{ flex: 1 }}><AppButton title="Cancel" onPress={onCancel} style={{ backgroundColor: colors.border }} textStyle={{ color: colors.text }} /></View>
        <View style={{ flex: 1 }}><AppButton title="Promote to Coach" loading={busy} onPress={handlePromote} disabled={loading || !studentId} /></View>
      </View>
    </Card>
  );
}

export default function ModeratorsScreen() {
  const { data, loading, refreshing, error, run } = useAsync(() => adminApi.listModerators({ limit: 100 }), []);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const items = (data && data.items) || [];
  const create = async () => {
    setBusy(true); setMsg('');
    try { await adminApi.createModerator({ name: form.name, phone: form.phone, password: form.password }); setMsg('Moderator created'); setForm({ name: '', phone: '', password: '' }); run().catch(()=>{}); }
    catch (e) { setMsg(errorMessage(e)); } finally { setBusy(false); }
  };
  const remove = (id) => {
    Alert.alert('Suspend Coach', 'Are you sure you want to suspend this coach? They will not be able to log in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: async () => { try { await adminApi.removeModerator(id); run().catch(()=>{}); } catch (e) { setMsg(errorMessage(e)); } } }
    ]);
  };
  const revoke = (id) => {
    Alert.alert('Revoke Access', 'Are you sure you want to revert this coach back to a normal member? They will lose coach access.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => { try { await adminApi.revokeModerator(id); run().catch(()=>{}); } catch (e) { setMsg(errorMessage(e)); } } }
    ]);
  };
  const trueDelete = (id) => {
    Alert.alert('Delete From Database', 'Are you sure you want to PERMANENTLY wipe this user from the database? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await adminApi.trueDeleteModerator(id); run().catch(()=>{}); } catch (e) { setMsg(errorMessage(e)); } } }
    ]);
  };
  
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}>
        <SectionHeader title="Coaches / Moderators" subtitle="Register coaches who can mark attendance" />
        
        {isPromoting ? (
          <PromoteStudentSection onPromote={() => { setIsPromoting(false); run().catch(()=>{}); }} onCancel={() => setIsPromoting(false)} />
        ) : (
          <Card>
            <AppTextInput label="Name" value={form.name} onChangeText={(t)=>setForm({...form,name:t})} />
            <AppTextInput label="Mobile" value={form.phone} onChangeText={(t)=>setForm({...form,phone:t})} keyboardType="phone-pad" />
            <AppTextInput label="Password (Optional)" value={form.password} onChangeText={(t)=>setForm({...form,password:t})} secure helper="Leave blank for OTP login or auto-generated password" />
            {msg?<Text style={styles.msg}>{msg}</Text>:null}
            <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}><AppButton title="Register Coach" loading={busy} onPress={create} /></View>
              <View style={{ flex: 1 }}><AppButton title="Promote Student" onPress={() => setIsPromoting(true)} style={{ backgroundColor: '#E6F0F3' }} textStyle={{ color: colors.primary }} /></View>
            </View>
          </Card>
        )}
        <View style={{height:spacing.md}} />
      </View>
      
      <FlatList data={items} keyExtractor={(m)=>String(m._id||m.id)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}
        ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No moderators" message="Create coach logins above." />}
        renderItem={({item})=>(
          <Card style={styles.row}>
            <View style={styles.top}><View style={{flex:1}}><Text style={styles.nm}>{item.name}</Text><Text style={styles.sb}>{item.phone} · {(item.batches||[]).length} batches</Text></View><Badge label={item.status||'active'} tone={item.status==='active'?'success':'danger'} /></View>
            <View style={styles.actionRow}>
              {item.status !== 'suspended' && (
                <Pressable style={styles.del} onPress={()=>remove(String(item._id||item.id))}><Text style={styles.delT}>Suspend</Text></Pressable>
              )}
              {item.isStudent ? (
                <Pressable style={[styles.del, styles.revokeBtn]} onPress={()=>revoke(String(item._id||item.id))}><Text style={styles.revokeT}>Revoke (Keep as Member)</Text></Pressable>
              ) : (
                <Pressable style={[styles.del, styles.trueDeleteBtn]} onPress={()=>trueDelete(String(item._id||item.id))}><Text style={styles.revokeT}>Delete from DB (Wipe Data)</Text></Pressable>
              )}
            </View>
          </Card>)} />
    </Screen>
  );
}

const styles = StyleSheet.create({ 
  head:{paddingHorizontal:spacing.lg,paddingTop:spacing.md}, 
  msg:{...typography.small,color:colors.primary,fontWeight:'700',marginBottom:spacing.sm}, 
  list:{padding:spacing.lg,paddingTop:0}, 
  row:{marginBottom:spacing.md}, 
  top:{flexDirection:'row',alignItems:'center'}, 
  nm:{...typography.title}, 
  sb:{...typography.small}, 
  actionRow: { flexDirection: 'row', gap: spacing.sm }, 
  del:{flex:1,marginTop:spacing.sm,backgroundColor:'#FDECEC',borderRadius:radius.pill,paddingVertical:8,alignItems:'center'}, 
  delT:{color:colors.danger,fontWeight:'700',fontSize:13}, 
  revokeBtn: { backgroundColor: colors.warning }, 
  trueDeleteBtn: { backgroundColor: colors.danger },
  revokeT: { color: colors.card, fontWeight: '700', fontSize: 13 },
  pickerLabel: { ...typography.caption, textTransform: 'uppercase', marginBottom: 4, marginTop: spacing.sm },
  pickerContainer: { backgroundColor: colors.bg, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  picker: { height: 50, width: '100%' },
});
