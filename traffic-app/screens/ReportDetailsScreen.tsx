"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { reportService } from "../services/reportService"
import { userService } from "../services/userService"
import UserAvatar, { UserAvatarSizes } from "../components/UserAvatar"
import MapComponent from "../components/MapComponent"

interface ReportDetailsScreenProps {
  navigation: any
  route: any
}

interface Comment {
  id: string
  user: {
    _id: string
    name: string
    profilePicture?: string
  }
  text: string
  createdAt: string
  upvoteCount: number
  upvotes: Array<{
    user: string
    votedAt: string
  }>
}

// Dummy comments data
const dummyComments = [
  {
    id: "1",
    user: "TrafficWatcher",
    avatar: "person-circle",
    comment: "Still ongoing, avoid this area. Traffic is backed up for about 2km.",
    time: "1h ago",
    upvotes: 5,
  },
  {
    id: "2", 
    user: "RoadUser123",
    avatar: "person-circle",
    comment: "Thanks for the update! Taking alternative route via Garki.",
    time: "45m ago",
    upvotes: 2,
  },
  {
    id: "3",
    user: "CommutePro",
    avatar: "person-circle", 
    comment: "Police are on scene now. Should clear up soon.",
    time: "30m ago",
    upvotes: 8,
  },
  {
    id: "4",
    user: "DailyDriver",
    avatar: "person-circle",
    comment: "Can confirm - just passed by. One lane is open now.",
    time: "15m ago", 
    upvotes: 3,
  }
]

