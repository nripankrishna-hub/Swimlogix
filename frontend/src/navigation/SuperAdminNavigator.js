import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SuperAdminDashboardScreen from '../screens/superadmin/SuperAdminDashboardScreen';
import InstitutionsScreen from '../screens/superadmin/InstitutionsScreen';
import CreateInstitutionScreen from '../screens/superadmin/CreateInstitutionScreen';
import InstitutionDetailScreen from '../screens/superadmin/InstitutionDetailScreen';
import SuperAdminProfileScreen from '../screens/superadmin/SuperAdminProfileScreen';
import { tabBarScreenOptions, tabIcon, stackScreenOptions } from './shared';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SuperAdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarScreenOptions}>
      <Tab.Screen
        name="Overview"
        component={SuperAdminDashboardScreen}
        options={{ tabBarIcon: tabIcon('grid-outline', 'grid') }}
      />
      <Tab.Screen
        name="Institutions"
        component={InstitutionsScreen}
        options={{ tabBarIcon: tabIcon('business-outline', 'business') }}
      />
      <Tab.Screen
        name="Account"
        component={SuperAdminProfileScreen}
        options={{ tabBarIcon: tabIcon('settings-outline', 'settings') }}
      />
    </Tab.Navigator>
  );
}

/** Developer portal: platform KPIs and institution/licence management. */
export default function SuperAdminNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="CreateInstitution" component={CreateInstitutionScreen} options={{ title: 'Register Institution' }} />
      <Stack.Screen name="InstitutionDetail" component={InstitutionDetailScreen} options={{ title: 'Institution' }} />
    </Stack.Navigator>
  );
}
