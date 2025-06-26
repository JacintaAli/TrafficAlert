import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { notificationService, NotificationData } from "../services/notificationService"

interface NotificationsScreenProps {
  navigation: any
}

const dummyNotifications = [
  {
    id: "1",
    type: "Car crash",
    category: "Accident",
    description: "2 cars hit each other near For You supermarket",
    distance: "250m",
    time: "5 min ago",
    icon: "car-sport",
    color: "#f44336",
  },
  {
    id: "2",
    type: "Road block",
    category: "Traffic",
    description: "The roads are completely blocked. It's like a traffic jam",
    distance: "250m",
    time: "12 min ago",
    icon: "warning",
    color: "#f44336",
  },
  {
    id: "3",
    type: "Serious Traffic jam",
    category: "Accident",
    description: "2 cars hit each other near For You supermarket",
    distance: "250m",
    time: "18 min ago",
    icon: "car",
    color: "#f44336",
  },
  {
    id: "4",
    type: "Commotion",
    category: "Accident",
    description: "2 cars hit each other near For You supermarket",
    distance: "250m",
    time: "25 min ago",
    icon: "people",
    color: "#ff9800",
  },
]

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications()
    setNotifications(allNotifications)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadNotifications()
    setRefreshing(false)
  }

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId)
    loadNotifications()
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'traffic': return 'car'
      case 'accident': return 'warning'
      case 'construction': return 'construct'
      case 'weather': return 'rainy'
      case 'route': return 'map'
      default: return 'notifications'
    }
  }

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336'
      case 'normal': return '#ff9800'
      case 'low': return '#4caf50'
      default: return '#2196f3'
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleMarkAsRead(item.id)}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllReadText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>You'll see traffic alerts and updates here</Text>
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
  list: {
    flex: 1,
    paddingHorizontal: 20,
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
