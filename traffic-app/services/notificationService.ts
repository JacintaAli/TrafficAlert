import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import apiService from './apiService'

export interface NotificationData {
  id: string
  title: string
  body: string
  type: 'traffic_alert' | 'report_comment' | 'report_verified' | 'report_disputed' | 'nearby_incident' | 'route_alert' | 'traffic' | 'accident' | 'construction' | 'weather' | 'route'
  priority: 'low' | 'normal' | 'high' | 'critical'
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  timestamp: Date
  read: boolean
  actionUrl?: string
  reportId?: string
  distance?: number
  data?: {
    reportId?: string
    commentId?: string
    reportType?: string
    severity?: string
    location?: any
    commenterName?: string
  }
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
  private isInitialized: boolean = false

  async initialize(): Promise<void> {
    try {
      // Request permissions
      await this.requestPermissions()
      
      // Get push token
      this.expoPushToken = await this.registerForPushNotifications()
      
      // Set up notification listeners
      this.setupNotificationListeners()

      this.isInitialized = true
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

  // Handle real push notifications from backend
  async handlePushNotification(notificationData: {
    title: string
    body: string
    data: any
    priority?: string
  }): Promise<void> {
    try {
      // Create notification object
      const notification: NotificationData = {
        id: Date.now().toString(),
        title: notificationData.title,
        body: notificationData.body,
        type: notificationData.data.type || 'traffic_alert',
        priority: (notificationData.priority as any) || 'normal',
        timestamp: new Date(),
        read: false,
        data: notificationData.data
      }

      // Add to local notifications array
      this.notifications.unshift(notification)

      // Show local push notification
      await this.sendLocalNotification(
        notification.title,
        notification.body,
        {
          notificationId: notification.id,
          type: notification.type,
          ...notificationData.data
        }
      )

      console.log('📱 Push notification displayed:', notification.title)
    } catch (error) {
      console.error('❌ Error handling push notification:', error)
    }
  }

  // Simulate receiving a new report notification (called when reports are created)
  async simulateNewReportNotification(report: any): Promise<void> {
    try {
      const notificationData = {
        title: `🚨 ${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Alert Nearby`,
        body: report.description.length > 100
          ? `${report.description.substring(0, 100)}...`
          : report.description,
        data: {
          type: 'new_report',
          reportId: report._id || report.id,
          reportType: report.type,
          severity: report.severity,
          location: report.location
        },
        priority: report.severity === 'high' ? 'high' : 'normal'
      }

      await this.handlePushNotification(notificationData)
    } catch (error) {
      console.error('❌ Error simulating new report notification:', error)
    }
  }

  // Simulate receiving a comment notification (called when comments are added)
  async simulateCommentNotification(report: any, comment: any, commenterName: string): Promise<void> {
    try {
      const notificationData = {
        title: '💬 New Comment on Your Report',
        body: `${commenterName} commented: "${comment.text.length > 80 ? comment.text.substring(0, 80) + '...' : comment.text}"`,
        data: {
          type: 'new_comment',
          reportId: report._id || report.id,
          commentId: comment._id || comment.id,
          reportType: report.type,
          commenterName
        },
        priority: 'normal'
      }

      await this.handlePushNotification(notificationData)
    } catch (error) {
      console.error('❌ Error simulating comment notification:', error)
    }
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

  // Get all notifications (from recent reports and comments)
  async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationData[]> {
    try {
      // Get recent reports as notifications
      const reportsResponse = await apiService.getReports({ page, limit: limit / 2 })
      const recentReports: NotificationData[] = []

      if (reportsResponse.success) {
        recentReports.push(...reportsResponse.data.reports.map((report: any) => ({
          id: `report_${report._id}`,
          title: `🚨 ${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Alert`,
          body: report.description.length > 100
            ? `${report.description.substring(0, 100)}...`
            : report.description,
          type: 'traffic_alert',
          priority: report.severity === 'high' ? 'high' : report.severity === 'critical' ? 'critical' : 'normal',
          timestamp: new Date(report.createdAt),
          read: false,
          data: {
            reportId: report._id,
            reportType: report.type,
            severity: report.severity,
            location: report.location
          }
        })))
      }

      // Get user's own reports with recent comments as notifications
      const userReportsResponse = await apiService.getUserReports(1, limit / 2)
      const commentNotifications: NotificationData[] = []

      if (userReportsResponse.success) {
        userReportsResponse.data.reports.forEach((report: any) => {
          if (report.interactions?.comments?.length > 0) {
            // Get the most recent comment
            const recentComment = report.interactions.comments[report.interactions.comments.length - 1]
            commentNotifications.push({
              id: `comment_${recentComment._id}`,
              title: '💬 New Comment on Your Report',
              body: `${recentComment.user.name}: "${recentComment.text.length > 80 ? recentComment.text.substring(0, 80) + '...' : recentComment.text}"`,
              type: 'report_comment',
              priority: 'normal',
              timestamp: new Date(recentComment.createdAt),
              read: false,
              data: {
                reportId: report._id,
                commentId: recentComment._id,
                reportType: report.type,
                commenterName: recentComment.user.name
              }
            })
          }
        })
      }

      // Combine and sort all notifications
      const allNotifications = [...recentReports, ...commentNotifications]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

      // Preserve read status from existing notifications
      const updatedNotifications = allNotifications.map(newNotif => {
        const existingNotif = this.notifications.find(existing => existing.id === newNotif.id)
        return existingNotif ? { ...newNotif, read: existingNotif.read } : newNotif
      })

      this.notifications = updatedNotifications
      return this.notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Return local notifications as fallback
      return this.notifications.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
        return bTime - aTime
      })
    }
  }

  // Get local notifications (for immediate access)
  getLocalNotifications(): NotificationData[] {
    return this.notifications.sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
      return bTime - aTime
    })
  }

  // Get unread notifications
  getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter(n => !n.read)
  }

  // Mark notification as read (local only since we don't store notifications)
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Update local state only
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
      console.log(`Marked notification ${notificationId} as read`)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read (local only since we don't store notifications)
  async markAllAsRead(): Promise<void> {
    try {
      // Update local state only
      this.notifications.forEach(n => n.read = true)
      console.log('Marked all notifications as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
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

  // Check if service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized
  }


}

export const notificationService = new NotificationService()
