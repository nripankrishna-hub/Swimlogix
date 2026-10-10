import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import ProgressScreen from '../screens/student/ProgressScreen';
import FeesScreen from '../screens/student/FeesScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import ScheduleScreen from '../screens/student/ScheduleScreen';
import { tabBarScreenOptions, tabIcon, stackScreenOptions } from './shared';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarScreenOptions}>
      <Tab.Screen name="Home" component={StudentDashboardScreen} options={{ tabBarIcon: tabIcon('water-outline', 'water') }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarIcon: tabIcon('stats-chart-outline', 'stats-chart') }} />
      <Tab.Screen name="Fees" component={FeesScreen} options={{ tabBarIcon: tabIcon('card-outline', 'card') }} />
      <Tab.Screen name="Inbox" component={NotificationsScreen} options={{ tabBarIcon: tabIcon('notifications-outline', 'notifications') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }} />
    </Tab.Navigator>
  );
}

/** Member portal: PIN card, progress, fees, inbox, profile & schedule. */
export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Class Schedule' }} />
    </Stack.Navigator>
  );
}
