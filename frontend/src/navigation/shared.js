import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

/** Shared bottom-tab styling for every role portal. */
export const tabBarScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  tabBarStyle: {
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  tabBarHideOnKeyboard: true,
};

/** Factory for a tab bar icon renderer bound to a specific Ionicon. */
export const tabIcon = (name, activeName) => ({ color, size, focused }) => (
  <Ionicons name={focused && activeName ? activeName : name} size={size + 1} color={color} />
);

/** Consistent header styling for stack screens. */
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.textOnPrimary,
  headerTitleStyle: { fontWeight: '800', fontSize: 17 },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};
