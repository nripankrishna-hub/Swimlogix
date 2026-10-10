import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import StudentsApprovalScreen from '../screens/admin/StudentsApprovalScreen';
import BatchesScreen from '../screens/admin/BatchesScreen';
import ModeratorsScreen from '../screens/admin/ModeratorsScreen';
import StudentsScreen from '../screens/admin/StudentsScreen';
import MoreMenuScreen from '../screens/admin/MoreMenuScreen';
import InstitutionProfileScreen from '../screens/admin/InstitutionProfileScreen';
import RegistrationFieldsScreen from '../screens/admin/RegistrationFieldsScreen';
import AdminEnrollStudentScreen from '../screens/admin/AdminEnrollStudentScreen';
import CommunicationScreen from '../screens/admin/CommunicationScreen';
import MonitoringScreen from '../screens/admin/MonitoringScreen';
import AttendanceScreen from '../screens/moderator/AttendanceScreen';
import BatchFormScreen from '../screens/admin/BatchFormScreen';
import BatchDetailScreen from '../screens/admin/BatchDetailScreen';
import StudentDetailScreen from '../screens/admin/StudentDetailScreen';
import { tabBarScreenOptions, tabIcon, stackScreenOptions } from './shared';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ tabBarIcon: tabIcon('speedometer-outline', 'speedometer') }}
      />
      <Tab.Screen
        name="Approvals"
        component={StudentsApprovalScreen}
        options={{ tabBarIcon: tabIcon('person-add-outline', 'person-add') }}
      />
      <Tab.Screen
        name="Batches"
        component={BatchesScreen}
        options={{ tabBarIcon: tabIcon('albums-outline', 'albums') }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{ tabBarIcon: tabIcon('people-outline', 'people') }}
      />
      <Tab.Screen name="More" component={MoreMenuScreen} options={{ tabBarIcon: tabIcon('menu-outline', 'menu') }} />
    </Tab.Navigator>
  );
}

/** Institution portal: tabs + stacked detail/setup screens. */
export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="InstitutionProfile"
        component={InstitutionProfileScreen}
        options={{ title: 'Institution Profile' }}
      />
      <Stack.Screen
        name="RegistrationFields"
        component={RegistrationFieldsScreen}
        options={{ title: 'Enrollment Form' }}
      />
      <Stack.Screen
        name="AdminEnrollStudent"
        component={AdminEnrollStudentScreen}
        options={{ title: 'Enroll a Student' }}
      />
      <Stack.Screen name="Communication" component={CommunicationScreen} options={{ title: 'Communication Hub' }} />
      <Stack.Screen name="Monitoring" component={MonitoringScreen} options={{ title: 'Monitoring' }} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
      <Stack.Screen name="BatchForm" component={BatchFormScreen} options={{ title: 'Batch' }} />
      <Stack.Screen name="BatchDetail" component={BatchDetailScreen} options={{ title: 'Batch Detail' }} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} options={{ title: 'Member Profile' }} />
      <Stack.Screen name="Moderators" component={ModeratorsScreen} options={{ title: 'Moderators' }} />
    </Stack.Navigator>
  );
}
