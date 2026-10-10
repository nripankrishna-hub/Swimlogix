import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import ConfirmModal from '../../components/ConfirmModal';
import { Card } from '../../components/primitives';
import { LoadingOverlay } from '../../components/states';
import { useAuth } from '../../contexts/AuthContext';
import { studentApi } from '../../api/endpoints';
import { institutionCodeSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { colors, gradients, radius, spacing, typography } from '../../theme';

/**
 * First-time institution linking (one-time entry).
 * 1. Enter the unique institution code
 * 2. Preview institution name, tutor and location in a confirmation modal
 * 3. Confirm -> the link is locked (changeable later only from Profile settings)
 */
export default function InstitutionLinkScreen() {
  const { reload, user, logout } = useAuth();
  const [preview, setPreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');

  const lookUp = async (values) => {
    setError('');
    setLookingUp(true);
    try {
      const data = await studentApi.previewInstitution(String(values.institutionCode).trim().toUpperCase());
      setPreview(data);
      setShowConfirm(true);
    } catch (err) {
      setError(errorMessage(err, 'Institution not found. Check the code and try again.'));
    } finally {
      setLookingUp(false);
    }
  };

  const confirmLink = async () => {
    setLinking(true);
    setError('');
    try {
      await studentApi.linkInstitution(preview.code);
      setShowConfirm(false);
      await reload(); // RootNavigator moves on to the enrollment form
      return; // Early return to avoid updating state on an unmounted component
    } catch (err) {
      setShowConfirm(false);
      setError(errorMessage(err, 'Could not link the institution'));
      setLinking(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={lookingUp} message="Finding your institution…" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.stepPill}>
            <Text style={styles.stepText}>STEP 1 OF 2 · LINK INSTITUTION</Text>
          </View>
          <Text style={styles.heroTitle}>Enter your institution code</Text>
          <Text style={styles.heroSubtitle}>
            Your swim academy shares a unique code (for example AQUA7K). Enter it once to connect
            {user && user.phone ? ` +${user.phone}` : ' your account'}.
          </Text>
        </LinearGradient>

        <Card style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <Formik
            initialValues={{ institutionCode: '' }}
            validationSchema={institutionCodeSchema}
            onSubmit={lookUp}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                <AppTextInput
                  label="Institution code"
                  icon="pricetag-outline"
                  placeholder="AQUA7K"
                  autoCapitalize="characters"
                  maxLength={12}
                  value={values.institutionCode}
                  onChangeText={(t) => handleChange('institutionCode')(t.toUpperCase())}
                  onBlur={handleBlur('institutionCode')}
                  error={errors.institutionCode}
                  touched={touched.institutionCode}
                  returnKeyType="search"
                  onSubmitEditing={handleSubmit}
                />
                <AppButton title="Look up institution" icon="search-outline" onPress={handleSubmit} />
              </>
            )}
          </Formik>

          <View style={styles.hintRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.hintText}>
              Ask your institution admin for the code. Once linked, you can only change it later from your Profile
              settings.
            </Text>
          </View>
        </Card>

        <Pressable style={styles.logoutRow} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={showConfirm}
        title="Confirm your institution"
        message="Please verify the details below. Your account will be linked to this institution."
        icon="business-outline"
        tone="primary"
        confirmLabel="Confirm & link"
        cancelLabel="Cancel"
        loading={linking}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmLink}
        rows={
          preview
            ? [
                { label: 'Institution', value: preview.name },
                { label: 'Tutor / Admin', value: preview.tutorName },
                { label: 'Location', value: preview.location || '—' },
                { label: 'Code', value: preview.code },
              ]
            : []
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,179,1,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  stepText: { ...typography.caption, color: colors.amber },
  heroTitle: { ...typography.h2, color: colors.textOnPrimary },
  heroSubtitle: { ...typography.small, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm, lineHeight: 19 },
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
  hintRow: { flexDirection: 'row', marginTop: spacing.lg },
  hintText: { ...typography.small, flex: 1, marginLeft: spacing.sm, lineHeight: 18 },
  logoutRow: { alignItems: 'center', marginTop: spacing.xl },
  logoutText: { ...typography.small, color: colors.textMuted, fontWeight: '700' },
});

