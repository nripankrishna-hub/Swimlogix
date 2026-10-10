import React, { useState } from 'react';
import { Formik } from 'formik';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import ConfirmModal from '../../components/ConfirmModal';
import { superAdminApi } from '../../api/endpoints';
import { createInstitutionSchema } from '../../utils/validation';
import { Text, StyleSheet } from 'react-native';
import { errorMessage } from '../../utils/errors';
import { spacing, typography, colors } from '../../theme';
export default function CreateInstitutionScreen({ navigation }) {
  const [msg, setMsg] = useState('');
  const [tempPass, setTempPass] = useState('');
  return (
    <Screen scroll>
      <Text style={styles.title}>Register institution</Text>
      {msg?<Text style={styles.msg}>{msg}</Text>:null}
      <Card>
        <Formik initialValues={{ name: '', adminName: '', adminPhone: '', subscriptionValidity: '', maxStudents: '', maxModerators: '', maxBatches: '' }} validationSchema={createInstitutionSchema}
          onSubmit={async (v,h)=>{ setMsg(''); try { const r=await superAdminApi.createInstitution({ name:v.name, subscriptionValidity:v.subscriptionValidity||undefined, limits:{ maxStudents:v.maxStudents?Number(v.maxStudents):undefined, maxModerators:v.maxModerators?Number(v.maxModerators):undefined, maxBatches:v.maxBatches?Number(v.maxBatches):undefined }, admin:{ name:v.adminName, phone:v.adminPhone } }); setTempPass(r.temporaryPassword||''); setMsg(`Created! Code ${r.institution?.code||''}`); } catch(e){ setMsg(errorMessage(e)); } finally{ h.setSubmitting(false); } }}>
          {({handleChange,handleBlur,handleSubmit,values,errors,touched,isSubmitting})=>(
            <><AppTextInput label="Institution name" value={values.name} onChangeText={handleChange('name')} onBlur={handleBlur('name')} error={errors.name} touched={touched.name} />
            <AppTextInput label="Admin name" value={values.adminName} onChangeText={handleChange('adminName')} onBlur={handleBlur('adminName')} error={errors.adminName} touched={touched.adminName} />
            <AppTextInput label="Admin mobile" value={values.adminPhone} onChangeText={handleChange('adminPhone')} onBlur={handleBlur('adminPhone')} error={errors.adminPhone} touched={touched.adminPhone} keyboardType="phone-pad" />
            <AppTextInput label="Valid till (YYYY-MM-DD)" value={values.subscriptionValidity} onChangeText={handleChange('subscriptionValidity')} onBlur={handleBlur('subscriptionValidity')} error={errors.subscriptionValidity} touched={touched.subscriptionValidity} />
            <AppTextInput label="Max students" value={values.maxStudents} onChangeText={handleChange('maxStudents')} keyboardType="number-pad" />
            <AppButton title="Register" loading={isSubmitting} onPress={handleSubmit} /></>)}
        </Formik>
      </Card>
      <ConfirmModal visible={!!tempPass} title="Admin temp password" message="Share once — it cannot be retrieved again." icon="key-outline" tone="warning" confirmLabel="Done" onCancel={()=>{setTempPass('');navigation.goBack();}} onConfirm={()=>{setTempPass('');navigation.goBack();}} rows={[{label:'Temporary password',value:tempPass}]} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md}, msg:{...typography.small,color:colors.primary,fontWeight:'700',marginBottom:spacing.md} });
