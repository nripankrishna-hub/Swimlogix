import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card } from '../../components/primitives';
import { SkeletonList, ErrorState, EmptyState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { colors, spacing, typography, radius } from '../../theme';

const TYPES = ['text', 'number', 'email', 'phone', 'date', 'select', 'boolean', 'textarea', 'file'];

export default function RegistrationFieldsScreen() {
  const { data, loading, error, run, setData } = useAsync(() => adminApi.getRegistrationFields(), []);
  const [msg, setMsg] = useState('');
  
  const fields = (data && (data.registrationFields || data.fields)) || [];
  
  const addField = () => { 
    const keyStr = `field_${Date.now()}`;
    const f = { key: keyStr, label: `Field ${fields.length+1}`, type: 'text', required: true, options: [], placeholder: '', description: '' }; 
    setData({ ...data, registrationFields: [...fields, f] }); 
  };
  
  const remove = (i) => setData({ ...data, registrationFields: fields.filter((_,x)=>x!==i) });
  
  const toggleReq = (i) => setData({ ...data, registrationFields: fields.map((f,x)=>x===i?{...f,required:!f.required}:f) });
  
  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setData({ ...data, registrationFields: updated });
  };
  
  const save = async () => { 
    setMsg(''); 
    try { 
      await adminApi.updateRegistrationFields(fields.map((f,i)=>({ 
        key: f.key, label: f.label, type: f.type, required: !!f.required, options: f.options||[], placeholder: f.placeholder||'', description: f.description||'', order: i 
      }))); 
      setMsg('Enrollment form saved successfully!'); 
      run().catch(()=>{}); 
    } catch(e) { 
      setMsg(errorMessage(e)); 
    } 
  };
  
  if (loading && !data) return <Screen><SkeletonList count={3} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  
  return (
    <Screen scroll>
      <Text style={styles.title}>Enrollment form</Text>
      <Text style={styles.sub}>Members fill these fields during registration.</Text>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      
      {fields.length === 0 ? (
        <EmptyState icon="list-outline" title="No fields yet" message="Add your first enrollment field." />
      ) : fields.map((f, i) => (
        <Card key={i} style={{marginBottom:spacing.lg}}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Field Label (Visible to user)</Text>
            <TextInput 
              style={styles.input} 
              value={f.label} 
              onChangeText={(txt) => updateField(i, 'label', txt)}
              placeholder="e.g. Full Name"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Short Description (Optional)</Text>
            <TextInput 
              style={styles.input} 
              value={f.description || ''} 
              onChangeText={(txt) => updateField(i, 'description', txt)}
              placeholder="e.g. Please upload your medical certificate (JPEG/PDF)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map(type => (
                <Pressable 
                  key={type} 
                  onPress={() => updateField(i, 'type', type)}
                  style={[styles.typeBtn, f.type === type && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, f.type === type && styles.typeBtnTextActive]}>{type}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={()=>toggleReq(i)} style={[styles.miniBtn, f.required && styles.miniBtnActive]}>
              <Text style={[styles.miniBtnText, f.required && styles.miniBtnTextActive]}>
                {f.required ? 'Required ✓' : 'Optional'}
              </Text>
            </Pressable>
            <Pressable onPress={()=>remove(i)} style={[styles.miniBtn, styles.delBtn]}>
              <Text style={[styles.miniBtnText, {color:colors.danger}]}>Remove</Text>
            </Pressable>
          </View>
        </Card>
      ))}
      
      <AppButton title="Add field" variant="outline" onPress={addField} />
      <View style={{height:spacing.md}} />
      <AppButton title="Save form" onPress={save} />
      <Text style={styles.note}>Tip: keep keys stable (e.g. full_name, dob, medical_notes). Pin mode: use dashboard settings via API (auto/sequential).</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ 
  title: { ...typography.h2 }, 
  sub: { ...typography.small, marginBottom: spacing.md, color: colors.textDim }, 
  msg: { ...typography.small, color: colors.success, fontWeight: '700', marginBottom: spacing.md }, 
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.caption, textTransform: 'uppercase', marginBottom: 4 },
  input: { backgroundColor: colors.bg, borderRadius: radius.sm, paddingHorizontal: spacing.md, minHeight: 44, ...typography.body, borderWidth: 1, borderColor: colors.border },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeBtnText: { ...typography.small, color: colors.text },
  typeBtnTextActive: { color: colors.card, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }, 
  miniBtn: { backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border }, 
  miniBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  delBtn: { backgroundColor: '#FDECEC', borderColor: '#FBC4C4' }, 
  miniBtnText: { fontWeight: '600', fontSize: 13, color: colors.text },
  miniBtnTextActive: { color: colors.card }
});
