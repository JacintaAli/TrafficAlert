import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { Alert } from 'react-native'

export interface TrafficReport {
  id: string
  type: 'accident' | 'hazard' | 'construction' | 'traffic' | 'police' | 'camera'
  latitude: number
  longitude: number
  description: string
  severity: 'low' | 'medium' | 'high'
  images: string[]
  timestamp: Date
  userId: string
  verified: boolean
  upvotes: number
  downvotes: number
  comments: Comment[]
  expiresAt?: Date
}

export interface Comment {
  id: string
  userId: string
  username: string
  text: string
  timestamp: Date
}

class ReportService {
  private reports: TrafficReport[] = []
  private baseUrl = 'https://your-api-endpoint.com/api' // Replace with your backend

  // Submit a new report
  async submitReport(reportData: Omit<TrafficReport, 'id' | 'timestamp' | 'verified' | 'upvotes' | 'downvotes' | 'comments'>): Promise<TrafficReport> {
    try {
      const report: TrafficReport = {
        ...reportData,
        id: Date.now().toString(),
        timestamp: new Date(),
        verified: false,
        upvotes: 0,
        downvotes: 0,
        comments: [],
        expiresAt: this.calculateExpiration(reportData.type)
      }

      // In a real app, send to backend
      // const response = await fetch(`${this.baseUrl}/reports`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // })

      this.reports.push(report)
      return report
    } catch (error) {
      throw new Error('Failed to submit report')
    }
  }

  // Get nearby reports
  async getNearbyReports(latitude: number, longitude: number, radiusKm: number = 10): Promise<TrafficReport[]> {
    // Filter reports within radius
    return this.reports.filter(report => {
      const distance = this.calculateDistance(latitude, longitude, report.latitude, report.longitude)
      return distance <= radiusKm && !this.isExpired(report)
    })
  }

  // Vote on a report
  async voteOnReport(reportId: string, vote: 'up' | 'down'): Promise<void> {
    const report = this.reports.find(r => r.id === reportId)
    if (report) {
      if (vote === 'up') {
        report.upvotes++
      } else {
        report.downvotes++
      }
    }
  }

  // Add comment to report
  async addComment(reportId: string, comment: Omit<Comment, 'id' | 'timestamp'>): Promise<void> {
    const report = this.reports.find(r => r.id === reportId)
    if (report) {
      const newComment: Comment = {
        ...comment,
        id: Date.now().toString(),
        timestamp: new Date()
      }
      report.comments.push(newComment)
    }
  }

  // Image handling
  async pickImage(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permission is required to add photos')
        return null
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      })

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri
      }
      return null
    } catch (error) {
      console.error('Error picking image:', error)
      return null
    }
  }

  async takePhoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos')
        return null
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      })

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri
      }
      return null
    } catch (error) {
      console.error('Error taking photo:', error)
      return null
    }
  }

  // Utility functions
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private calculateExpiration(type: string): Date {
    const now = new Date()
    switch (type) {
      case 'accident':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours
      case 'construction':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      case 'hazard':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      case 'traffic':
        return new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes
      default:
        return new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
    }
  }

  private isExpired(report: TrafficReport): boolean {
    if (!report.expiresAt) return false
    return new Date() > report.expiresAt
  }
}

export const reportService = new ReportService()
