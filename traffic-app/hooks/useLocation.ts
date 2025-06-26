"use client"

import { useState, useEffect } from "react"
import * as Location from "expo-location"

export interface LocationData {
  latitude: number
  longitude: number
  address?: string
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<Location.LocationSubscription | null>(null)

  useEffect(() => {
    getCurrentLocation()
    startLocationTracking()

    return () => {
      if (watchId) {
        watchId.remove()
      }
    }
  }, [])

  const getCurrentLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setError("Location permission denied")
        setLoading(false)
        return
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      // Get address from coordinates
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })

        if (addresses.length > 0) {
          const address = addresses[0]
          locationData.address = `${address.street || ""} ${address.city || ""}, ${address.region || ""}`
        }
      } catch (addressError) {
        console.log("Address lookup failed:", addressError)
      }

      setLocation(locationData)
    } catch (err) {
      setError("Failed to get location")
      console.error("Location error:", err)
    } finally {
      setLoading(false)
    }
  }

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") return

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setLocation(locationData)
        }
      )
      setWatchId(subscription)
    } catch (err) {
      console.error("Location tracking error:", err)
    }
  }

  const refreshLocation = () => {
    getCurrentLocation()
  }

  const stopLocationTracking = () => {
    if (watchId) {
      watchId.remove()
      setWatchId(null)
    }
  }

  return {
    location,
    loading,
    error,
    refreshLocation,
    stopLocationTracking,
  }
}
