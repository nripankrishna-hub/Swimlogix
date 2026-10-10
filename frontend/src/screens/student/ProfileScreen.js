import React, { useState } from 'react';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import ConfirmModal from '../../components/ConfirmModal';
import { Card, KeyValueRow } from '../../components/primitives';
import { studentApi } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { spacing, typography, colors } from '../../theme';
export default function ProfileScreen({ navigation }) {
  const { user, institution, studentProfile, reload, logout } = useAuth();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const lookup = async () => { setBusy(true); setMsg(''); try { const p=await studentApi.previewInstitution(code.trim().toUpperCase()); setPreview(p); } catch(e){ setMsg(errorMessage(e)); } finally{ setBusy(false); } };
  const confirm = async () => { setBusy(true); try { await studentApi.changeInstitution(preview.code); setPreview(null); setCode(''); await reload(); } catch(e){ setMsg(errorMessage(e)); } finally{ setBusy(false); } };
  return (
    <Screen scroll>
      <Text style={styles.title}>Profile</Text>
      <Card><KeyValueRow label="Name" value={user?.name} /><KeyValueRow label="Phone" value={user?.phone} /><KeyValueRow label="Institution" value={institution?.name} /><KeyValueRow label="Code" value={institution?.code} /><KeyValueRow label="Status" value={studentProfile?.approvalStatus} /><KeyValueRow label="PIN" value={studentProfile?.assignedPin||'Pending approval'} /></Card>
      <View style={{height:spacing.md}} />
      <Card><Text style={styles.h}>Change institution</Text><Text style={styles.sb}>Exclusively from here. Enter the new code first.</Text><AppTextInput label="New institution code" value={code} onChangeText={(t)=>setCode(t.toUpperCase())} autoCapitalize="characters" /><AppButton title="Look up" variant="outline" loading={busy} onPress={lookup} />{msg?<Text style={styles.msg}>{msg}</Text>:null}</Card>
      <View style={{height:spacing.md}} />
      <AppButton title="Change password (OTP users skip)" variant="ghost" onPress={()=>navigation.navigate('Schedule')} />
      <AppButton title="Sign out" variant="danger" onPress={logout} />
      <ConfirmModal visible={!!preview} title="Confirm new institution" onCancel={()=>setPreview(null)} onConfirm={confirm} loading={busy} rows={preview?[{label:'Institution',value:preview.name},{label:'Tutor',value:preview.tutorName},{label:'Location',value:preview.location||'—'}]:[]} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md}, h:{...typography.title,marginBottom:4}, sb:{...typography.small,marginBottom:spacing.sm}, msg:{...typography.small,color:colors.danger,marginTop:spacing.sm} });
