import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card, SectionHeader } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { useAuth } from '../../contexts/AuthContext';
import { studentApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { colors, radius, spacing, typography } from '../../theme';

const ICONS = {
  text: 'create-outline',
  textarea: 'document-text-outline',
  number: 'calculator-outline',
  email: 'mail-outline',
  phone: 'call-outline',
  date: 'calendar-outline',
  select: 'list-outline',
  boolean: 'checkbox-outline',
};

/** Render one admin-configured field using the matching control. */
function DynamicField({ field, formik }) {
  const { values, errors, touched, setFieldValue, handleChange, handleBlur } = formik;
  const label = field.label + (field.required ? ' *' : '');
  const value = values[field.key];
  const error = errors[field.key];
  const isTouched = touched[field.key];
  const icon = ICONS[field.type] || ICONS.text;

  if (field.type === 'boolean') {
    return (
      <Pressable
        style={[styles.toggleRow, value ? styles.toggleRowActive : null]}
        onPress={() => setFieldValue(field.key, !value)}
      >
        <Ionicons
          name={value ? 'checkbox' : 'square-outline'}
          size={20}
          color={value ? colors.success : colors.textMuted}
        />
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>{label}</Text>
          {field.placeholder ? <Text style={styles.toggleHint}>{field.placeholder}</Text> : null}
        </View>
      </Pressable>
    );
  }

  if (field.type === 'select') {
    return (
      <View style={styles.selectWrap}>
        <Text style={styles.selectLabel}>{label}</Text>
        <View style={styles.chipRow}>
          {(field.options || []).map((option) => {
            const active = String(value) === String(option);
            return (
              <Pressable
                key={option}
                onPress={() => setFieldValue(field.key, option)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
        {error && isTouched ? <Text style={styles.chipError}>{error}</Text> : null}
      </View>
    );
  }

  const keyboardType =
    field.type === 'number' ? 'number-pad' : field.type === 'phone' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default';

  return (
    <AppTextInput
      label={label}
      icon={icon}
      placeholder={field.placeholder || (field.type === 'date' ? 'YYYY-MM-DD' : '')}
      keyboardType={keyboardType}
      multiline={field.type === 'textarea'}
      value={value === undefined || value === null ? '' : String(value)}
      onChangeText={handleChange(field.key)}
      onBlur={handleBlur(field.key)}
      error={error}
      touched={isTouched}
    />
  );
}

/**
 * Dynamic enrollment form configured by the institution admin.
 * Submitting moves the profile to `pending` and hands control to the approval screen.
 */
export default function RegistrationFormScreen() {
  const { reload } = useAuth();
  const { data, loading, error, run } = useAsync(() => studentApi.getRegistrationForm(), []);
  const [submitError, setSubmitError] = useState('');

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} onRetry={() => run().catch(() => {})} />;
  }

  const fields = (data && data.fields) || [];
  const institution = (data && data.institution) || {};
  const initialValues = fields.reduce((acc, f) => {
    const existing = data && data.values ? data.values[f.key] : undefined;
    acc[f.key] = existing !== undefined ? existing : f.type === 'boolean' ? false : '';
    return acc;
  }, {});

  const validate = (values) => {
    const errs = {};
    fields.forEach((f) => {
      const v = values[f.key];
      const empty = v === undefined || v === null || v === '' || v === false;
      if (f.required && empty) errs[f.key] = `${f.label} is required`;
      if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) errs[f.key] = 'Enter a valid email';
      if (f.type === 'phone' && v && !/^[+]?[\d\s-]{10,17}$/.test(v)) errs[f.key] = 'Enter a valid number';
    });
    return errs;
  };

  const handleSubmit = async (values, helpers) => {
    setSubmitError('');
    try {
      const nameField = fields.find((f) => ['fullname', 'name'].includes(String(f.key).toLowerCase()));
      await studentApi.submitRegistration(values, nameField ? values[nameField.key] : undefined);
      await reload(); // RootNavigator switches to the approval screen
    } catch (err) {
      setSubmitError(errorMessage(err, 'Could not submit the registration'));
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>STEP 2 OF 2 · ENROLLMENT</Text>
        </View>
        <Text style={styles.title}>{institution.name}</Text>
        <Text style={styles.subtitle}>
          Fill in the details below. Your institution admin reviews the registration and assigns your attendance PIN.
        </Text>
      </View>

      <Card style={styles.card}>
        {submitError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        {fields.length === 0 ? (
          <View style={styles.emptyFields}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.emptyFieldsText}>
              Your institution has not configured the enrollment form yet. Please try again later.
            </Text>
          </View>
        ) : (
          <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
            {(formik) => (
              <>
                <SectionHeader title="Member details" icon="person-outline" />
                {fields.map((field) => (
                  <DynamicField key={field.key} field={field} formik={formik} />
                ))}
                <AppButton
                  title="Submit for approval"
                  icon="paper-plane-outline"
                  loading={formik.isSubmitting}
                  onPress={formik.handleSubmit}
                  style={{ marginTop: spacing.md }}
                />
              </>
            )}
          </Formik>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  header: { paddingVertical: spacing.lg },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F0F3',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.sm,
  },
  stepText: { ...typography.caption, color: colors.primary },
  title: { ...typography.h2 },
  subtitle: { ...typography.small, marginTop: spacing.sm, lineHeight: 19 },
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleRowActive: { borderColor: colors.success, backgroundColor: '#F3FBF6' },
  toggleTextWrap: { marginLeft: spacing.md, flex: 1 },
  toggleLabel: { ...typography.body },
  toggleHint: { ...typography.small, marginTop: 2 },
  selectWrap: { marginBottom: spacing.lg },
  selectLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.small, fontWeight: '700' },
  chipTextActive: { color: colors.textOnPrimary },
  chipError: { ...typography.small, color: colors.danger },
  emptyFields: { flexDirection: 'row', alignItems: 'center' },
  emptyFieldsText: { ...typography.small, flex: 1, marginLeft: spacing.sm, lineHeight: 18 },
});


