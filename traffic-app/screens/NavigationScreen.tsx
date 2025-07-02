"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocation } from "../hooks/useLocation"
import { useTheme } from "../contexts/ThemeContext"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"

const { width, height } = Dimensions.get('window')

interface NavigationScreenProps {
  navigation: any
  route: {
    params: {
      selectedRoute: {
        id: string
        name: string
        duration: string
        distance: string
        description: string
        traffic: string
        incidents: number
        coordinates?: Array<{ latitude: number; longitude: number }>
        destination: { latitude: number; longitude: number }
      }
    }
  }
}

export default function NavigationScreen({ navigation, route }: NavigationScreenProps) {
  const { theme } = useTheme()
  const { location } = useLocation()
  const mapRef = useRef<MapView>(null)
  
  const { selectedRoute } = route.params
  
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [remainingDistance, setRemainingDistance] = useState(selectedRoute.distance)
  const [remainingTime, setRemainingTime] = useState(selectedRoute.duration)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [showTrafficLayer, setShowTrafficLayer] = useState(true)

  // Mock navigation steps for demonstration
  const navigationSteps = [
    { instruction: "Head north on Current Street", distance: "0.2 km", icon: "arrow-up" },
    { instruction: "Turn right onto Main Avenue", distance: "1.5 km", icon: "arrow-forward" },
    { instruction: "Continue straight for 2.3 km", distance: "2.3 km", icon: "arrow-up" },
    { instruction: "Turn left onto " + selectedRoute.description.replace("Via ", ""), distance: "3.1 km", icon: "arrow-back" },
    { instruction: "Arrive at destination", distance: "0.1 km", icon: "flag" },
  ]

  // Generate route coordinates (mock data for demonstration)
  const generateRouteCoordinates = () => {
    if (!location) return []
    
    const start = { latitude: location.latitude, longitude: location.longitude }
    const end = selectedRoute.destination
    
    // Generate intermediate points for a realistic route
    const points = [start]
    const steps = 8
    
    for (let i = 1; i < steps; i++) {
      const lat = start.latitude + (end.latitude - start.latitude) * (i / steps) + (Math.random() - 0.5) * 0.01
      const lng = start.longitude + (end.longitude - start.longitude) * (i / steps) + (Math.random() - 0.5) * 0.01
      points.push({ latitude: lat, longitude: lng })
    }
    
    points.push(end)
    return points
  }

  const routeCoordinates = selectedRoute.coordinates || generateRouteCoordinates()

  useEffect(() => {
    // Fit map to show the entire route
    if (mapRef.current && routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      })
    }
  }, [routeCoordinates])

  const handleStartNavigation = () => {
    setIsNavigating(true)
    Alert.alert("Navigation Started", "Turn-by-turn directions will guide you to your destination.")
  }

  const handleStopNavigation = () => {
    setIsNavigating(false)
    Alert.alert("Navigation Stopped", "You can resume navigation anytime.")
  }

  const handleExitNavigation = () => {
    Alert.alert(
      "Exit Navigation",
      "Are you sure you want to exit navigation?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: () => navigation.goBack() }
      ]
    )
  }

  const centerOnLocation = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000)
    }
  }

  const getTrafficColor = () => {
    switch (selectedRoute.traffic) {
      case "Light traffic": return "#4CAF50"
      case "Moderate traffic": return "#ff9800"
      case "Heavy traffic": return "#f44336"
      default: return "#2196F3"
    }
  }

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="location" size={48} color="#2196F3" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={showTrafficLayer}
        followsUserLocation={isNavigating}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={getTrafficColor()}
            strokeWidth={6}
            lineDashPattern={[1]}
          />
        )}
        
        {/* Destination Marker */}
        <Marker
          coordinate={selectedRoute.destination}
          title="Destination"
          description={selectedRoute.name}
        >
          <View style={styles.destinationMarker}>
            <Ionicons name="flag" size={20} color="#fff" />
          </View>
        </Marker>
      </MapView>

      {/* Top Controls */}
      <View style={[styles.topControls, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.controlButton} onPress={handleExitNavigation}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.routeInfo}>
          <Text style={[styles.routeName, { color: theme.colors.text }]}>{selectedRoute.name}</Text>
          <Text style={[styles.routeDescription, { color: theme.colors.textSecondary }]}>
            {selectedRoute.description}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setShowTrafficLayer(!showTrafficLayer)}
        >
          <Ionicons 
            name={showTrafficLayer ? "car" : "car-outline"} 
            size={24} 
            color={showTrafficLayer ? "#ff9800" : theme.colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Navigation Info Panel */}
      <View style={[styles.navigationPanel, { backgroundColor: theme.colors.surface }]}>
        {/* Current Step */}
        {isNavigating && (
          <View style={styles.currentStep}>
            <View style={styles.stepIcon}>
              <Ionicons name={navigationSteps[currentStep]?.icon as any} size={24} color="#2196F3" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepInstruction, { color: theme.colors.text }]}>
                {navigationSteps[currentStep]?.instruction}
              </Text>
              <Text style={[styles.stepDistance, { color: theme.colors.textSecondary }]}>
                in {navigationSteps[currentStep]?.distance}
              </Text>
            </View>
          </View>
        )}

        {/* Route Stats */}
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{remainingTime}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>ETA</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{remainingDistance}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getTrafficColor() }]}>{selectedRoute.traffic}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Traffic</Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={centerOnLocation}>
            <Ionicons name="locate" size={20} color={theme.colors.text} />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Center</Text>
          </TouchableOpacity>
          
          {!isNavigating ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartNavigation}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={handleStopNavigation}>
              <Ionicons name="pause" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  topControls: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  routeInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  routeDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  navigationPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  currentStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDistance: {
    fontSize: 14,
  },
  routeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  controlButtons: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 8,
  },
  primaryButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    gap: 8,
  },
  stopButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f44336",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  destinationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
  },
})