import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { Alert } from 'react-native'
import apiService from './apiService'
import { userService } from './userService'

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
  // User data for display (populated from backend)
  user?: {
    _id: string
    name: string
    profilePicture?: string
  } | null
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

  // Submit a new report to backend
  async submitReport(reportData: Omit<TrafficReport, 'id' | 'timestamp' | 'verified' | 'upvotes' | 'downvotes' | 'comments'>): Promise<TrafficReport> {
    try {
      console.log('📝 ReportService: Starting report submission...')
      console.log('📝 ReportService: Report data received:', reportData)

      // Get current user
      const currentUser = await userService.getCurrentUser()
      console.log('📝 ReportService: Current user:', currentUser ? `${currentUser.username} (${currentUser.email})` : 'Not logged in')

      if (!currentUser) {
        throw new Error('User not authenticated. Please log in first.')
      }

      // Prepare report data for backend (match what validation schema expects)
      const backendReportData = {
        type: reportData.type,
        severity: reportData.severity,
        description: reportData.description,
        location: {
          latitude: reportData.latitude,
          longitude: reportData.longitude,
          address: `${reportData.latitude}, ${reportData.longitude}`
        }
        // Note: metadata is not allowed by validation schema, so removed
      }

      console.log('Sending report data:', JSON.stringify(backendReportData, null, 2));
      console.log('Data types check:', {
        'type': typeof backendReportData.type,
        'severity': typeof backendReportData.severity,
        'description': typeof backendReportData.description,
        'latitude': typeof backendReportData.location.latitude,
        'longitude': typeof backendReportData.location.longitude,
        'latitude_value': backendReportData.location.latitude,
        'longitude_value': backendReportData.location.longitude
      });

      // Validate data before sending
      if (!backendReportData.type) {
        throw new Error('Report type is required');
      }
      if (!backendReportData.description || backendReportData.description.length < 10) {
        throw new Error('Description must be at least 10 characters');
      }
      if (!backendReportData.location?.latitude || !backendReportData.location?.longitude) {
        throw new Error('Valid location coordinates are required');
      }

      // Prepare images for upload
      const imageFiles = []
      for (const imageUri of reportData.images) {
        if (imageUri) {
          const imageFile = {
            uri: imageUri,
            type: 'image/jpeg',
            name: `report_image_${Date.now()}.jpg`
          }
          imageFiles.push(imageFile)
        }
      }

      // Submit to backend
      console.log('📝 ReportService: Submitting to backend with', imageFiles.length, 'images');
      const response = await apiService.createReport(backendReportData, imageFiles)
      console.log('📝 ReportService: Backend response:', response);

      if (response.success) {
        // Convert backend response to our TrafficReport format
        const backendReport = response.data.report
        const report: TrafficReport = {
          id: backendReport._id,
          type: backendReport.type,
          latitude: backendReport.latitude || backendReport.location.coordinates[1],
          longitude: backendReport.longitude || backendReport.location.coordinates[0],
          description: backendReport.description,
          severity: backendReport.severity,
          images: backendReport.images?.map((img: any) => img.url) || [],
          timestamp: new Date(backendReport.createdAt),
          userId: backendReport.user._id || backendReport.user,
          verified: backendReport.verification?.isVerified || false,
          upvotes: backendReport.interactions?.helpfulCount || 0,
          downvotes: 0, // Not implemented in backend yet
          comments: backendReport.interactions?.comments?.map((comment: any) => ({
            id: comment._id,
            userId: comment.user._id || comment.user,
            username: comment.user.name || 'Unknown',
            text: comment.text,
            timestamp: new Date(comment.createdAt)
          })) || [],
          expiresAt: new Date(backendReport.expiresAt)
        }

        // Add to local cache
        this.reports.unshift(report)

        console.log('📝 ReportService: Report submitted successfully!', report.id)
        return report
      } else {
        console.log('📝 ReportService: Backend submission failed:', response.message)
        throw new Error(response.message || 'Failed to submit report')
      }
    } catch (error) {
      console.error('📝 ReportService: Error submitting report:', error)
      throw error
    }
  }

  // Get nearby reports from backend
  async getNearbyReports(latitude: number, longitude: number, radiusKm: number = 10): Promise<TrafficReport[]> {
    try {
      const radiusMeters = radiusKm * 1000 // Convert to meters
      const response = await apiService.getNearbyReports(latitude, longitude, radiusMeters)

      if (response.success) {
        // Convert backend reports to our TrafficReport format
        const reports: TrafficReport[] = response.data.reports.map((backendReport: any) => ({
          id: backendReport._id,
          type: backendReport.type,
          latitude: backendReport.latitude || backendReport.location.coordinates[1],
          longitude: backendReport.longitude || backendReport.location.coordinates[0],
          description: backendReport.description,
          severity: backendReport.severity,
          images: backendReport.images?.map((img: any) => img.url) || [],
          timestamp: new Date(backendReport.createdAt),
          userId: backendReport.user._id || backendReport.user,
          verified: backendReport.verification?.isVerified || false,
          upvotes: backendReport.interactions?.helpfulCount || 0,
          downvotes: 0, // Not implemented in backend yet
          comments: backendReport.interactions?.comments?.map((comment: any) => ({
            id: comment._id,
            userId: comment.user._id || comment.user,
            username: comment.user.name || 'Unknown',
            text: comment.text,
            timestamp: new Date(comment.createdAt)
          })) || [],
          expiresAt: new Date(backendReport.expiresAt)
        }))

        // Update local cache
        this.reports = reports
        return reports
      } else {
        throw new Error(response.message || 'Failed to fetch reports')
      }
    } catch (error) {
      console.error('Get nearby reports error:', error)
      // Return cached reports as fallback
      return this.reports.filter(report => {
        const distance = this.calculateDistance(latitude, longitude, report.latitude, report.longitude)
        return distance <= radiusKm && !this.isExpired(report)
      })
    }
  }

  // Get all reports from backend
  async getAllReports(): Promise<TrafficReport[]> {
    try {
      const response = await apiService.getReports()

      if (response.success) {
        // Convert backend reports to our TrafficReport format
        const reports: TrafficReport[] = response.data.reports.map((backendReport: any) => ({
          id: backendReport._id,
          type: backendReport.type,
          latitude: backendReport.latitude || backendReport.location.coordinates[1],
          longitude: backendReport.longitude || backendReport.location.coordinates[0],
          description: backendReport.description,
          severity: backendReport.severity,
          images: backendReport.images?.map((img: any) => img.url) || [],
          timestamp: new Date(backendReport.createdAt),
          userId: backendReport.user._id || backendReport.user,
          // Preserve full user data for display
          user: typeof backendReport.user === 'object' ? {
            _id: backendReport.user._id,
            name: backendReport.user.name,
            profilePicture: backendReport.user.profilePicture
          } : null,
          verified: backendReport.verification?.isVerified || false,
          upvotes: backendReport.interactions?.helpfulCount || 0,
          downvotes: 0, // Not implemented in backend yet
          comments: backendReport.interactions?.comments?.map((comment: any) => ({
            id: comment._id,
            userId: comment.user._id || comment.user,
            username: comment.user.name || 'Unknown',
            text: comment.text,
            timestamp: new Date(comment.createdAt)
          })) || [],
          expiresAt: new Date(backendReport.expiresAt)
        }))

        // Update local cache
        this.reports = reports
        return reports
      } else {
        throw new Error(response.message || 'Failed to fetch reports')
      }
    } catch (error) {
      console.error('Get all reports error:', error)
      // Return cached reports as fallback
      return this.reports
    }
  }

  // Vote on a report (mark as helpful)
  async voteOnReport(reportId: string, vote: 'up' | 'down'): Promise<void> {
    try {
      if (vote === 'up') {
        const response = await apiService.markReportHelpful(reportId)
        if (response.success) {
          // Update local cache
          const report = this.reports.find(r => r.id === reportId)
          if (report) {
            report.upvotes = response.data.helpfulCount || report.upvotes + 1
          }
        }
      } else {
        // Down vote not implemented in backend yet
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          report.downvotes++
        }
      }
    } catch (error) {
      console.error('Vote on report error:', error)
      throw error
    }
  }

  // Verify a report
  async verifyReport(reportId: string): Promise<void> {
    try {
      const response = await apiService.verifyReport(reportId)
      if (response.success) {
        // Update local cache
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          report.verified = response.data.isVerified || true
        }
      }
    } catch (error) {
      console.error('Verify report error:', error)
      throw error
    }
  }

  // Get single report by ID
  async getReportById(reportId: string): Promise<any> {
    try {
      const response = await apiService.getReportById(reportId)
      if (response.success) {
        return response.data.report
      } else {
        throw new Error(response.message || 'Failed to fetch report')
      }
    } catch (error) {
      console.error('Get report by ID error:', error)
      throw error
    }
  }

  // Add comment to report
  async addComment(reportId: string, comment: Omit<Comment, 'id' | 'timestamp'>): Promise<void> {
    try {
      const response = await apiService.addComment(reportId, comment.text)
      if (response.success) {
        // Update local cache
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          const newComment: Comment = {
            id: response.data.comment._id,
            userId: response.data.comment.user._id || response.data.comment.user,
            username: response.data.comment.user.name || comment.username,
            text: response.data.comment.text,
            timestamp: new Date(response.data.comment.createdAt)
          }
          report.comments.push(newComment)
        }
      }
    } catch (error) {
      console.error('Add comment error:', error)
      // Fallback to local cache
      const report = this.reports.find(r => r.id === reportId)
      if (report) {
        const newComment: Comment = {
          ...comment,
          id: Date.now().toString(),
          timestamp: new Date()
        }
        report.comments.push(newComment)
      }
      throw error
    }
  }

  // Upvote comment
  async upvoteComment(reportId: string, commentId: string): Promise<void> {
    try {
      const response = await apiService.upvoteComment(reportId, commentId)
      if (response.success) {
        // Update local cache
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          const comment = report.comments.find(c => c.id === commentId)
          if (comment) {
            // Update comment with new upvote data from response
            // Note: This will be updated when we integrate with the new Comment interface
          }
        }
      }
    } catch (error) {
      console.error('Upvote comment error:', error)
      throw error
    }
  }

  // Remove upvote from comment
  async removeCommentUpvote(reportId: string, commentId: string): Promise<void> {
    try {
      const response = await apiService.removeCommentUpvote(reportId, commentId)
      if (response.success) {
        // Update local cache
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          const comment = report.comments.find(c => c.id === commentId)
          if (comment) {
            // Update comment with new upvote data from response
            // Note: This will be updated when we integrate with the new Comment interface
          }
        }
      }
    } catch (error) {
      console.error('Remove comment upvote error:', error)
      throw error
    }
  }

  // Delete comment
  async deleteComment(reportId: string, commentId: string): Promise<void> {
    try {
      const response = await apiService.deleteComment(reportId, commentId)
      if (response.success) {
        // Update local cache by removing the comment
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          report.comments = report.comments.filter(c => c.id !== commentId)
        }
      }
    } catch (error) {
      console.error('Delete comment error:', error)
      throw error
    }
  }

  // Add reply to comment
  async addReply(reportId: string, commentId: string, replyData: { text: string; userId: string; username: string }): Promise<void> {
    try {
      const response = await apiService.addReply(reportId, commentId, replyData)
      if (response.success) {
        // Update local cache - for now just reload comments
        // In a more sophisticated implementation, we could update the specific comment
      }
    } catch (error) {
      console.error('Add reply error:', error)
      throw error
    }
  }

  // Delete reply
  async deleteReply(reportId: string, commentId: string, replyId: string): Promise<void> {
    try {
      const response = await apiService.deleteReply(reportId, commentId, replyId)
      if (response.success) {
        // Update local cache by removing the reply
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          const comment = report.comments.find(c => c.id === commentId)
          if (comment && comment.replies) {
            comment.replies = comment.replies.filter(r => r.id !== replyId)
          }
        }
      }
    } catch (error) {
      console.error('Delete reply error:', error)
      throw error
    }
  }

  // Upvote reply
  async upvoteReply(reportId: string, commentId: string, replyId: string): Promise<void> {
    try {
      const response = await apiService.upvoteReply(reportId, commentId, replyId)
      if (response.success) {
        // Update local cache with new upvote data
        const report = this.reports.find(r => r.id === reportId)
        if (report) {
          const comment = report.comments.find(c => c.id === commentId)
          if (comment && comment.replies) {
            const reply = comment.replies.find(r => r.id === replyId)
            if (reply && response.data && response.data.reply) {
              reply.upvoteCount = response.data.reply.upvoteCount
              reply.upvotes = response.data.reply.upvotes
            }
          }
        }
      }
    } catch (error) {
      console.error('Upvote reply error:', error)
      throw error
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

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri
      }
      return null
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
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
