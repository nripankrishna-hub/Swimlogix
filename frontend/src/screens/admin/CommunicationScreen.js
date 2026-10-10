import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import { adminApi } from '../../api/endpoints';
import { notificationSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { colors, spacing, typography } from '../../theme';
export default function CommunicationScreen() {
  const [msg, setMsg] = useState('');
  return (
    <Screen scroll>
      <Text style={styles.title}>Communication hub</Text>
      <Text style={styles.sub}>Broadcast to all members, a batch, or one student.</Text>
      {msg?<Text style={styles.msg}>{msg}</Text>:null}
      <Card>
        <Formik initialValues={{ title: '', body: '', batchId: '' }} validationSchema={notificationSchema}
          onSubmit={async (v,h)=>{ setMsg(''); try { const r=await adminApi.sendNotification({ title:v.title, body:v.body, targetAudience: v.batchId?'batch':'all', batchId: v.batchId||undefined }); setMsg(`Sent to ${r.recipientCount||'members'}`); h.resetForm(); } catch(e){ setMsg(errorMessage(e)); } finally{ h.setSubmitting(false); } }}>
          {({handleChange,handleBlur,handleSubmit,values,errors,touched,isSubmitting})=>(
            <><AppTextInput label="Title" value={values.title} onChangeText={handleChange('title')} onBlur={handleBlur('title')} error={errors.title} touched={touched.title} />
            <AppTextInput label="Message" value={values.body} onChangeText={handleChange('body')} onBlur={handleBlur('body')} error={errors.body} touched={touched.body} multiline />
            <AppTextInput label="Batch ID (optional)" value={values.batchId} onChangeText={handleChange('batchId')} onBlur={handleBlur('batchId')} helper="Leave blank to broadcast to everyone" />
            <AppButton title="Send notification" loading={isSubmitting} onPress={handleSubmit} /></>)}
        </Formik>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2}, sub:{...typography.small,marginBottom:spacing.md}, msg:{...typography.small,color:colors.success,fontWeight:'700',marginBottom:spacing.md} });
