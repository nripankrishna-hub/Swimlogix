import React, { useState } from 'react';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import { moderatorApi } from '../../api/endpoints';
import { Text, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import { notificationSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { spacing, typography, colors } from '../../theme';
export default function AnnouncementsScreen() {
  const [msg, setMsg] = useState('');
  return (
    <Screen scroll>
      <Text style={styles.title}>Announcements</Text>
      {msg?<Text style={styles.msg}>{msg}</Text>:null}
      <Card>
        <Formik initialValues={{ batchId: '', title: '', body: '' }} validationSchema={notificationSchema}
          onSubmit={async (v,h)=>{ setMsg(''); try { await moderatorApi.sendAnnouncement({ batchId: v.batchId, title: v.title, body: v.body }); setMsg('Announcement sent'); h.resetForm(); } catch(e){ setMsg(errorMessage(e)); } finally{ h.setSubmitting(false); } }}>
          {({handleChange,handleBlur,handleSubmit,values,errors,touched,isSubmitting})=>(
            <><AppTextInput label="Batch ID" value={values.batchId} onChangeText={handleChange('batchId')} onBlur={handleBlur('batchId')} />
            <AppTextInput label="Title" value={values.title} onChangeText={handleChange('title')} onBlur={handleBlur('title')} error={errors.title} touched={touched.title} />
            <AppTextInput label="Message" value={values.body} onChangeText={handleChange('body')} onBlur={handleBlur('body')} error={errors.body} touched={touched.body} multiline />
            <AppButton title="Broadcast to batch" loading={isSubmitting} onPress={handleSubmit} /></>)}
        </Formik>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md}, msg:{...typography.small,color:colors.success,fontWeight:'700',marginBottom:spacing.md} });