export default function ReportDetailsScreen({ navigation, route }: ReportDetailsScreenProps) {
  const { theme } = useTheme()
  const { report, reportId } = route.params

  // State for fetched report data
  const [reportData, setReportData] = useState<any>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isDisputed, setIsDisputed] = useState(false)
  const [verifications, setVerifications] = useState(0)
  const [disputes, setDisputes] = useState(0)
  const [isVoting, setIsVoting] = useState(false)
  const commentInputRef = useRef<TextInput>(null)



  // Load comments when component mounts
  // Initialize report data and load comments
  useEffect(() => {
    initializeReport()
  }, [])

  useEffect(() => {
    if (reportData) {
      // Initialize vote counts when report data is available
      setVerifications(reportData.upvotes || reportData.upvoteCount || 0)
      setDisputes(reportData.downvotes || reportData.downvoteCount || 0)

      // Initialize user's vote state based on backend data
      initializeUserVoteState()

      loadComments()
    }
  }, [reportData])

  const initializeUserVoteState = () => {
    const currentUser = userService.getCurrentUser()
    if (!currentUser || !reportData) {
      setIsVerified(false)
      setIsDisputed(false)
      return
    }

    // Check if user has voted on this report
    // For helpful votes, check the interactions.helpful array
    const hasVerified = reportData.interactions?.helpful?.some((vote: any) =>
      vote.user === currentUser.id || vote.user._id === currentUser.id
    ) || false

    // For dispute votes, check the interactions.disputes array
    const hasDisputed = reportData.interactions?.disputes?.some((vote: any) =>
      vote.user === currentUser.id || vote.user._id === currentUser.id
    ) || false

    setIsVerified(hasVerified)
    setIsDisputed(hasDisputed)
  }

  const initializeReport = async () => {
    if (report) {
      // If we have a complete report object, use it directly
      setReportData(report)
    } else if (reportId) {
      // If we only have reportId, fetch the report using getAllReports and find by ID
      // This ensures we get the EXACT same format as AllReportsScreen
      setLoadingReport(true)
      try {
        console.log('🔍 Fetching report by ID using getAllReports:', reportId)
        const allReports = await reportService.getAllReports()
        const foundReport = allReports.find(report => report.id === reportId)

        if (foundReport) {
          console.log('✅ Found report in getAllReports:', foundReport)
          setReportData(foundReport)
        } else {
          console.log('❌ Report not found in getAllReports, trying getReportById...')
          // Fallback to getReportById if not found in getAllReports
          const fetchedReport = await reportService.getReportById(reportId)
          console.log('✅ Fetched report via getReportById:', fetchedReport)

          // Transform backend report to match EXACT same format as getAllReports()
          const transformedReport = {
            id: fetchedReport._id,
            type: fetchedReport.type,
            latitude: fetchedReport.latitude || fetchedReport.location?.coordinates?.[1],
            longitude: fetchedReport.longitude || fetchedReport.location?.coordinates?.[0],
            description: fetchedReport.description,
            severity: fetchedReport.severity,
            images: fetchedReport.images?.map((img: any) => img.url || img) || [],
            timestamp: new Date(fetchedReport.createdAt),
            userId: fetchedReport.user?._id || fetchedReport.user,
            // Preserve full user data for display (same as getAllReports)
            user: typeof fetchedReport.user === 'object' ? {
              _id: fetchedReport.user._id,
              name: fetchedReport.user.name,
              profilePicture: fetchedReport.user.profilePicture
            } : null,
            verified: fetchedReport.verification?.isVerified || false,
            upvotes: fetchedReport.interactions?.helpfulCount || 0,
            downvotes: fetchedReport.interactions?.disputeCount || 0,
            // Include full interactions data for vote checking
            interactions: fetchedReport.interactions,
            comments: fetchedReport.interactions?.comments?.map((comment: any) => ({
              id: comment._id,
              userId: comment.user._id || comment.user,
              username: comment.user.name || 'Unknown',
              text: comment.text,
              timestamp: new Date(comment.createdAt)
            })) || [],
            expiresAt: new Date(fetchedReport.expiresAt)
          }

          setReportData(transformedReport)
        }
      } catch (error) {
        console.error('❌ Error fetching report:', error)
        // Create fallback report data
        setReportData({
          id: reportId,
          type: 'Unknown Report',
          description: 'Unable to load report details. Please try again.',
          upvotes: 0,
          downvotes: 0,
          comments: 0,
          time: 'Unknown',
          location: { latitude: 0, longitude: 0, address: 'Unknown' },
          severity: 'medium',
          image: null,
          images: []
        })
      } finally {
        setLoadingReport(false)
      }
    } else {
      // No report or reportId provided
      console.error('❌ No report or reportId provided to ReportDetailsScreen')
      setReportData({
        id: 'unknown',
        type: 'Error',
        description: 'No report data available',
        upvotes: 0,
        downvotes: 0,
        comments: 0,
        time: 'Unknown',
        location: { latitude: 0, longitude: 0, address: 'Unknown' },
        severity: 'medium',
        image: null,
        images: []
      })
    }
  }

  const loadComments = async () => {
    if (!reportData.id) {
      // If no report ID, fall back to dummy comments for demo
      setComments(dummyComments.map(comment => ({
        id: comment.id,
        user: {
          _id: 'dummy-user',
          name: comment.user,
          profilePicture: undefined
        },
        text: comment.comment,
        createdAt: comment.time,
        upvoteCount: comment.upvotes || 0,
        upvotes: []
      })))
      setLoadingComments(false)
      return
    }

    try {
      setLoadingComments(true)
      const fetchedReportData = await reportService.getReportById(reportData.id)
      if (fetchedReportData && fetchedReportData.interactions && fetchedReportData.interactions.comments) {
        // Transform backend comments to match frontend interface
        const transformedComments = fetchedReportData.interactions.comments.map((c: any) => ({
          id: c._id, // Convert _id to id
          user: c.user,
          text: c.text,
          createdAt: c.createdAt,
          upvoteCount: c.upvoteCount || 0,
          upvotes: c.upvotes || []
        }))
        console.log('📝 Loaded comments:', transformedComments.map((c: any) => ({ id: c.id, text: c.text })))
        setComments(transformedComments)
      } else {
        console.log('📝 No comments found in report data')
        setComments([])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      // Fall back to dummy comments on error
      setComments(dummyComments.map(comment => ({
        id: comment.id,
        user: {
          _id: 'dummy-user',
          name: comment.user,
          profilePicture: undefined
        },
        text: comment.comment,
        createdAt: comment.time,
        upvoteCount: comment.upvotes || 0,
        upvotes: []
      })))
    } finally {
      setLoadingComments(false)
    }
  }

  const getSeverityColor = () => {
    if (!reportData.severity) return '#666'
    switch (reportData.severity) {
      case 'low': return '#4CAF50'
      case 'medium': return '#ff9800'
      case 'high': return '#f44336'
      case 'critical': return '#d32f2f'
      default: return '#666'
    }
  }

  const getReportIcon = () => {
    const type = reportData.type?.toLowerCase() || ''
    if (type.includes('crash') || type.includes('accident')) return 'warning'
    if (type.includes('traffic')) return 'car'
    if (type.includes('construction') || type.includes('roadwork')) return 'construct'
    if (type.includes('weather')) return 'rainy'
    return 'information-circle'
  }

  const handleVerify = async () => {
    if (isVoting) return

    const currentUser = userService.getCurrentUser()
    if (!currentUser) {
      Alert.alert("Error", "Please log in to verify reports")
      return
    }

    setIsVoting(true)
    try {
      if (isVerified) {
        // Remove verification
        if (reportData.id) {
          const response = await reportService.removeVoteOnReport(reportData.id, 'up')
          if (response.success) {
            setVerifications(response.data.helpfulCount || Math.max(0, verifications - 1))
            setIsVerified(false)
          }
        }
      } else {
        // Add verification - this will automatically remove dispute vote if exists
        if (reportData.id) {
          const response = await reportService.voteOnReport(reportData.id, 'up')
          if (response.success) {
            setVerifications(response.data.helpfulCount || verifications + 1)
            setIsVerified(true)

            // Update dispute count if it was affected by mutual exclusivity
            if (response.data.disputeCount !== undefined) {
              setDisputes(response.data.disputeCount)
              setIsDisputed(false)
            } else if (isDisputed) {
              // Fallback: if backend doesn't return dispute count, manually update
              setDisputes(Math.max(0, disputes - 1))
              setIsDisputed(false)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error verifying report:', error)
      Alert.alert("Error", "Failed to verify report. Please try again.")
    } finally {
      setIsVoting(false)
    }
  }

  const handleDispute = async () => {
    if (isVoting) return

    const currentUser = userService.getCurrentUser()
    if (!currentUser) {
      Alert.alert("Error", "Please log in to dispute reports")
      return
    }

    setIsVoting(true)
    try {
      if (isDisputed) {
        // Remove dispute
        if (reportData.id) {
          const response = await reportService.removeVoteOnReport(reportData.id, 'down')
          if (response.success) {
            setDisputes(response.data.disputeCount || Math.max(0, disputes - 1))
            setIsDisputed(false)
          }
        }
      } else {
        // Add dispute - this will automatically remove helpful vote if exists
        if (reportData.id) {
          const response = await reportService.voteOnReport(reportData.id, 'down')
          if (response.success) {
            setDisputes(response.data.disputeCount || disputes + 1)
            setIsDisputed(true)

            // Update helpful count if it was affected by mutual exclusivity
            if (response.data.helpfulCount !== undefined) {
              setVerifications(response.data.helpfulCount)
              setIsVerified(false)
            } else if (isVerified) {
              // Fallback: if backend doesn't return helpful count, manually update
              setVerifications(Math.max(0, verifications - 1))
              setIsVerified(false)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error disputing report:', error)
      Alert.alert("Error", "Failed to dispute report. Please try again.")
    } finally {
      setIsVoting(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment")
      return
    }

    try {
      // Get current user info
      const currentUser = userService.getCurrentUser()
      if (!currentUser) {
        Alert.alert("Error", "Please log in to add comments")
        return
      }

      // Try to add comment via backend if report has an ID
      if (reportData.id) {
        console.log('💬 Adding comment to report:', reportData.id, 'Comment:', newComment.trim())
        await reportService.addComment(reportData.id, {
          text: newComment.trim(),
          userId: currentUser.id,
          username: currentUser.username
        })

        // Reload comments to get the updated list from backend
        await loadComments()
      } else {
        // Add comment to local state for demo reports
        const comment: Comment = {
          id: Date.now().toString(),
          user: {
            _id: currentUser.id,
            name: currentUser.username,
            profilePicture: currentUser.avatar
          },
          text: newComment.trim(),
          createdAt: new Date().toISOString(),
          upvoteCount: 0,
          upvotes: []
        }

        setComments([comment, ...comments])
      }

      setNewComment("")
      commentInputRef.current?.blur()
      Alert.alert("Success", "Comment added successfully!")
    } catch (error) {
      console.error('Error adding comment:', error)
      Alert.alert("Error", "Failed to add comment. Please try again.")
    }
  }

  const handleCommentVerify = async (commentId: string) => {
    try {
      // Get current user info
      const currentUser = userService.getCurrentUser()
      if (!currentUser) {
        Alert.alert("Error", "Please log in to verify comments")
        return
      }

      if (!reportData.id) {
        Alert.alert("Error", "Cannot verify comments on demo reports")
        return
      }

      // Debug logging
      console.log('🔍 Verifying comment:', {
        reportId: reportData.id,
        commentId: commentId,
        allComments: comments.map(c => ({ id: c.id, text: c.text }))
      })

      // Check if user has already verified this comment
      const comment = comments.find(c => c.id === commentId)
      if (!comment) {
        console.log('❌ Comment not found in local state:', commentId)
        return
      }

      const hasVerified = comment.upvotes && comment.upvotes.some(upvote => upvote.user === currentUser.id)

      if (hasVerified) {
        // Remove verification
        await reportService.removeCommentUpvote(reportData.id, commentId)
        Alert.alert("Success", "Verification removed!")
      } else {
        // Add verification
        await reportService.upvoteComment(reportData.id, commentId)
        Alert.alert("Success", "Comment verified!")
      }

      // Reload comments to get updated verification counts
      await loadComments()
    } catch (error) {
      console.error('Error handling comment verification:', error)
      Alert.alert("Error", "Failed to update verification. Please try again.")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      // Get current user info
      const currentUser = userService.getCurrentUser()
      if (!currentUser) {
        Alert.alert("Error", "Please log in to delete comments")
        return
      }

      if (!reportData.id) {
        Alert.alert("Error", "Cannot delete comments on demo reports")
        return
      }

      // Find the comment to check ownership
      const comment = comments.find(c => c.id === commentId)
      if (!comment) {
        Alert.alert("Error", "Comment not found")
        return
      }

      // Check if user owns this comment
      if (comment.user._id !== currentUser.id) {
        Alert.alert("Error", "You can only delete your own comments")
        return
      }

      // Show confirmation dialog
      Alert.alert(
        "Delete Comment",
        "Are you sure you want to delete this comment?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await reportService.deleteComment(reportData.id, commentId)
                Alert.alert("Success", "Comment deleted successfully!")
                // Reload comments to get updated list
                await loadComments()
              } catch (error) {
                console.error('Error deleting comment:', error)
                Alert.alert("Error", "Failed to delete comment. Please try again.")
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error handling comment deletion:', error)
      Alert.alert("Error", "Failed to delete comment. Please try again.")
    }
  }



  const handleShare = async () => {
    try {
      const shareContent = {
        message: `Traffic Alert: ${reportData.type}\n\n${reportData.description}\n\nShared via TrafficAlert app`,
        title: "Traffic Alert",
      }

      await Share.share(shareContent)
    } catch (error) {
      Alert.alert("Error", "Failed to share report")
    }
  }

  const handleGetDirections = () => {
    if (reportData.location) {
      navigation.navigate('Navigation', {
        selectedRoute: {
          id: 'report-route',
          name: 'Route to Report Location',
          duration: reportData.distance || '10 min',
          distance: reportData.distance || '5.2 km',
          description: `Navigate to ${reportData.location.address || 'report location'}`,
          traffic: 'Moderate traffic',
          incidents: 1,
          destination: reportData.location
        }
      })
    } else {
      Alert.alert("Location Unavailable", "Location information is not available for this report.")
    }
  }

  const handleAvoidArea = () => {
    if (reportData.location) {
      navigation.navigate('Routes', {
        avoidLocation: reportData.location,
        avoidRadius: 2000 // 2km radius
      })
    } else {
      Alert.alert("Location Unavailable", "Cannot avoid area without location information.")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      if (diffInSeconds < 60) return 'now'
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    } catch {
      return dateString // fallback to original string if parsing fails
    }
  }



  const renderComment = (comment: Comment) => {
    // Check if current user has verified this comment
    const currentUser = userService.getCurrentUser()
    const hasVerified = currentUser && comment.upvotes && comment.upvotes.some(upvote => upvote.user === currentUser.id)
    const isOwner = currentUser && comment.user._id === currentUser.id

    return (
      <View key={comment.id} style={[styles.commentCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.commentHeader}>
          <UserAvatar
            size={UserAvatarSizes.medium}
            backgroundColor={theme.colors.background}
            iconColor={theme.colors.textSecondary}
            userAvatar={comment.user.profilePicture}
            userName={comment.user.name}
          />
          <View style={styles.commentUserInfo}>
            <Text style={[styles.commentUser, { color: theme.colors.text }]}>
              {comment.user.name}
            </Text>
            <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>
              {formatTimeAgo(comment.createdAt)}
            </Text>
          </View>
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={[
                styles.commentUpvote,
                {
                  backgroundColor: hasVerified
                    ? theme.colors.success + '40'
                    : theme.colors.success + '20'
                }
              ]}
              onPress={() => handleCommentVerify(comment.id)}
            >
              <Ionicons
                name={hasVerified ? "checkmark-circle" : "checkmark-circle-outline"}
                size={16}
                color={theme.colors.success}
              />
              <Text style={[styles.commentUpvoteText, { color: theme.colors.success }]}>
                {comment.upvoteCount || 0}
              </Text>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={[styles.commentDelete, { backgroundColor: theme.colors.error + '20' }]}
                onPress={() => handleDeleteComment(comment.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={[styles.commentText, { color: theme.colors.text }]}>{comment.text}</Text>
      </View>
    )
  }

  // Show loading screen while fetching report
  if (loadingReport || !reportData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Report Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.reportLoadingContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.reportLoadingText, { color: theme.colors.text }]}>Loading report...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Report Details</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Enhanced Report Info Card */}
          <View style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.reportHeader}>
              <View style={[styles.reportIcon, { backgroundColor: getSeverityColor() }]}>
                <Ionicons name={getReportIcon() as any} size={24} color="#fff" />
              </View>
              <View style={styles.reportInfo}>
                <Text style={[styles.reportTitle, { color: theme.colors.text }]}>{reportData.type}</Text>
                <Text style={[styles.reportTime, { color: theme.colors.textSecondary }]}>{reportData.time}</Text>
              </View>
              {reportData.severity && (
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
                  <Text style={styles.severityText}>{reportData.severity.toUpperCase()}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.reportDescription, { color: theme.colors.text }]}>
              {reportData.description}
            </Text>

            {/* Location and Meta Info */}
            <View style={styles.reportMeta}>
              {reportData.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    {reportData.location.address || `${reportData.location.latitude}, ${reportData.location.longitude}`}
                  </Text>
                </View>
              )}
              {reportData.estimatedClearTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    Est. clear: {reportData.estimatedClearTime}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Map */}
          {reportData.location && (
            <View style={styles.mapContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location</Text>
              <MapComponent
                location={reportData.location}
                reports={[]}
                showUserLocation={false}
                followUserLocation={false}
                style={styles.map}
              />
            </View>
          )}

          {/* Report Images */}
          {reportData.images && reportData.images.length > 0 && (
            <View style={styles.imageSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Report Image{reportData.images.length > 1 ? 's' : ''}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {reportData.images.map((imageUrl: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.imageWrapper,
                      index === reportData.images.length - 1 ? { marginRight: 0 } : {}
                    ]}
                    onPress={() => {
                      // TODO: Add image viewer/zoom functionality
                      Alert.alert("Image", "Image viewer coming soon!")
                    }}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.reportImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleGetDirections}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
              onPress={handleAvoidArea}
            >
              <Ionicons name="return-up-back" size={20} color={theme.colors.text} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Avoid Area</Text>
            </TouchableOpacity>
          </View>

          {/* Voting Section */}
          <View style={[styles.votingSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Community Feedback</Text>
            <View style={styles.votingActions}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  isVerified && styles.voteButtonUpvoted,
                  isVoting && styles.voteButtonDisabled
                ]}
                onPress={handleVerify}
                disabled={isVoting}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={isVerified ? "#fff" : theme.colors.success}
                />
                <Text style={[styles.voteText, { color: isVerified ? "#fff" : theme.colors.textSecondary }]}>
                  {verifications} Verify
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  isDisputed && styles.voteButtonDownvoted,
                  isVoting && styles.voteButtonDisabled
                ]}
                onPress={handleDispute}
                disabled={isVoting}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={isDisputed ? "#fff" : theme.colors.error}
                />
                <Text style={[styles.voteText, { color: isDisputed ? "#fff" : theme.colors.textSecondary }]}>
                  {disputes} Dispute
                </Text>
              </TouchableOpacity>
            </View>
          </View>



          {/* Comments Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Comments ({comments.length})
              </Text>
              <TouchableOpacity
                onPress={() => commentInputRef.current?.focus()}
                style={styles.addCommentButton}
              >
                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading comments...</Text>
              </View>
            ) : comments.length > 0 ? (
              comments.map(renderComment)
            ) : (
              <View style={styles.emptyCommentsContainer}>
                <Text style={[styles.emptyCommentsText, { color: theme.colors.textSecondary }]}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Comment Input */}
        <View style={[styles.commentInputContainer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
          <TextInput
            ref={commentInputRef}
            style={[styles.commentInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Add a comment..."
            placeholderTextColor={theme.colors.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleAddComment}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  reportCard: {
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportContent: {
    padding: 20,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  reportTime: {
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
  reportDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  reportMeta: {
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
  map: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  imageSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: "row",
  },
  imageWrapper: {
    marginRight: 12,
  },
  reportImage: {
    width: 250,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  votingSection: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  votingActions: {
    flexDirection: "row",
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  voteButtonUpvoted: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  voteButtonDownvoted: {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
  },
  voteButtonDisabled: {
    opacity: 0.6,
  },
  voteText: {
    fontSize: 14,
    fontWeight: "600",
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },


  addCommentButton: {
    padding: 4,
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
    alignItems: "center",
    marginBottom: 8,
  },
  commentUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 12,
    marginTop: 2,
  },
  commentUpvote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commentUpvoteText: {
    fontSize: 12,
    fontWeight: "600",
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentDelete: {
    padding: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 14,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  emptyCommentsContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyCommentsText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },

  reportLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  reportLoadingText: {
    fontSize: 16,
    textAlign: "center",
  },
})
