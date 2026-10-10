import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import ConfirmModal from '../../components/ConfirmModal';
import { Card, KeyValueRow } from '../../components/primitives';
import { useAuth } from '../../contexts/AuthContext';
import { studentApi } from '../../api/endpoints';
import { institutionCodeSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Approval workflow screen: shows "Pending Admin Approval" (or a rejection reason)
 * until the institution admin approves the registration and issues the 4-digit PIN.
 */
export default function PendingApprovalScreen() {
  const { studentProfile, institution, reload, logout } = useAuth();
  const [preview, setPreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const rejected = studentProfile && studentProfile.approvalStatus === 'rejected';

  const lookUp = async (values) => {
    setError('');
    setBusy(true);
    try {
      const data = await studentApi.previewInstitution(String(values.institutionCode).trim().toUpperCase());
      setPreview(data);
      setShowConfirm(true);
    } catch (err) {
      setError(errorMessage(err, 'Institution not found'));
    } finally {
      setBusy(false);
    }
  };

  const confirmChange = async () => {
    setBusy(true);
    try {
      await studentApi.changeInstitution(preview.code);
      setShowConfirm(false);
      await reload();
    } catch (err) {
      setShowConfirm(false);
      setError(errorMessage(err, 'Could not change the institution'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={[styles.hero, { backgroundColor: rejected ? '#FDECEC' : '#FFF6E0' }]}>
        <View style={[styles.heroIcon, { backgroundColor: rejected ? '#F8D7D7' : '#FDEBC4' }]}>
          <Ionicons
            name={rejected ? 'close-circle' : 'time'}
            size={30}
            color={rejected ? colors.danger : colors.goldDark}
          />
        </View>
        <Text style={styles.heroTitle}>{rejected ? 'Registration rejected' : 'Pending Admin Approval'}</Text>
        <Text style={styles.heroText}>
          {rejected
            ? studentProfile.rejectionReason || 'Please contact your institution admin for more details.'
            : 'Your enrollment form was submitted. Once your institution admin approves it, your attendance PIN and dashboard unlock automatically.'}
        </Text>
      </View>

      <Card style={styles.card}>
        <KeyValueRow label="Institution" value={institution && institution.name} />
        <KeyValueRow label="Institution code" value={institution && institution.code} />
        <KeyValueRow label="Status" value={studentProfile ? studentProfile.approvalStatus : 'pending'} />
        <KeyValueRow label="Attendance PIN" value="Issued after approval" />
      </Card>

      <AppButton
        title="Check approval status"
        icon="refresh-outline"
        loading={busy}
        onPress={() => reload().catch(() => {})}
        style={{ marginTop: spacing.lg }}
      />

      {rejected ? (
        <>
          <Text style={styles.sectionTitle}>Link a different institution</Text>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}
          <Formik initialValues={{ institutionCode: '' }} validationSchema={institutionCodeSchema} onSubmit={lookUp}>
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                <AppTextInput
                  label="New institution code"
                  icon="pricetag-outline"
                  autoCapitalize="characters"
                  maxLength={12}
                  value={values.institutionCode}
                  onChangeText={(t) => handleChange('institutionCode')(t.toUpperCase())}
                  onBlur={handleBlur('institutionCode')}
                  error={errors.institutionCode}
                  touched={touched.institutionCode}
                />
                <AppButton title="Look up" variant="outline" onPress={handleSubmit} />
              </>
            )}
          </Formik>
        </>
      ) : null}

      <AppButton title="Sign out" variant="ghost" onPress={logout} style={{ marginTop: spacing.lg }} />

      <ConfirmModal
        visible={showConfirm}
        title="Confirm new institution"
        icon="business-outline"
        confirmLabel="Change & resubmit"
        loading={busy}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmChange}
        rows={
          preview
            ? [
                { label: 'Institution', value: preview.name },
                { label: 'Tutor / Admin', value: preview.tutorName },
                { label: 'Location', value: preview.location || '—' },
              ]
            : []
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  hero: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { ...typography.h2, textAlign: 'center' },
  heroText: { ...typography.small, textAlign: 'center', marginTop: spacing.sm, lineHeight: 19 },
  card: { padding: spacing.lg },
  sectionTitle: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.md },
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

