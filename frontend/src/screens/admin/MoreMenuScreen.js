import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import AppButton from '../../components/AppButton';
import { Card, KeyValueRow } from '../../components/primitives';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, typography } from '../../theme';
export default function MoreMenuScreen({ navigation }) {
  const { user, institution, logout } = useAuth();
  return (
    <Screen scroll>
      <Text style={styles.title}>More</Text>
      <Card><KeyValueRow label="Signed in as" value={user?.name} /><KeyValueRow label="Role" value={user?.role} /><KeyValueRow label="Institution" value={institution?.name} /></Card>
      <View style={{height:spacing.md}} />
      <AppButton title="Institution profile" variant="outline" onPress={()=>navigation.navigate('InstitutionProfile')} />
      <View style={{height:spacing.sm}} />
      <AppButton title="Enrollment form" variant="outline" onPress={()=>navigation.navigate('RegistrationFields')} />
      <View style={{height:spacing.sm}} />
      <AppButton title="Communication hub" variant="outline" onPress={()=>navigation.navigate('Communication')} />
      <AppButton title="Monitoring" variant="outline" onPress={()=>navigation.navigate('Monitoring')} />
      <View style={{height:spacing.sm}} />
      <AppButton title="Moderators" variant="outline" onPress={()=>navigation.navigate('Moderators')} />
      <View style={{height:spacing.sm}} />
      <AppButton title="Sign out" variant="danger" onPress={logout} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title:{...typography.h2,marginBottom:spacing.md} });
