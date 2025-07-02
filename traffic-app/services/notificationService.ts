import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

export interface NotificationData {
  id: string
  title: string
  body: string
  type: 'traffic' | 'accident' | 'construction' | 'weather' | 'route'
  priority: 'low' | 'normal' | 'high'
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  timestamp: Date
  read: boolean
  actionUrl?: string
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // Show notification banner
    shouldShowList: true,    // Show in notification list
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

class NotificationService {
  private notifications: NotificationData[] = []
  private expoPushToken: string | null = null

  async initialize(): Promise<void> {
    try {
      // Request permissions
      await this.requestPermissions()
      
      // Get push token
      this.expoPushToken = await this.registerForPushNotifications()
      
      // Set up notification listeners
      this.setupNotificationListeners()
      
      console.log('Notification service initialized')
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!')
        return false
      }
      
      return true
    } else {
      console.log('Must use physical device for Push Notifications')
      return false
    }
  }

  private async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('traffic-alerts', {
          name: 'Traffic Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        })
      }

      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-expo-project-id', // Replace with your project ID
        })
        return token.data
      }
    } catch (error) {
      console.error('Error getting push token:', error)
    }
    return null
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
      this.handleNotificationReceived(notification)
    })

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response)
      this.handleNotificationTapped(response)
    })
  }

  // Send local notification
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || null,
      })
    } catch (error) {
      console.error('Error sending local notification:', error)
    }
  }

  // Send traffic alert
  async sendTrafficAlert(
    type: 'accident' | 'construction' | 'heavy_traffic',
    location: string,
    description: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<void> {
    const titles = {
      accident: '🚨 Accident Alert',
      construction: '🚧 Construction Alert',
      heavy_traffic: '🚗 Heavy Traffic Alert'
    }

    const notification: NotificationData = {
      id: Date.now().toString(),
      title: titles[type],
      body: `${description} near ${location}`,
      type: 'traffic',
      priority: type === 'accident' ? 'high' : 'normal',
      location: coordinates ? {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: location
      } : undefined,
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(notification)
    
    await this.sendLocalNotification(
      notification.title,
      notification.body,
      { notificationId: notification.id, type: notification.type }
    )
  }

  // Send route update
  async sendRouteUpdate(
    routeName: string,
    newDuration: string,
    delayMinutes: number
  ): Promise<void> {
    const notification: NotificationData = {
      id: Date.now().toString(),
      title: '🛣️ Route Update',
      body: `${routeName} now takes ${newDuration} (+${delayMinutes} min delay)`,
      type: 'route',
      priority: delayMinutes > 15 ? 'high' : 'normal',
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(notification)
    
    await this.sendLocalNotification(
      notification.title,
      notification.body,
      { notificationId: notification.id, type: notification.type }
    )
  }

  // Schedule location-based alerts
  async scheduleLocationAlert(
    latitude: number,
    longitude: number,
    radius: number,
    title: string,
    body: string
  ): Promise<void> {
    // Note: Expo doesn't support geofencing directly
    // You would need to implement this with background location tracking
    console.log('Location-based alerts would require background location tracking')
  }

  // Get all notifications
  getNotifications(): NotificationData[] {
    return this.notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get unread notifications
  getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter(n => !n.read)
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true)
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = []
    Notifications.dismissAllNotificationsAsync()
  }

  // Handle notification received
  private handleNotificationReceived(notification: Notifications.Notification): void {
    // Add to local storage or update UI
    console.log('Processing received notification:', notification.request.content.title)
  }

  // Handle notification tapped
  private handleNotificationTapped(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data
    console.log('Notification tapped with data:', data)
    
    // Navigate to relevant screen based on notification type
    // This would be handled by your navigation system
  }

  // Get push token for backend registration
  getPushToken(): string | null {
    return this.expoPushToken
  }

  // Simulate receiving traffic alerts (for demo)
  simulateTrafficAlerts(): void {
    setTimeout(() => {
      this.sendTrafficAlert(
        'heavy_traffic',
        'Highway 101',
        'Heavy traffic due to rush hour',
        { latitude: 37.7749, longitude: -122.4194 }
      )
    }, 5000)

    setTimeout(() => {
      this.sendTrafficAlert(
        'accident',
        'Main Street & 5th Ave',
        'Multi-car accident blocking two lanes'
      )
    }, 15000)
  }
}

export const notificationService = new NotificationService()
