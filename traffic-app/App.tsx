import { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"

import LoginScreen from "./screens/LoginScreen"
import HomeScreen from "./screens/HomeScreen"
import ReportIncidentScreen from "./screens/ReportIncidentScreen"
import NotificationsScreen from "./screens/NotificationsScreen"
import ProfileScreen from "./screens/ProfileScreen"
import RouteSuggestionScreen from "./screens/RouteSuggestionScreen"
import AllReportsScreen from "./screens/AllReportsScreen"

// Import services
import { notificationService } from "./services/notificationService"
import { userService } from "./services/userService"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
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
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "home-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "gray",
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

export default function App() {
  useEffect(() => {
    // Initialize services when app starts
    const initializeServices = async () => {
      try {
        await notificationService.initialize()
        await userService.initialize()

        // Start demo notifications after a delay
        setTimeout(() => {
          notificationService.simulateTrafficAlerts()
        }, 10000) // 10 seconds after app start

        console.log("Services initialized successfully")
      } catch (error) {
        console.error("Failed to initialize services:", error)
      }
    }

    initializeServices()
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="ReportIncident"
          component={ReportIncidentScreen}
          options={{
            title: "Report Incident",
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#000",
          }}
        />
        <Stack.Screen
          name="AllReports"
          component={AllReportsScreen}
          options={{
            title: "All Reports",
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#000",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
