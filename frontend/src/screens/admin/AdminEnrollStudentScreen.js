import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import { Picker } from '@react-native-picker/picker';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card, SectionHeader } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import ConfirmModal from '../../components/ConfirmModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminApi } from '../../api/endpoints';
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

function DynamicField({ field, formik }) {
  const { values, errors, touched, setFieldValue, handleChange, handleBlur } = formik;
  const label = field.label + (field.required ? ' *' : '');
  const value = values[field.key];
  const error = errors[field.key];
  const isTouched = touched[field.key];
  const icon = ICONS[field.type] || ICONS.text;
  const [showPicker, setShowPicker] = useState(false);

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

  if (field.type === 'date') {
    if (Platform.OS === 'web') {
      return (
        <AppTextInput
          label={label}
          icon={icon}
          placeholder="DD-MM-YYYY"
          value={value || ''}
          onChangeText={(val) => {
            // Remove non-numeric characters and format as DD-MM-YYYY
            let cleaned = val.replace(/\D/g, '');
            if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
            if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 9);
            setFieldValue(field.key, cleaned);
          }}
          onBlur={handleBlur(field.key)}
          error={error}
          touched={isTouched}
          maxLength={10}
          keyboardType="number-pad"
        />
      );
    }

    let dateObj = new Date();
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return (
      <>
        <Pressable onPress={() => setShowPicker(true)}>
          <View pointerEvents="none">
            <AppTextInput
              label={label}
              icon={icon}
              placeholder="DD-MM-YYYY"
              value={value || ''}
              error={error}
              touched={isTouched}
            />
          </View>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) {
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const year = selectedDate.getFullYear();
                setFieldValue(field.key, `${day}-${month}-${year}`);
              }
            }}
          />
        )}
      </>
    );
  }

  const keyboardType =
    field.type === 'number' ? 'number-pad' : field.type === 'phone' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default';

  return (
    <AppTextInput
      label={label}
      icon={icon}
      placeholder={field.placeholder || ''}
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

export default function AdminEnrollStudentScreen({ navigation }) {
  const { data, loading, error, run } = useAsync(async () => {
    const [fieldsRes, batchesRes] = await Promise.all([
      adminApi.getRegistrationFields(),
      adminApi.listBatches({ limit: 100 })
    ]);
    return { fields: fieldsRes.registrationFields || [], batches: batchesRes.items || [] };
  }, []);
  const [submitError, setSubmitError] = useState('');
  const [successModal, setSuccessModal] = useState(null);

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
  const batches = (data && data.batches) || [];
  
  // phone and studentName are required for the student account
  const initialValues = fields.reduce((acc, f) => {
    acc[f.key] = f.type === 'boolean' ? false : '';
    return acc;
  }, { parentPhone: '', studentName: '', batchId: '' });

  const validate = (values) => {
    const errs = {};
    
    if (!values.studentName) errs.studentName = 'Student name is required';
    if (!values.parentPhone) errs.parentPhone = 'Parent phone number is required';
    else if (!/^[+]?[\d\s-]{10,17}$/.test(values.parentPhone)) errs.parentPhone = 'Enter a valid number';

    fields.forEach((f) => {
      const v = values[f.key];
      const empty = v === undefined || v === null || v === '' || v === false;
      if (f.required && empty) errs[f.key] = `${f.label} is required`;
      if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) errs[f.key] = 'Enter a valid email';
      if (f.type === 'phone' && v && !/^[+]?[\d\s-]{10,17}$/.test(v)) errs[f.key] = 'Enter a valid number';
      if (f.type === 'date' && v) {
        const parts = v.split('-');
        if (parts.length !== 3 || parts[2].length !== 4) errs[f.key] = 'Format must be DD-MM-YYYY';
        else {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);
          const date = new Date(y, m - 1, d);
          if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d || y < 1900 || y > 2100) {
            errs[f.key] = 'Enter a valid date';
          }
        }
      }
      if (f.key.toLowerCase().includes('pincode') && v) {
        if (!/^\d{6}$/.test(String(v))) errs[f.key] = 'Pincode must be exactly 6 digits';
      }
    });
    return errs;
  };

  const handleSubmit = async (values, helpers) => {
    setSubmitError('');
    try {
      // Separate phone and batchId from dynamic fields
      const { parentPhone, batchId, studentName, ...registrationData } = values;
      // Inject studentName into registrationData so backend finds it
      const res = await adminApi.enrollStudent({ 
        phone: parentPhone, 
        batchId: batchId || undefined, 
        registrationData: { ...registrationData, student_name: studentName } 
      });
      
      setSuccessModal({
        pin: res.assignedPin,
        onClose: () => {
          setSuccessModal(null);
          helpers.resetForm();
        }
      });
    } catch (err) {
      setSubmitError(errorMessage(err, 'Could not enroll student'));
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        {submitError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
          {(formik) => (
            <>
              <SectionHeader title="Account Details" subtitle="Used by parent to log in" icon="person-outline" />
              
              <AppTextInput
                label="Student Name *"
                icon="person-outline"
                placeholder="Enter student's full name"
                value={formik.values.studentName}
                onChangeText={formik.handleChange('studentName')}
                onBlur={formik.handleBlur('studentName')}
                error={formik.errors.studentName}
                touched={formik.touched.studentName}
              />
              
              <View style={{ marginTop: spacing.md }} />
              
              <AppTextInput
                label="Parent Phone Number *"
                icon="call-outline"
                placeholder="+91..."
                keyboardType="phone-pad"
                value={formik.values.parentPhone}
                onChangeText={formik.handleChange('parentPhone')}
                onBlur={formik.handleBlur('parentPhone')}
                error={formik.errors.parentPhone}
                touched={formik.touched.parentPhone}
              />
              
              <View style={{ marginTop: spacing.lg }} />
              <SectionHeader title="Student Details" subtitle="Dynamic form fields" icon="document-text-outline" />
              {fields.map((field) => (
                <DynamicField key={field.key} field={field} formik={formik} />
              ))}
              
              <View style={{ marginTop: spacing.lg }} />
              <SectionHeader title="Batch Assignment" subtitle="Optional" icon="people-outline" />
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formik.values.batchId}
                  onValueChange={formik.handleChange('batchId')}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a batch..." value="" color={colors.textMuted} />
                  {batches.map(b => (
                    <Picker.Item key={b._id} label={`${b.name} (${b.level})`} value={b._id} color={colors.text} />
                  ))}
                </Picker>
              </View>

              {formik.values.batchId ? (() => {
                const b = batches.find(bx => bx._id === formik.values.batchId);
                if (!b) return null;
                return (
                  <View style={styles.feeBanner}>
                    <Ionicons name="cash-outline" size={16} color={colors.primary} />
                    <Text style={styles.feeBannerText}>
                      {b.isFree ? 'This is a Free Batch' : `Monthly Fee: ₹${b.feeAmount || 0}`}
                    </Text>
                  </View>
                );
              })() : null}

              <AppButton
                title="Enroll & Approve"
                icon="checkmark-circle-outline"
                loading={formik.isSubmitting}
                onPress={formik.handleSubmit}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </Formik>
      </Card>
    </ScrollView>
    <ConfirmModal
      visible={!!successModal}
      title="Student Enrolled"
      message="The student has been enrolled and approved successfully."
      rows={successModal ? [{ label: 'Assigned PIN', value: successModal.pin }] : []}
      icon="checkmark-circle-outline"
      tone="success"
      confirmLabel="Done"
      cancelLabel=""
      onConfirm={() => successModal?.onClose()}
    />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
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
  pickerContainer: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  picker: { height: 50, width: '100%' },
  feeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0F3',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  feeBannerText: { ...typography.small, color: colors.primary, marginLeft: spacing.sm, fontWeight: '600' },
});
