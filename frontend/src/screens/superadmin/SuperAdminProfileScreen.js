import React from 'react';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card, KeyValueRow } from '../../components/primitives';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme';
export default function SuperAdminProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <Screen scroll>
      <Text style={styles.title}>Developer portal</Text>
      <Card><KeyValueRow label="Name" value={user?.name} /><KeyValueRow label="Phone" value={user?.phone} /><KeyValueRow label="Role" value={user?.role} /></Card>
      <View style={{height:spacing.lg}} />
      <AppButton title="Sign out" variant="danger" onPress={logout} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md} });
