"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, Share, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocation } from "../hooks/useLocation"
import { useTheme } from "../contexts/ThemeContext"
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"

const { width } = Dimensions.get('window')

interface AlertDetailsScreenProps {
  navigation: any
  route: {
    params: {
      alert: {
        id: string
        title: string
        message: string
        type: 'traffic' | 'accident' | 'roadwork' | 'weather' | 'camera'
        severity: 'low' | 'medium' | 'high' | 'critical'
        location: {
          latitude: number
          longitude: number
          address: string
        }
        timestamp: string
        distance?: string
        estimatedClearTime?: string
        affectedRoutes?: string[]
      }
    }
  }
}

export default function AlertDetailsScreen({ navigation, route }: AlertDetailsScreenProps) {
  const { theme } = useTheme()
  const { location } = useLocation()
  const { alert } = route.params
  
  const [comments, setComments] = useState([
    {
      id: "1",
      user: "Driver123",
      message: "Still heavy traffic here, avoid if possible",
      timestamp: "2 min ago",
      helpful: 12,
    },
    {
      id: "2", 
      user: "LocalCommuter",
      message: "Accident cleared but backup remains",
      timestamp: "5 min ago",
      helpful: 8,
    },
    {
      id: "3",
      user: "TruckDriver",
      message: "Alternative route via Main St is faster",
      timestamp: "8 min ago", 
      helpful: 15,
    }
  ])

  const [alternativeRoutes] = useState([
    {
      id: "1",
      name: "Via Main Street",
      duration: "+5 min",
      distance: "+2.1 km",
      description: "Avoid incident area completely",
      savings: "Saves 15 min in current traffic"
    },
    {
      id: "2", 
      name: "Via Highway Bypass",
      duration: "+8 min",
      distance: "+4.3 km", 
      description: "Longer but more reliable",
      savings: "Consistent travel time"
    }
  ])

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'low': return '#4CAF50'
      case 'medium': return '#ff9800'
      case 'high': return '#f44336'
      case 'critical': return '#d32f2f'
      default: return '#666'
    }
  }

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'traffic': return 'car'
      case 'accident': return 'warning'
      case 'roadwork': return 'construct'
      case 'weather': return 'rainy'
      case 'camera': return 'camera'
      default: return 'information-circle'
    }
  }

  const handleShareAlert = async () => {
    try {
      await Share.share({
        message: `Traffic Alert: ${alert.title}\n${alert.message}\nLocation: ${alert.location.address}\n\nShared via TrafficAlert App`,
        title: 'Traffic Alert'
      })
    } catch (error) {
      console.error('Error sharing alert:', error)
    }
  }

  const handleGetDirections = () => {
    navigation.navigate('Navigation', {
      selectedRoute: {
        id: 'alert-route',
        name: 'Route to Alert Location',
        duration: alert.distance || '10 min',
        distance: alert.distance || '5.2 km',
        description: `Navigate to ${alert.location.address}`,
        traffic: 'Moderate traffic',
        incidents: 1,
        destination: alert.location
      }
    })
  }

  const handleAvoidArea = () => {
    // Navigate back to route suggestions with avoidance parameters
    navigation.navigate('Routes', {
      avoidLocation: alert.location,
      avoidRadius: 2000 // 2km radius
    })
  }

  const handleReportUpdate = () => {
    Alert.alert(
      "Report Update",
      "What's the current situation at this location?",
      [
        { text: "Situation Cleared", onPress: () => reportStatus('cleared') },
        { text: "Still Active", onPress: () => reportStatus('active') },
        { text: "Getting Worse", onPress: () => reportStatus('worse') },
        { text: "Cancel", style: "cancel" }
      ]
    )
  }

  const reportStatus = (status: string) => {
    Alert.alert("Thank you!", `Your report has been submitted. This helps other drivers stay informed.`)
  }

  const addComment = () => {
    Alert.prompt(
      "Add Comment",
      "Share information about this incident:",
      (text) => {
        if (text && text.trim()) {
          const newComment = {
            id: Date.now().toString(),
            user: "You",
            message: text.trim(),
            timestamp: "Just now",
            helpful: 0
          }
          setComments([newComment, ...comments])
        }
      }
    )
  }

  const markHelpful = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, helpful: comment.helpful + 1 }
        : comment
    ))
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Alert Details</Text>
        <TouchableOpacity onPress={handleShareAlert}>
          <Ionicons name="share-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Alert Info Card */}
        <View style={[styles.alertCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIcon, { backgroundColor: getSeverityColor() }]}>
              <Ionicons name={getAlertIcon() as any} size={24} color="#fff" />
            </View>
            <View style={styles.alertInfo}>
              <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{alert.title}</Text>
              <Text style={[styles.alertTime, { color: theme.colors.textSecondary }]}>{alert.timestamp}</Text>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
              <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={[styles.alertMessage, { color: theme.colors.text }]}>{alert.message}</Text>
          
          <View style={styles.alertMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{alert.location.address}</Text>
            </View>
            {alert.estimatedClearTime && (
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  Est. clear: {alert.estimatedClearTime}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location</Text>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: alert.location.latitude,
              longitude: alert.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsTraffic={true}
          >
            <Marker
              coordinate={alert.location}
              title={alert.title}
              description={alert.message}
            >
              <View style={[styles.mapMarker, { backgroundColor: getSeverityColor() }]}>
                <Ionicons name={getAlertIcon() as any} size={20} color="#fff" />
              </View>
            </Marker>
            
            {/* Affected area circle */}
            <Circle
              center={alert.location}
              radius={1000}
              strokeColor={getSeverityColor()}
              fillColor={`${getSeverityColor()}20`}
              strokeWidth={2}
            />
          </MapView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} onPress={handleGetDirections}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Get Directions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={handleAvoidArea}>
            <Ionicons name="return-up-back" size={20} color={theme.colors.text} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Avoid Area</Text>
          </TouchableOpacity>
        </View>

        {/* Alternative Routes */}
        {alternativeRoutes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Alternative Routes</Text>
            {alternativeRoutes.map((route) => (
              <TouchableOpacity key={route.id} style={[styles.routeCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.routeHeader}>
                  <Text style={[styles.routeName, { color: theme.colors.text }]}>{route.name}</Text>
                  <Text style={[styles.routeDuration, { color: theme.colors.primary }]}>{route.duration}</Text>
                </View>
                <Text style={[styles.routeDescription, { color: theme.colors.textSecondary }]}>{route.description}</Text>
                <Text style={[styles.routeSavings, { color: theme.colors.success }]}>{route.savings}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Community Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Community Reports</Text>
            <TouchableOpacity onPress={addComment}>
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {comments.map((comment) => (
            <View key={comment.id} style={[styles.commentCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.commentHeader}>
                <Text style={[styles.commentUser, { color: theme.colors.text }]}>{comment.user}</Text>
                <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>{comment.timestamp}</Text>
              </View>
              <Text style={[styles.commentMessage, { color: theme.colors.text }]}>{comment.message}</Text>
              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => markHelpful(comment.id)}
              >
                <Ionicons name="thumbs-up" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.helpfulText, { color: theme.colors.textSecondary }]}>
                  Helpful ({comment.helpful})
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Report Update */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: theme.colors.warning }]}
            onPress={handleReportUpdate}
          >
            <Ionicons name="flag" size={20} color="#fff" />
            <Text style={styles.reportButtonText}>Report Current Status</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  alertCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 14,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  alertMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  mapContainer: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  map: {
    width: width - 40,
    height: 200,
    borderRadius: 12,
  },
  mapMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  },
  routeDuration: {
    fontSize: 14,
    fontWeight: "600",
  },
  routeDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  routeSavings: {
    fontSize: 12,
    fontWeight: "500",
  },
  commentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 12,
  },
  commentMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helpfulText: {
    fontSize: 12,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})