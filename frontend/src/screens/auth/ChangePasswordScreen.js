import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import { useAuth } from '../../contexts/AuthContext';
import { passwordSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Mandatory password change for Admin/Moderator accounts created with a temporary password.
 * Also reachable voluntarily from the profile screen (`forced = false`).
 */
export default function ChangePasswordScreen({ route, navigation }) {
  const forced = Boolean(route.params && route.params.forced);
  const { changePassword, logout } = useAuth();
  const [serverError, setServerError] = useState('');

  const schema = Yup.object({
    currentPassword: forced ? Yup.string().notRequired() : Yup.string().required('Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: Yup.string()
      .required('Confirm your new password')
      .oneOf([Yup.ref('newPassword')], 'Passwords do not match'),
  });

  const handleSubmit = async (values, helpers) => {
    setServerError('');
    try {
      await changePassword(values.newPassword, forced ? undefined : values.currentPassword);
      if (!forced && navigation.canGoBack()) navigation.goBack();
    } catch (err) {
      setServerError(errorMessage(err, 'Could not update the password'));
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={forced ? 'key' : 'lock-closed'} size={26} color={colors.primary} />
        </View>
        <Text style={styles.title}>{forced ? 'Set your new password' : 'Change password'}</Text>
        <Text style={styles.subtitle}>
          {forced
            ? 'Your account was created with a temporary password. Choose a permanent one to continue.'
            : 'Use at least 8 characters with a mix of letters and numbers.'}
        </Text>
      </View>

      <Card style={styles.card}>
        <Formik
          initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit: submit, values, errors, touched, isSubmitting }) => (
            <>
              {serverError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.errorBannerText}>{serverError}</Text>
                </View>
              ) : null}

              {!forced ? (
                <AppTextInput
                  label="Current password"
                  icon="lock-open-outline"
                  secure
                  value={values.currentPassword}
                  onChangeText={handleChange('currentPassword')}
                  onBlur={handleBlur('currentPassword')}
                  error={errors.currentPassword}
                  touched={touched.currentPassword}
                />
              ) : null}

              <AppTextInput
                label="New password"
                icon="lock-closed-outline"
                secure
                placeholder="At least 8 characters"
                value={values.newPassword}
                onChangeText={handleChange('newPassword')}
                onBlur={handleBlur('newPassword')}
                error={errors.newPassword}
                touched={touched.newPassword}
              />

              <AppTextInput
                label="Confirm new password"
                icon="checkmark-circle-outline"
                secure
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                returnKeyType="done"
                onSubmitEditing={submit}
              />

              <AppButton
                title={forced ? 'Save & continue' : 'Update password'}
                variant={forced ? 'gold' : 'primary'}
                loading={isSubmitting}
                onPress={submit}
              />

              {forced ? (
                <AppButton title="Sign out" variant="ghost" onPress={logout} style={{ marginTop: spacing.md }} />
              ) : null}
            </>
          )}
        </Formik>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg, flexGrow: 1 },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, textAlign: 'center' },
  subtitle: { ...typography.small, textAlign: 'center', marginTop: spacing.sm, lineHeight: 19, paddingHorizontal: spacing.lg },
  card: { padding: spacing.lg },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: { ...typography.small, color: colors.danger, marginLeft: spacing.sm, flex: 1 },
});
