import { useState, useEffect, useRef, useCallback } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, AppState, AppStateStatus } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { notificationService, NotificationData } from "../services/notificationService"
import { useTheme } from "../contexts/ThemeContext"
import { useNotificationBadge } from "../hooks/useNotificationBadge"
import NotificationBadge from "../components/NotificationBadge"
import { useFocusEffect } from "@react-navigation/native"

interface NotificationsScreenProps {
  navigation: any
}



export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const { theme } = useTheme()
  const { count, highestSeverity, hasUnread, refreshBadge } = useNotificationBadge() as any
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefreshing, setAutoRefreshing] = useState(false)
  const refreshIntervalRef = useRef<number | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Auto-refresh every 15 seconds when screen is active (notifications need more frequent updates)
  const AUTO_REFRESH_INTERVAL = 15000 // 15 seconds

  useEffect(() => {
    loadNotifications()
    startAutoRefresh()

    // Listen for app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, refresh notifications
        console.log('🔔 App came to foreground, refreshing notifications...')
        loadNotifications()
      }
      appStateRef.current = nextAppState
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      stopAutoRefresh()
      subscription?.remove()
    }
  }, [])

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔔 Notifications screen focused, refreshing...')
      loadNotifications()
      startAutoRefresh()

      return () => {
        stopAutoRefresh()
      }
    }, [])
  )

  const startAutoRefresh = () => {
    stopAutoRefresh() // Clear any existing interval
    refreshIntervalRef.current = setInterval(async () => {
      console.log('🔔 Auto-refreshing notifications...')
      setAutoRefreshing(true)
      await loadNotifications()
      setAutoRefreshing(false)
    }, AUTO_REFRESH_INTERVAL)
  }

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }

  const loadNotifications = async () => {
    try {
      const allNotifications = await notificationService.getNotifications()
      setNotifications(allNotifications)
      // Refresh the badge count after loading notifications
      refreshBadge()
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Fallback to local notifications
      const localNotifications = notificationService.getLocalNotifications()
      setNotifications(localNotifications)
      refreshBadge()
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)

      // Update local state immediately without reloading
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )

      refreshBadge() // Update badge count
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()

      // Update local state immediately without reloading
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, read: true }))
      )

      refreshBadge() // Update badge count
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'traffic':
      case 'traffic_alert': return 'car'
      case 'accident': return 'warning'
      case 'construction': return 'construct'
      case 'weather': return 'rainy'
      case 'route':
      case 'route_alert': return 'map'
      case 'report_comment': return 'chatbubble'
      case 'report_upvote': return 'thumbs-up'
      case 'report_verified': return 'checkmark-circle'
      case 'nearby_incident': return 'location'
      default: return 'notifications'
    }
  }

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#d32f2f'
      case 'high': return '#f44336'
      case 'normal': return '#ff9800'
      case 'low': return '#4caf50'
      default: return '#2196f3'
    }
  }

  const formatTime = (timestamp: Date | string) => {
    const now = new Date()
    const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp)

    // Check if the date is valid
    if (isNaN(timestampDate.getTime())) {
      return 'Just now'
    }

    const diff = now.getTime() - timestampDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const handleNotificationPress = async (item: NotificationData) => {
    try {
      // Mark as read first and wait for it to complete
      await handleMarkAsRead(item.id)

      // Navigate based on notification data
      if (item.data?.reportId) {
        // If we have a report ID, navigate to the actual report
        navigation.navigate('ReportDetails', { reportId: item.data.reportId })
      } else {
        // Fallback: create report data from notification with all required properties
        const reportData = {
          id: item.data?.reportId || item.id,
          type: item.data?.reportType || item.title,
          description: item.body,
          image: null,
          images: [], // Array of images
          comments: 0,
          upvotes: 0, // Number for vote count
          downvotes: 0, // Number for vote count
          upvoteCount: 0, // Alternative property name
          downvoteCount: 0, // Alternative property name
          time: formatTime(item.timestamp),
          timestamp: item.timestamp,
          location: item.location || {
            latitude: 9.0765,
            longitude: 7.3986,
            address: "Unknown Location"
          },
          latitude: item.location?.latitude || 9.0765,
          longitude: item.location?.longitude || 7.3986,
          severity: item.priority as 'low' | 'medium' | 'high' | 'critical',
          priority: item.priority,
          distance: "250m",
          estimatedClearTime: "30 min",
          affectedRoutes: ["Main Street", "Highway 1"],
          verified: false,
          userId: 'unknown',
          user: {
            _id: 'unknown',
            name: 'Anonymous User',
            profilePicture: undefined
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }

        navigation.navigate('ReportDetails', { report: reportData })
      }
    } catch (error) {
      console.error('Error handling notification press:', error)
    }
  }

  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.priority) }]}>
            <Ionicons name={getNotificationIcon(item.type) as any} size={20} color="#fff" />
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationDescription}>{item.body}</Text>
        {item.location && (
          <Text style={styles.notificationLocation}>📍 {item.location.address}</Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
          {hasUnread && (
            <NotificationBadge
              count={count}
              severity={highestSeverity}
              size="medium"
              position="top-right"
            />
          )}
        </View>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={[styles.markAllReadText, { color: theme.colors.primary }]}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={theme.colors.border} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>No notifications yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>You'll see traffic alerts and updates here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  headerTitleContainer: {
    position: "relative",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  markAllReadText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: "#666",
    fontSize: 14,
  },
  viewAllButton: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  viewAllText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
  },
  notificationItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#e0e0e0",
  },
  unreadNotification: {
    backgroundColor: "#e3f2fd",
    borderLeftColor: "#2196F3",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationLocation: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
  },
  notificationDistance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
})
