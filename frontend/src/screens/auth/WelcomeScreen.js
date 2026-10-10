import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { Card } from '../../components/primitives';
import { colors, gradients, radius, spacing, typography } from '../../theme';
import { authApi } from '../../api/endpoints';

/** Entry screen: single login field for phone number. Routes to OTP or Password depending on role. */
export default function WelcomeScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.checkPhone(phone);
      // Ensure we navigate correctly based on the payload structure
      const { isRegistered, authMethod } = response;

      if (authMethod === 'password') {
        navigation.navigate('PasswordLogin', { initialPhone: phone });
      } else {
        // 'otp' or default for non-registered
        navigation.navigate('OtpLogin', { initialPhone: phone });
      }
    } catch (error) {
      const msg = error.message || 'Failed to check phone number. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <SafeAreaView edges={['top']} style={styles.heroInner}>
          <Image
            source={require('../../../assets/swimmer.png')}
            style={styles.swimmerLogo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>SwimLogix</Text>
          <Text style={styles.tagline}>One platform for your entire swim academy</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
          </View>
          <Text style={styles.cardText}>
            Enter your mobile number to sign in or create a new account.
          </Text>

          <AppTextInput
            label="Mobile Number"
            placeholder="e.g.98xxxxxxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
            maxLength={15}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <AppButton
                title="Continue"
                onPress={handleContinue}
              />
            )}
          </View>
        </Card>

        <Text style={styles.footer}> Secure Multi-tier platform · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { paddingBottom: spacing.xxl + spacing.lg, borderBottomLeftRadius: radius.xl * 1.6, borderBottomRightRadius: radius.xl * 1.6 },
  heroInner: { alignItems: 'center', paddingTop: spacing.xs },
  swimmerLogo: {
    width: 280,
    height: 180,
    marginBottom: -60,
  },
  brand: { ...typography.h1, color: colors.textOnPrimary, fontSize: 30 },
  tagline: { ...typography.small, color: 'rgba(255,255,255,0.82)', marginTop: spacing.xs, textAlign: 'center' },
  body: { padding: spacing.lg, paddingTop: spacing.xl },
  card: { marginBottom: spacing.lg, paddingBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { ...typography.h3, marginLeft: spacing.sm },
  cardText: { ...typography.bodyMuted, lineHeight: 21, marginBottom: spacing.lg },
  buttonContainer: { marginTop: spacing.md, height: 50, justifyContent: 'center' },
  footer: { ...typography.small, textAlign: 'center', marginTop: spacing.lg },
});
