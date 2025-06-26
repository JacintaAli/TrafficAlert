"use client"

import { useRef, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import MapView, { Marker, type Region, PROVIDER_GOOGLE } from "react-native-maps"
import { Ionicons } from "@expo/vector-icons"

interface MapComponentProps {
  location?: {
    latitude: number
    longitude: number
  }
  reports?: Array<{
    id: string
    latitude: number
    longitude: number
    type: string
  }>
  onMapReady?: () => void
  onRegionChange?: (region: Region) => void
  style?: any
  showUserLocation?: boolean
  followUserLocation?: boolean
}

export default function MapComponent({
  location,
  reports = [],
  onMapReady,
  onRegionChange,
  style,
  showUserLocation = true,
  followUserLocation = false,
}: MapComponentProps) {
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    if (location && followUserLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      )
    }
  }, [location, followUserLocation])

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "accident":
        return "#f44336"
      case "construction":
        return "#ff9800"
      case "hazard":
        return "#ffeb3b"
      case "traffic":
        return "#9c27b0"
      default:
        return "#2196F3"
    }
  }

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "accident":
        return "car-sport"
      case "construction":
        return "construct"
      case "hazard":
        return "warning"
      case "traffic":
        return "car"
      default:
        return "alert-circle"
    }
  }

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : {
        latitude: 9.0765, // Default to Abuja, Nigeria
        longitude: 7.3986,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChange}
        mapType="standard"
      >
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            title={`${report.type} report`}
            description="Tap for more details"
          >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(report.type) }]}>
              <Ionicons name={getMarkerIcon(report.type) as any} size={16} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
})
