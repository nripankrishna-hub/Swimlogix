import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import OtpLoginScreen from '../screens/auth/OtpLoginScreen';
import PasswordLoginScreen from '../screens/auth/PasswordLoginScreen';
import { stackScreenOptions } from './shared';

const Stack = createNativeStackNavigator();

/** Signed-out journey: role chooser -> OTP (student) or password (staff). */
export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ ...stackScreenOptions, headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="PasswordLogin"
        component={PasswordLoginScreen}
        options={{ headerShown: true, title: 'Staff Login' }}
      />
      <Stack.Screen name="OtpLogin" component={OtpLoginScreen} options={{ headerShown: true, title: 'Member Login' }} />
    </Stack.Navigator>
  );
}
