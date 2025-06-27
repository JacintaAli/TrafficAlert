"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocation } from "../hooks/useLocation"
import * as Location from "expo-location"
import { routeService, Route } from "../services/routeService"
import { useTheme } from "../contexts/ThemeContext"

interface RouteSuggestionScreenProps {
  navigation: any
}

const dummyRoutes = [
  {
    id: "1",
    name: "Fastest Route",
    duration: "25 min",
    distance: "12.5 km",
    description: "Via Ahmadu Bello Way",
    traffic: "Light traffic",
    incidents: 0,
  },
  {
    id: "2",
    name: "Safest Route",
    duration: "32 min",
    distance: "15.2 km",
    description: "Via Constitution Avenue",
    traffic: "Moderate traffic",
    incidents: 1,
  },
  {
    id: "3",
    name: "Alternative Route",
    duration: "28 min",
    distance: "13.8 km",
    description: "Via Shehu Shagari Way",
    traffic: "Heavy traffic",
    incidents: 2,
  },
]

export default function RouteSuggestionScreen({ navigation }: RouteSuggestionScreenProps) {
  const { theme } = useTheme()
  const [destination, setDestination] = useState("")
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [showRoutes, setShowRoutes] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const { location, loading, error } = useLocation()

  const handleSearch = async () => {
    if (!destination.trim()) {
      Alert.alert("Error", "Please enter a destination")
      return
    }

    if (!location) {
      Alert.alert("Error", "Current location not available")
      return
    }

    setSearchLoading(true)

    try {
      // Geocode the destination
      const geocoded = await Location.geocodeAsync(destination)

      if (geocoded.length > 0) {
        const destCoords = {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        }
        setDestinationCoords(destCoords)

        // Get route suggestions using our route service
        const routeSuggestions = await routeService.getRouteSuggestions(
          { latitude: location.latitude, longitude: location.longitude },
          destCoords,
          true // Get alternatives
        )

        setRoutes(routeSuggestions)
        setShowRoutes(true)
      } else {
        Alert.alert("Error", "Destination not found. Please try a more specific address.")
      }
    } catch (error) {
      console.error("Route search error:", error)
      Alert.alert("Error", "Failed to find routes. Please try again.")
    } finally {
      setSearchLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance.toFixed(1)
  }

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case "Light traffic":
        return "#4CAF50"
      case "Moderate traffic":
        return "#ff9800"
      case "Heavy traffic":
        return "#f44336"
      default:
        return "#666"
    }
  }

  // Use routes from our service or fallback to dummy data
  const displayRoutes = showRoutes && routes.length > 0 ? routes : dummyRoutes

  if (loading) {
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Route Suggestions</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.searchSection}>
          <View style={[styles.locationInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="location" size={20} color={theme.colors.success} />
            <Text style={[styles.currentLocation, { color: theme.colors.text }]}>{location?.address || "Current Location"}</Text>
          </View>

          <View style={[styles.destinationInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Where to?"
              placeholderTextColor={theme.colors.textSecondary}
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={handleSearch}
            />
          </View>

          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.colors.primary }, searchLoading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={searchLoading || !location}
          >
            <Text style={styles.searchButtonText}>{searchLoading ? "Searching..." : "Find Routes"}</Text>
          </TouchableOpacity>
        </View>

        {showRoutes && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Suggested Routes</Text>

            {displayRoutes.map((route) => (
              <TouchableOpacity key={route.id} style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <View style={styles.routeTime}>
                    <Text style={styles.duration}>{route.duration}</Text>
                    <Text style={styles.distance}>{route.distance}</Text>
                  </View>
                </View>

                <Text style={styles.routeDescription}>{route.description}</Text>

                <View style={styles.routeInfo}>
                  <View style={styles.trafficInfo}>
                    <View style={[styles.trafficDot, { backgroundColor: getTrafficColor(route.traffic) }]} />
                    <Text style={styles.trafficText}>{route.traffic}</Text>
                  </View>

                  {route.incidents > 0 && (
                    <View style={styles.incidentInfo}>
                      <Ionicons name="warning" size={16} color="#ff9800" />
                      <Text style={styles.incidentText}>
                        {route.incidents} incident{route.incidents > 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Enhanced route info */}
                <View style={styles.enhancedInfo}>
                  {route.tollCost && route.tollCost > 0 && (
                    <View style={styles.costInfo}>
                      <Ionicons name="card-outline" size={14} color="#666" />
                      <Text style={styles.costText}>Toll: ${route.tollCost}</Text>
                    </View>
                  )}
                  {route.fuelCost && (
                    <View style={styles.costInfo}>
                      <Ionicons name="car-outline" size={14} color="#666" />
                      <Text style={styles.costText}>Fuel: ${route.fuelCost}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select Route</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.quickDestinations}>
          <Text style={styles.sectionTitle}>Quick Destinations</Text>

          <TouchableOpacity style={styles.quickDestItem} onPress={() => setDestination("Home")}>
            <Ionicons name="home" size={20} color="#666" />
            <Text style={styles.quickDestText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickDestItem} onPress={() => setDestination("Work")}>
            <Ionicons name="briefcase" size={20} color="#666" />
            <Text style={styles.quickDestText}>Work</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickDestItem} onPress={() => setDestination("Shopping Mall")}>
            <Ionicons name="storefront" size={20} color="#666" />
            <Text style={styles.quickDestText}>Shopping Mall</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Add the missing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 12,
  },
  currentLocation: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  destinationInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  searchButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#ccc",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  routesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  routeTime: {
    alignItems: "flex-end",
  },
  duration: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },
  distance: {
    fontSize: 12,
    color: "#666",
  },
  routeDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  trafficInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  trafficText: {
    fontSize: 12,
    color: "#666",
  },
  incidentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  incidentText: {
    fontSize: 12,
    color: "#ff9800",
    marginLeft: 4,
  },
  selectButton: {
    backgroundColor: "#2196F3",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  quickDestinations: {
    padding: 20,
  },
  quickDestItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  quickDestText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  enhancedInfo: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },
  costInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  costText: {
    fontSize: 12,
    color: "#666",
  },
})
