import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ModeratorDashboardScreen from '../screens/moderator/ModeratorDashboardScreen';
import AttendanceScreen from '../screens/moderator/AttendanceScreen';
import SwimTestScreen from '../screens/moderator/SwimTestScreen';
import StudentsScreen from '../screens/moderator/StudentsScreen';
import ProgressScreen from '../screens/moderator/ProgressScreen';
import AnnouncementsScreen from '../screens/moderator/AnnouncementsScreen';
import { tabBarScreenOptions, tabIcon, stackScreenOptions } from './shared';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ModeratorTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarScreenOptions}>
      <Tab.Screen
        name="Home"
        component={ModeratorDashboardScreen}
        options={{ tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ tabBarIcon: tabIcon('checkmark-done-outline', 'checkmark-done') }}
      />
      <Tab.Screen
        name="SwimTests"
        component={SwimTestScreen}
        options={{ title: 'Swim Tests', tabBarIcon: tabIcon('stopwatch-outline', 'stopwatch') }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{ tabBarIcon: tabIcon('people-outline', 'people') }}
      />
      <Tab.Screen
        name="Announce"
        component={AnnouncementsScreen}
        options={{ tabBarIcon: tabIcon('megaphone-outline', 'megaphone') }}
      />
    </Tab.Navigator>
  );
}

/** Operations portal: attendance, swim testing, progress notes and announcements. */
export default function ModeratorNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ModeratorTabs" component={ModeratorTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProgressDetail" component={ProgressScreen} options={{ title: 'Student Progress' }} />
    </Stack.Navigator>
  );
}
