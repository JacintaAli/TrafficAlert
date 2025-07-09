"use client"

import { useEffect } from "react"
import { View } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator, StackNavigationProp } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"

// Define navigation types
type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email: string };
  ResetPassword: { email: string; otp: string };
  Main: undefined;
  MainTabs: undefined;
  EditProfile: undefined;
  About: undefined;
  HelpSupport: undefined;
  ChangePassword: undefined;
  ReportIncident: undefined;
  AllReports: undefined;
  Navigation: {
    selectedRoute: {
      id: string;
      name: string;
      duration: string;
      distance: string;
      description: string;
      traffic: string;
      incidents: number;
      coordinates?: Array<{ latitude: number; longitude: number }>;
      destination: { latitude: number; longitude: number };
    };
  };
  ReportDetails: { reportId: string };
  MyReports: undefined;
};

import OnboardingScreen from "./screens/OnboardingScreen"
import LoginScreen from "./screens/LoginScreen"
import SignUpScreen from "./screens/SignUpScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"
import OTPVerificationScreen from "./screens/OTPVerificationScreen"
import ResetPasswordScreen from "./screens/ResetPasswordScreen"
import ChangePasswordScreen from "./screens/ChangePasswordScreen"
import HomeScreen from "./screens/HomeScreen"
import ReportIncidentScreen from "./screens/ReportIncidentScreen"
import NotificationsScreen from "./screens/NotificationsScreen"
import ProfileScreen from "./screens/ProfileScreen"
import EditProfileScreen from "./screens/EditProfileScreen"
import AboutScreen from "./screens/AboutScreen"
import HelpSupportScreen from "./screens/HelpSupportScreen"
import RouteSuggestionScreen from "./screens/RouteSuggestionScreen"
import NavigationScreen from "./screens/NavigationScreen"
import AllReportsScreen from "./screens/AllReportsScreen"
import ReportDetailsScreen from "./screens/ReportDetailsScreen"
import MyReportsScreen from "./screens/MyReportsScreen"
import UserAvatar, { UserAvatarSizes } from "./components/UserAvatar"

// Import services
import { notificationService } from "./services/notificationService"
import { userService } from "./services/userService"

// Import theme context
import { ThemeProvider, useTheme } from "./contexts/ThemeContext"

// Import components and hooks
import NotificationBadge from "./components/NotificationBadge"
import { useNotificationBadge } from "./hooks/useNotificationBadge"

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function MainTabs() {
  const { theme } = useTheme()
  const { count, highestSeverity, hasUnread } = useNotificationBadge()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Routes") {
            iconName = focused ? "map" : "map-outline"
          } else if (route.name === "Alerts") {
            iconName = focused ? "notifications" : "notifications-outline"
          } else if (route.name === "Profile") {
            // Use UserAvatar for Profile tab
            return (
              <UserAvatar
                size={size}
                backgroundColor={focused ? color : theme.colors.surface}
                iconColor={focused ? "#fff" : color}
                showBorder={focused}
                borderColor={color}
              />
            )
          } else {
            iconName = "home-outline"
          }

          // Add notification badge for Alerts tab
          if (route.name === "Alerts" && hasUnread) {
            return (
              <View style={{ position: 'relative' }}>
                <Ionicons name={iconName} size={size} color={color} />
                <NotificationBadge
                  count={count}
                  severity={highestSeverity}
                  size="small"
                  position="top-right"
                />
              </View>
            )
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Routes" component={RouteSuggestionScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function ThemedNavigator() {
  const { theme } = useTheme()

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="ReportIncident"
          component={ReportIncidentScreen}
          options={{
            title: "Report Incident",
            headerStyle: { backgroundColor: theme.colors.card },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { color: theme.colors.text },
          }}
        />
        <Stack.Screen
          name="AllReports"
          component={AllReportsScreen}
          options={{
            title: "All Reports",
            headerStyle: { backgroundColor: theme.colors.card },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { color: theme.colors.text },
          }}
        />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Navigation" component={NavigationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  useEffect(() => {
    // Initialize services when app starts
    const initializeServices = async () => {
      try {
        await notificationService.initialize()
        await userService.initialize()



        console.log("Services initialized successfully")
      } catch (error) {
        console.error("Failed to initialize services:", error)
      }
    }

    initializeServices()
  }, [])

  return (
    <ThemeProvider>
      <ThemedNavigator />
    </ThemeProvider>
  )
}
