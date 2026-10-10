import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Formik } from 'formik';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { institutionProfileSchema } from '../../utils/validation';
import { colors, spacing, typography } from '../../theme';
export default function InstitutionProfileScreen({ navigation }) {
  const { data, loading, error, run } = useAsync(() => adminApi.getProfile(), []);
  const [msg, setMsg] = useState('');
  if (loading && !data) return <Screen><SkeletonList count={3} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={() => run()} /></Screen>;
  const inst = data.institution || {};
  return (
    <Screen scroll>
      <Text style={styles.title}>Institution profile</Text>
      {inst.code ? <Text style={styles.code}>CODE · {inst.code}</Text> : <Text style={styles.codeWarn}>Code generates on first save</Text>}
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      <Card>
        <Formik enableReinitialize initialValues={{ name: inst.name || '', city: (inst.address||{}).city || '', policy: inst.policy || '', contactEmail: (inst.contact||{}).email || '' }} validationSchema={institutionProfileSchema}
          onSubmit={async (v, h) => { setMsg(''); try { const r = await adminApi.setupProfile({ name: v.name, address: { city: v.city }, policy: v.policy, contact: { email: v.contactEmail } }); setMsg(r.codeGenerated ? `Saved! Your code is ${r.institution.code}` : 'Profile updated'); run(); } catch (e) { setMsg(errorMessage(e)); } finally { h.setSubmitting(false); } }}>
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <><AppTextInput label="Institution name" value={values.name} onChangeText={handleChange('name')} onBlur={handleBlur('name')} error={errors.name} touched={touched.name} />
            <AppTextInput label="City" value={values.city} onChangeText={handleChange('city')} onBlur={handleBlur('city')} />
            <AppTextInput label="Policy" value={values.policy} onChangeText={handleChange('policy')} onBlur={handleBlur('policy')} multiline helper="Displayed to members before enrollment" />
            <AppTextInput label="Contact email" value={values.contactEmail} onChangeText={handleChange('contactEmail')} onBlur={handleBlur('contactEmail')} error={errors.contactEmail} touched={touched.contactEmail} keyboardType="email-address" />
            <AppButton title="Save profile" loading={isSubmitting} onPress={handleSubmit} /></>
          )}
        </Formik>
      </Card>
      <View style={{ height: spacing.lg }} />
      <AppButton title="Manage enrollment form" variant="outline" onPress={() => navigation.navigate('RegistrationFields')} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title: { ...typography.h2, marginBottom: 4 }, code: { ...typography.small, fontWeight: '800', color: colors.primary, marginBottom: spacing.md }, codeWarn: { ...typography.small, color: colors.warning, fontWeight: '700', marginBottom: spacing.md }, msg: { ...typography.small, color: colors.success, fontWeight: '700', marginBottom: spacing.md } });
