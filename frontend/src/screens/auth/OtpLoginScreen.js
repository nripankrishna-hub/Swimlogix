import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import OtpInput from '../../components/OtpInput';
import { Card } from '../../components/primitives';
import { useAuth } from '../../contexts/AuthContext';
import { otpRequestSchema } from '../../utils/validation';
import { errorMessage } from '../../utils/errors';
import { colors, gradients, radius, spacing, typography } from '../../theme';

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

/**
 * Student / family member login.
 * Step 1: request an OTP for the mobile number.
 * Step 2: enter the OTP -> JWT pair + routing hint (handled by RootNavigator).
 */
export default function OtpLoginScreen({ navigation, route }) {
  const { initialPhone } = route?.params || {};
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState(initialPhone || '');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [autoSent, setAutoSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendOtp = useCallback(
    async (value) => {
      setError('');
      setSending(true);
      try {
        const result = await requestOtp(String(value).trim(), 'login');
        setPhone(String(value).trim());
        setDevOtp(result && result.devOtp ? result.devOtp : '');
        setStep('otp');
        setCooldown(RESEND_SECONDS);
        setOtp('');
      } catch (err) {
        setError(errorMessage(err, 'Could not send the OTP'));
      } finally {
        setSending(false);
      }
    },
    [requestOtp],
  );

  useEffect(() => {
    if (initialPhone && !autoSent) {
      setAutoSent(true);
      sendOtp(initialPhone);
    }
  }, [initialPhone, autoSent, sendOtp]);

  const submitOtp = useCallback(
    async (code) => {
      const value = code || otp;
      if (!/^\d{4,8}$/.test(value)) {
        setError('Enter the OTP sent to your mobile');
        return;
      }
      setError('');
      setVerifying(true);
      try {
        await verifyOtp(phone, value);
      } catch (err) {
        setError(errorMessage(err, 'Invalid OTP'));
        setOtp('');
      } finally {
        setVerifying(false);
      }
    },
    [otp, phone, verifyOtp],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.amber} />
          <Text style={styles.heroTitle}>{step === 'phone' ? 'Member Login' : 'Verify OTP'}</Text>
          <Text style={styles.heroSubtitle}>
            {step === 'phone' ? 'We will text you a one-time password' : `Sent to +${phone}`}
          </Text>
        </LinearGradient>

        <Card style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {step === 'phone' ? (
            <Formik initialValues={{ phone }} validationSchema={otpRequestSchema} onSubmit={(v) => sendOtp(v.phone)}>
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  <AppTextInput
                    label="Mobile number"
                    icon="call-outline"
                    placeholder="98xxxxxxxx"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    error={errors.phone}
                    touched={touched.phone}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                  />
                  <AppButton title="Send OTP" icon="paper-plane-outline" loading={sending} onPress={handleSubmit} />
                </>
              )}
            </Formik>
          ) : (
            <>
              {devOtp ? (
                <View style={styles.devBanner}>
                  <Ionicons name="construct-outline" size={15} color={colors.goldDark} />
                  <Text style={styles.devBannerText}>Dev mode OTP: {devOtp}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Enter the {OTP_LENGTH}-digit code</Text>
              <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} onComplete={submitOtp} />

              <AppButton
                title="Verify & continue"
                iconRight="arrow-forward"
                loading={verifying}
                onPress={() => submitOtp()}
                style={{ marginTop: spacing.xl }}
              />

              <View style={styles.resendRow}>
                <Pressable disabled={cooldown > 0} onPress={() => sendOtp(phone)}>
                  <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setStep('phone')}>
                  <Text style={styles.resendText}>Change number</Text>
                </Pressable>
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg },
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
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6E0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  devBannerText: { ...typography.small, color: colors.goldDark, marginLeft: spacing.sm, fontWeight: '700' },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  resendText: { ...typography.small, color: colors.accent, fontWeight: '700' },
  resendDisabled: { color: colors.textMuted },
  staffRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  helperText: { ...typography.small },
  helperLink: { ...typography.small, color: colors.accent, fontWeight: '800' },
});

