import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import { moderatorApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { formatDate, statusTone } from '../../utils/format';
import { colors, spacing, typography } from '../../theme';
import { Formik } from 'formik';
import { swimTestSchema } from '../../utils/validation';
export default function SwimTestScreen() {
  const { data, loading, refreshing, error, run } = useAsync(() => moderatorApi.listSwimTests({ limit: 50 }), []);
  const [msg, setMsg] = useState('');
  const items = (data && data.items) || [];
  if (loading && !data) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={()=>run()} /></Screen>;
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}>
        <SectionHeader title="Swim tests" subtitle="Record marks + pass/fail" />
        <Card>
          <Formik initialValues={{ studentId: '', testName: '', marks: '', maxMarks: '100' }} validationSchema={swimTestSchema}
            onSubmit={async (v,h)=>{ setMsg(''); try { await moderatorApi.createSwimTest({ studentId: v.studentId, testName: v.testName, marks: Number(v.marks), maxMarks: Number(v.maxMarks||100) }); setMsg('Test recorded'); h.resetForm(); run().catch(()=>{}); } catch(e){ setMsg(errorMessage(e)); } finally{ h.setSubmitting(false); } }}>
            {({handleChange,handleBlur,handleSubmit,values,errors,touched,isSubmitting})=>(
              <><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><AppTextInput label="Test" value={values.testName} onChangeText={handleChange('testName')} onBlur={handleBlur('testName')} error={errors.testName} touched={touched.testName} /></View><View style={{width:90}}><AppTextInput label="Marks" value={values.marks} onChangeText={handleChange('marks')} onBlur={handleBlur('marks')} error={errors.marks} touched={touched.marks} keyboardType="number-pad" /></View></View>
              <AppTextInput label="Student ID" value={values.studentId} onChangeText={handleChange('studentId')} onBlur={handleBlur('studentId')} helper="From Students tab" />
              {msg?<Text style={styles.msg}>{msg}</Text>:null}
              <AppButton title="Save result" loading={isSubmitting} onPress={handleSubmit} /></>)}
          </Formik>
        </Card>
      </View>
      <FlatList data={items} keyExtractor={(_,i)=>String(i)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>run({isRefresh:true})} />}
        ListEmptyComponent={<EmptyState icon="stopwatch-outline" title="No tests yet" message="Record the first evaluation above." />}
        renderItem={({item})=>(
          <Card style={styles.row}><View style={styles.top}><Text style={styles.nm}>{item.testName}</Text><Badge label={item.result||'pending'} tone={statusTone(item.result)} /></View><Text style={styles.sb}>{item.marks}/{item.maxMarks||100} · {formatDate(item.testDate)}</Text></Card>)} />
    </Screen>
  );
}
const styles = StyleSheet.create({ head:{paddingHorizontal:spacing.lg,paddingTop:spacing.md}, msg:{...typography.small,color:colors.success,fontWeight:'700',marginBottom:spacing.sm}, list:{padding:spacing.lg}, row:{marginBottom:spacing.sm}, top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, nm:{...typography.title}, sb:{...typography.small,marginTop:4} });
