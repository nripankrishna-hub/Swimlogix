import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Formik } from 'formik';
import { Picker } from '@react-native-picker/picker';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import { adminApi } from '../../api/endpoints';
import { batchSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { colors, spacing, typography, radius } from '../../theme';

export default function BatchFormScreen({ route, navigation }) {
  const { mode, batch } = route.params || {};
  const [msg, setMsg] = useState('');
  const [moderators, setModerators] = useState([]);

  useEffect(() => {
    adminApi.listModerators({ limit: 100 })
      .then(res => setModerators(res.items || []))
      .catch(() => {});
  }, []);

  const initial = { 
    name: batch?.name||'', 
    level: batch?.level||'beginner', 
    capacity: String(batch?.capacity||20), 
    startTime: batch?.timing?.startTime||'06:00', 
    endTime: batch?.timing?.endTime||'07:00', 
    days: batch?.days || [],
    coachId: batch?.coachId?._id || batch?.coachId || '',
    feeAmount: String(batch?.feeAmount||0),
    isFree: batch?.isFree||false,
    hasSwimTestCriteria: batch?.swimTestCriteria ? true : false,
    swimTestCriteria: batch?.swimTestCriteria ? String(batch.swimTestCriteria) : ''
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>{mode==='edit'?'Edit batch':'New batch'}</Text>
      {msg?<Text style={styles.msg}>{msg}</Text>:null}
      <Card>
        <Formik 
          initialValues={initial} 
          validationSchema={batchSchema} 
          onSubmit={async (v,h)=>{ 
            setMsg(''); 
            try { 
              const payload={
                name: v.name,
                level: v.level.toLowerCase(),
                capacity: Number(v.capacity),
                timing: { startTime: v.startTime, endTime: v.endTime },
                days: v.days,
                coachId: v.coachId ? v.coachId : null,
                feeAmount: Number(v.feeAmount),
                isFree: v.isFree,
                swimTestCriteria: v.hasSwimTestCriteria && v.swimTestCriteria ? Number(v.swimTestCriteria) : null
              }; 
              if(mode==='edit') await adminApi.updateBatch(batch._id, payload); 
              else await adminApi.createBatch(payload); 
              navigation.goBack(); 
            } catch(e){ 
              setMsg(errorMessage(e)); 
            } finally{ 
              h.setSubmitting(false); 
            } 
          }}
        >
          {({handleChange,handleBlur,handleSubmit,setFieldValue,values,errors,touched,isSubmitting})=>(
            <>
              <AppTextInput label="Batch name" value={values.name} onChangeText={handleChange('name')} onBlur={handleBlur('name')} error={errors.name} touched={touched.name} />
              <AppTextInput label="Level (beginner/intermediate/advanced/competitive/adult)" value={values.level} onChangeText={handleChange('level')} onBlur={handleBlur('level')} error={errors.level} touched={touched.level} />
              <AppTextInput label="Capacity" value={values.capacity} onChangeText={handleChange('capacity')} onBlur={handleBlur('capacity')} error={errors.capacity} touched={touched.capacity} keyboardType="number-pad" />
              <View style={styles.two}>
                <View style={styles.half}><AppTextInput label="Start (HH:mm)" value={values.startTime} onChangeText={handleChange('startTime')} onBlur={handleBlur('startTime')} error={errors.startTime} touched={touched.startTime} /></View>
                <View style={styles.half}><AppTextInput label="End (HH:mm)" value={values.endTime} onChangeText={handleChange('endTime')} onBlur={handleBlur('endTime')} error={errors.endTime} touched={touched.endTime} /></View>
              </View>
              <Text style={styles.pickerLabel}>Days</Text>
              <View style={styles.chipRow}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const active = values.days.includes(day);
                  return (
                    <Pressable
                      key={day}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() => {
                        const newDays = active 
                          ? values.days.filter(d => d !== day)
                          : [...values.days, day];
                        setFieldValue('days', newDays);
                      }}
                    >
                      <Text style={[styles.dayChipT, active && styles.dayChipTActive]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.days && touched.days ? <Text style={styles.msg}>{errors.days}</Text> : null}
              
              <View style={{ height: spacing.sm }} />
              <View style={{ height: spacing.sm }} />
              <Text style={styles.pickerLabel}>Is Free Batch?</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values.isFree ? 'yes' : 'no'}
                  onValueChange={(val) => { setFieldValue('isFree', val === 'yes'); setFieldValue('feeAmount', '0'); }}
                  style={styles.picker}
                >
                  <Picker.Item label="No, Paid Batch" value="no" color={colors.text} />
                  <Picker.Item label="Yes, Free Batch" value="yes" color={colors.success} />
                </Picker>
              </View>

              {!values.isFree && (
                <AppTextInput label="Monthly Fee Amount" value={values.feeAmount} onChangeText={handleChange('feeAmount')} onBlur={handleBlur('feeAmount')} error={errors.feeAmount} touched={touched.feeAmount} keyboardType="number-pad" />
              )}
              
              <Text style={styles.pickerLabel}>Assign Coach (Moderator)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values.coachId}
                  onValueChange={handleChange('coachId')}
                  style={styles.picker}
                >
                  <Picker.Item label="Unassigned" value="" color={colors.textMuted} />
                  {moderators.map(mod => (
                    <Picker.Item key={mod._id} label={mod.name} value={mod._id} color={colors.text} />
                  ))}
                </Picker>
              </View>

              <View style={{ height: spacing.sm }} />
              <Text style={styles.pickerLabel}>Eligibility Criteria for Swim Test</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values.hasSwimTestCriteria ? 'yes' : 'no'}
                  onValueChange={(val) => { setFieldValue('hasSwimTestCriteria', val === 'yes'); }}
                  style={styles.picker}
                >
                  <Picker.Item label="None" value="no" color={colors.text} />
                  <Picker.Item label="Attendance Minimum" value="yes" color={colors.primary} />
                </Picker>
              </View>

              {values.hasSwimTestCriteria && (
                <AppTextInput label="Minimum Days Attended" value={values.swimTestCriteria} onChangeText={handleChange('swimTestCriteria')} onBlur={handleBlur('swimTestCriteria')} error={errors.swimTestCriteria} touched={touched.swimTestCriteria} keyboardType="number-pad" />
              )}

              <View style={{ height: spacing.md }} />
              <AppButton title={mode==='edit'?'Save changes':'Create batch'} loading={isSubmitting} onPress={handleSubmit} />
            </>
          )}
        </Formik>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ 
  title: { ...typography.h2, marginBottom: spacing.md }, 
  msg: { ...typography.small, color: colors.danger, marginBottom: spacing.md }, 
  two: { flexDirection: 'row', gap: 8 }, 
  half: { flex: 1 },
  pickerLabel: { ...typography.caption, textTransform: 'uppercase', marginBottom: 4 },
  pickerContainer: { backgroundColor: colors.bg, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  picker: { height: 50, width: '100%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  dayChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipT: { ...typography.small, color: colors.text },
  dayChipTActive: { color: colors.card, fontWeight: '700' }
});
