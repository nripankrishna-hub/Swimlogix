import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import ModeratorNavigator from './ModeratorNavigator';
import StudentNavigator from './StudentNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import { stackScreenOptions } from './shared';
import { colors, spacing, typography } from '../theme';

import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import InstitutionLinkScreen from '../screens/auth/InstitutionLinkScreen';
import RegistrationFormScreen from '../screens/auth/RegistrationFormScreen';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

const Stack = createNativeStackNavigator();

/** Branded splash shown while the persisted session is restored. */
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <View style={styles.logoCircle}>
        <Ionicons name="water" size={34} color={colors.primary} />
      </View>
      <Text style={styles.brand}>SwimLogix</Text>
      <Text style={styles.tagline}>Swim academy management, simplified</Text>
      <ActivityIndicator color={colors.textOnPrimary} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

/**
 * Student onboarding: link institution -> fill dynamic registration -> await approval.
 * RootNavigator swaps to StudentNavigator automatically once `nextStep` becomes student_dashboard.
 */
function StudentOnboarding({ initialRouteName }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={stackScreenOptions}>
      <Stack.Screen name="LinkInstitution" component={InstitutionLinkScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RegistrationForm" component={RegistrationFormScreen} options={{ title: 'Enrollment Form' }} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

/**
 * Single routing authority: decides which navigator renders based on role,
 * the mandatory password-change flag and the student onboarding state.
 */
export default function RootNavigator() {
  const { bootstrapping, user, nextStep } = useAuth();

  if (bootstrapping) return <SplashScreen />;
  if (!user) return <AuthNavigator />;

  // Admins/Moderators created with a temporary password must change it first.
  const mustChange = (user.role === 'admin' || user.role === 'moderator') && user.mustChangePassword && !user.isPasswordChanged;
  if (mustChange) {
    return (
      <Stack.Navigator screenOptions={{ ...stackScreenOptions, headerShown: false }}>
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} initialParams={{ forced: true }} />
      </Stack.Navigator>
    );
  }

  switch (user.role) {
    case 'superadmin':
      return <SuperAdminNavigator />;
    case 'admin':
      return <AdminNavigator />;
    case 'moderator':
      return <ModeratorNavigator />;
    case 'student':
    default: {
      if (nextStep === 'link_institution') return <StudentOnboarding initialRouteName="LinkInstitution" />;
      if (nextStep === 'complete_registration') return <StudentOnboarding initialRouteName="RegistrationForm" />;
      if (nextStep === 'pending_approval' || nextStep === 'registration_rejected') {
        return <StudentOnboarding initialRouteName="PendingApproval" />;
      }
      return <StudentNavigator />;
    }
  }
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  brand: { ...typography.h1, color: colors.textOnPrimary, fontSize: 32 },
  tagline: { ...typography.small, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
});
