import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { colors, gradients, radius, spacing, typography } from '../../theme';

/**
 * Admin / Moderator / SuperAdmin login: mobile number + password.
 * A temporary password forces a redirect to the change-password screen
 * (handled centrally in RootNavigator via `mustChangePassword`).
 */
export default function PasswordLoginScreen({ navigation, route }) {
  const { initialPhone } = route?.params || {};
  const { loginWithPassword } = useAuth();
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (values, helpers) => {
    setServerError('');
    try {
      await loginWithPassword(values.phone.trim(), values.password);
    } catch (err) {
      setServerError(errorMessage(err, 'Unable to sign in'));
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Ionicons name="shield-checkmark-outline" size={30} color={colors.amber} />
          <Text style={styles.heroTitle}>Staff Portal</Text>
          <Text style={styles.heroSubtitle}>Admins, Moderators & Platform Owner</Text>
        </LinearGradient>

        <Card style={styles.card}>
          <Formik initialValues={{ phone: initialPhone || '', password: '' }} validationSchema={loginSchema} onSubmit={handleSubmit}>
            {({ handleChange, handleBlur, handleSubmit: submit, values, errors, touched, isSubmitting }) => (
              <>
                {serverError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorBannerText}>{serverError}</Text>
                  </View>
                ) : null}

                <AppTextInput
                  label="Mobile number"
                  icon="call-outline"
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  error={errors.phone}
                  touched={touched.phone}
                  autoComplete="tel"
                />

                <AppTextInput
                  label="Password"
                  icon="lock-closed-outline"
                  placeholder="••••••••"
                  secure
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={errors.password}
                  touched={touched.password}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />

                <AppButton title="Sign in" iconRight="arrow-forward" loading={isSubmitting} onPress={submit} />

              </>
            )}
          </Formik>
        </Card>

        <View style={styles.tempHint}>
          <Ionicons name="key-outline" size={15} color={colors.textMuted} />
          <Text style={styles.tempHintText}>
            First time here? Use the temporary password shared by your SuperAdmin / Institution Admin — you will be
            asked to set a new one.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  heroTitle: { ...typography.h2, color: colors.textOnPrimary, marginTop: spacing.sm },
  heroSubtitle: { ...typography.small, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
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
  helperRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  helperText: { ...typography.small },
  helperLink: { ...typography.small, color: colors.accent, fontWeight: '800' },
  tempHint: { flexDirection: 'row', marginTop: spacing.lg, paddingHorizontal: spacing.sm },
  tempHintText: { ...typography.small, flex: 1, marginLeft: spacing.sm, lineHeight: 18 },
});
