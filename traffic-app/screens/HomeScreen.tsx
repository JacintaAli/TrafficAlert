"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocation } from "../hooks/useLocation"
import MapComponent from "../components/MapComponent"
import { reportService } from "../services/reportService"
import { useTheme } from "../contexts/ThemeContext"

interface HomeScreenProps {
  navigation: any
}

// Helper function to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c // Distance in kilometers
  return Math.round(distance * 1000) // Return distance in meters
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useTheme()
  const { location, loading, error, refreshLocation } = useLocation()
  const [reports, setReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)

  useEffect(() => {
    if (location) {
      loadNearbyReports()
    }
  }, [location])

  const loadNearbyReports = async () => {
    if (!location) return

    setLoadingReports(true)
    try {
      console.log('🗺️ HomeScreen: Loading nearby reports...')
      const nearbyReports = await reportService.getNearbyReports(
        location.latitude,
        location.longitude,
        5000 // 5km radius in meters
      )

      // Add distance calculation to each report
      const reportsWithDistance = nearbyReports.map(report => ({
        ...report,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          report.latitude,
          report.longitude
        )
      }))

      console.log('🗺️ HomeScreen: Loaded', reportsWithDistance.length, 'nearby reports')
      setReports(reportsWithDistance)
    } catch (error) {
      console.error('🗺️ HomeScreen: Failed to load nearby reports:', error)
      // Don't show error alert, just use empty array
      setReports([])
    } finally {
      setLoadingReports(false)
    }
  }

  const handleAddReport = () => {
    if (!location) {
      Alert.alert("Location Required", "Please enable location services to report incidents.")
      return
    }
    navigation.navigate("ReportIncident", { location })
  }

  const handleRefresh = () => {
    refreshLocation()
    loadNearbyReports()
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="location" size={48} color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>TrafficAlert</Text>
        <View style={styles.headerRight}>
          {location?.address && (
            <Text style={[styles.locationText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {location.address}
            </Text>
          )}
          <TouchableOpacity style={[styles.reportsButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate("AllReports")}>
            <Text style={styles.reportsButtonText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapComponent
          location={location || undefined}
          reports={reports}
          showUserLocation={true}
          followUserLocation={false}
          style={styles.map}
        />

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={handleAddReport}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.locationButton} onPress={refreshLocation}>
          <Ionicons name="locate" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    maxWidth: 150,
  },
  reportsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  reportsButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  refreshButton: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#2196F3",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  locationButton: {
    position: "absolute",
    bottom: 170,
    right: 20,
    backgroundColor: "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
})
