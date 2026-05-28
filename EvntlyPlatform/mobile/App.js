// App.js
import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import { View } from "react-native";

import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen"; 
import ProfileScreen from "./screens/ProfileScreen"; 
import PreferencesScreen from "./screens/PreferencesScreen";
import EventsScreen from './screens/EventsScreen';
import EventDetailsScreen from './screens/EventDetailsScreen';
import SavedEventsScreen from './screens/SavedEventsScreen';
import LocationScreen from "./screens/LocationScreen";
import AccessibilityFiltersScreen from "./screens/AccessibilityFiltersScreen";
import SavedEventsCalendarScreen from "./screens/SavedEventsCalendarScreen";
import ReviewsScreen from './screens/ReviewsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const BLUE = "#0492c2";

// Screens that need bottom tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70,
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 10,
        },
        tabBarActiveTintColor: BLUE,
        tabBarInactiveTintColor: "#999",
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Events" 
        component={EventsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={30} />,
        }}
      />
      <Tab.Screen 
        name="ForYou" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={29} />,
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={SavedEventsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" color={color} size={30} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={30} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ animation: "none" }}>
          {/* Auth screens */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AccessibilityFilters" component={AccessibilityFiltersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Location" component={LocationScreen} options={{ headerShown: false }} />

          {/* Main app with bottom tabs */}
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

          {/* Screens that push on top (no bottom bar) */}
          <Stack.Screen
            name="EventDetails"
            component={EventDetailsScreen}
            options={({ navigation }) => ({
              title: "Event Details",
              headerShown: true,
              headerBackTitleVisible: false,
              headerTintColor: BLUE,
              headerStyle: { backgroundColor: "#fff" },
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
                  <Ionicons name="arrow-back" size={24} color={BLUE} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="SavedEventsCalendar" component={SavedEventsCalendarScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ReviewsScreen" component={ReviewsScreen} options={{ headerShown: false }} /> 
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}