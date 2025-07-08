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

interface Reply {
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
  replies?: Reply[]
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
  const { report } = route.params
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [newReply, setNewReply] = useState("")
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [isDownvoted, setIsDownvoted] = useState(false)
  const [upvotes, setUpvotes] = useState(report.upvotes)
  const [downvotes, setDownvotes] = useState(report.downvotes)
  const [isVoting, setIsVoting] = useState(false)
  const commentInputRef = useRef<TextInput>(null)

  // Alternative routes data (similar to AlertDetailsScreen)
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

  // Load comments when component mounts
  useEffect(() => {
    loadComments()
  }, [report.id])

  const loadComments = async () => {
    if (!report.id) {
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
      const reportData = await reportService.getReportById(report.id)
      if (reportData && reportData.interactions && reportData.interactions.comments) {
        // Transform backend comments to match frontend interface
        const transformedComments = reportData.interactions.comments.map((c: any) => ({
          id: c._id, // Convert _id to id
          user: c.user,
          text: c.text,
          createdAt: c.createdAt,
          upvoteCount: c.upvoteCount || 0,
          upvotes: c.upvotes || [],
          replies: c.replies ? c.replies.map((r: any) => ({
            id: r._id,
            user: r.user,
            text: r.text,
            createdAt: r.createdAt,
            upvoteCount: r.upvoteCount || 0,
            upvotes: r.upvotes || []
          })) : []
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
    if (!report.severity) return '#666'
    switch (report.severity) {
      case 'low': return '#4CAF50'
      case 'medium': return '#ff9800'
      case 'high': return '#f44336'
      case 'critical': return '#d32f2f'
      default: return '#666'
    }
  }

  const getReportIcon = () => {
    const type = report.type?.toLowerCase() || ''
    if (type.includes('crash') || type.includes('accident')) return 'warning'
    if (type.includes('traffic')) return 'car'
    if (type.includes('construction') || type.includes('roadwork')) return 'construct'
    if (type.includes('weather')) return 'rainy'
    return 'information-circle'
  }

  const handleUpvote = async () => {
    if (isVoting) return

    setIsVoting(true)
    try {
      if (isUpvoted) {
        // Remove upvote (not implemented in backend yet, so just update locally)
        setUpvotes(upvotes - 1)
        setIsUpvoted(false)
      } else {
        // Add upvote - use the backend helpful functionality
        if (report.id) {
          await reportService.voteOnReport(report.id, 'up')
        }
        setUpvotes(upvotes + 1)
        setIsUpvoted(true)
        if (isDownvoted) {
          setDownvotes(downvotes - 1)
          setIsDownvoted(false)
        }
      }
    } catch (error) {
      console.error('Error voting on report:', error)
      Alert.alert("Error", "Failed to vote on report. Please try again.")
    } finally {
      setIsVoting(false)
    }
  }

  const handleDownvote = async () => {
    if (isVoting) return

    setIsVoting(true)
    try {
      if (isDownvoted) {
        setDownvotes(downvotes - 1)
        setIsDownvoted(false)
      } else {
        // Downvote functionality (not implemented in backend, so just update locally)
        if (report.id) {
          await reportService.voteOnReport(report.id, 'down')
        }
        setDownvotes(downvotes + 1)
        setIsDownvoted(true)
        if (isUpvoted) {
          setUpvotes(upvotes - 1)
          setIsUpvoted(false)
        }
      }
    } catch (error) {
      console.error('Error voting on report:', error)
      Alert.alert("Error", "Failed to vote on report. Please try again.")
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
      if (report.id) {
        console.log('💬 Adding comment to report:', report.id, 'Comment:', newComment.trim())
        await reportService.addComment(report.id, {
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

  const handleCommentUpvote = async (commentId: string) => {
    try {
      // Get current user info
      const currentUser = userService.getCurrentUser()
      if (!currentUser) {
        Alert.alert("Error", "Please log in to upvote comments")
        return
      }

      if (!report.id) {
        Alert.alert("Error", "Cannot upvote comments on demo reports")
        return
      }

      // Debug logging
      console.log('🔍 Upvoting comment:', {
        reportId: report.id,
        commentId: commentId,
        allComments: comments.map(c => ({ id: c.id, text: c.text }))
      })

      // Check if user has already upvoted this comment
      const comment = comments.find(c => c.id === commentId)
      if (!comment) {
        console.log('❌ Comment not found in local state:', commentId)
        return
      }

      const hasUpvoted = comment.upvotes && comment.upvotes.some(upvote => upvote.user === currentUser.id)

      if (hasUpvoted) {
        // Remove upvote
        await reportService.removeCommentUpvote(report.id, commentId)
        Alert.alert("Success", "Upvote removed!")
      } else {
        // Add upvote
        await reportService.upvoteComment(report.id, commentId)
        Alert.alert("Success", "Comment upvoted!")
      }

      // Reload comments to get updated upvote counts
      await loadComments()
    } catch (error) {
      console.error('Error handling comment upvote:', error)
      Alert.alert("Error", "Failed to update upvote. Please try again.")
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

      if (!report.id) {
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
                await reportService.deleteComment(report.id, commentId)
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

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
    setNewReply("")
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setNewReply("")
  }

  const handleAddReply = async (commentId: string) => {
    if (!newReply.trim()) {
      Alert.alert("Error", "Please enter a reply")
      return
    }

    try {
      // Get current user info
      const currentUser = userService.getCurrentUser()
      if (!currentUser) {
        Alert.alert("Error", "Please log in to add replies")
        return
      }

      if (!report.id) {
        Alert.alert("Error", "Cannot add replies on demo reports")
        return
      }

      await reportService.addReply(report.id, commentId, {
        text: newReply.trim(),
        userId: currentUser.id,
        username: currentUser.username
      })

      setNewReply("")
      setReplyingTo(null)
      Alert.alert("Success", "Reply added successfully!")

      // Reload comments to get updated list with new reply
      await loadComments()
    } catch (error) {
      console.error('Error adding reply:', error)
      Alert.alert("Error", "Failed to add reply. Please try again.")
    }
  }

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    try {
      // Get current user info
      const currentUser = userService.getCurrentUser()
      if (!currentUser) {
        Alert.alert("Error", "Please log in to delete replies")
        return
      }

      if (!report.id) {
        Alert.alert("Error", "Cannot delete replies on demo reports")
        return
      }

      // Show confirmation dialog
      Alert.alert(
        "Delete Reply",
        "Are you sure you want to delete this reply?",
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
                await reportService.deleteReply(report.id, commentId, replyId)
                Alert.alert("Success", "Reply deleted successfully!")
                // Reload comments to get updated list
                await loadComments()
              } catch (error) {
                console.error('Error deleting reply:', error)
                Alert.alert("Error", "Failed to delete reply. Please try again.")
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error handling reply deletion:', error)
      Alert.alert("Error", "Failed to delete reply. Please try again.")
    }
  }

  const handleReplyUpvote = async (commentId: string, replyId: string) => {
    try {
      // Get current user info
      const currentUser = userService.getCurrentUser()
      if (!currentUser) {
        Alert.alert("Error", "Please log in to upvote replies")
        return
      }

      if (!report.id) {
        Alert.alert("Error", "Cannot upvote replies on demo reports")
        return
      }

      await reportService.upvoteReply(report.id, commentId, replyId)
      Alert.alert("Success", "Reply upvoted!")

      // Reload comments to get updated upvote counts
      await loadComments()
    } catch (error) {
      console.error('Error upvoting reply:', error)
      Alert.alert("Error", "Failed to upvote reply. Please try again.")
    }
  }

  const handleShare = async () => {
    try {
      const shareContent = {
        message: `Traffic Alert: ${report.type}\n\n${report.description}\n\nShared via TrafficAlert app`,
        title: "Traffic Alert",
      }

      await Share.share(shareContent)
    } catch (error) {
      Alert.alert("Error", "Failed to share report")
    }
  }

  const handleGetDirections = () => {
    if (report.location) {
      navigation.navigate('Navigation', {
        selectedRoute: {
          id: 'report-route',
          name: 'Route to Report Location',
          duration: report.distance || '10 min',
          distance: report.distance || '5.2 km',
          description: `Navigate to ${report.location.address || 'report location'}`,
          traffic: 'Moderate traffic',
          incidents: 1,
          destination: report.location
        }
      })
    } else {
      Alert.alert("Location Unavailable", "Location information is not available for this report.")
    }
  }

  const handleAvoidArea = () => {
    if (report.location) {
      navigation.navigate('Routes', {
        avoidLocation: report.location,
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

  const renderReply = (reply: Reply, commentId: string) => {
    const currentUser = userService.getCurrentUser()
    const hasUpvoted = currentUser && reply.upvotes && reply.upvotes.some(upvote => upvote.user === currentUser.id)
    const isOwner = currentUser && reply.user._id === currentUser.id

    return (
      <View key={reply.id} style={[styles.replyCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.commentHeader}>
          <UserAvatar
            size={UserAvatarSizes.small}
            backgroundColor={theme.colors.background}
            iconColor={theme.colors.textSecondary}
            userAvatar={reply.user.profilePicture}
            userName={reply.user.name}
          />
          <View style={styles.commentUserInfo}>
            <Text style={[styles.commentUser, { color: theme.colors.text }]}>
              {reply.user.name}
            </Text>
            <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>
              {formatTimeAgo(reply.createdAt)}
            </Text>
          </View>
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={[
                styles.commentUpvote,
                {
                  backgroundColor: hasUpvoted
                    ? theme.colors.success + '40'
                    : theme.colors.success + '20'
                }
              ]}
              onPress={() => handleReplyUpvote(commentId, reply.id)}
            >
              <Ionicons
                name={hasUpvoted ? "thumbs-up" : "thumbs-up-outline"}
                size={14}
                color={theme.colors.success}
              />
              <Text style={[styles.commentUpvoteText, { color: theme.colors.success }]}>
                {reply.upvoteCount || 0}
              </Text>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={[styles.commentDelete, { backgroundColor: theme.colors.error + '20' }]}
                onPress={() => handleDeleteReply(commentId, reply.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={14}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={[styles.replyText, { color: theme.colors.text }]}>{reply.text}</Text>
      </View>
    )
  }

  const renderComment = (comment: Comment) => {
    // Check if current user has upvoted this comment
    const currentUser = userService.getCurrentUser()
    const hasUpvoted = currentUser && comment.upvotes && comment.upvotes.some(upvote => upvote.user === currentUser.id)
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
                  backgroundColor: hasUpvoted
                    ? theme.colors.success + '40'
                    : theme.colors.success + '20'
                }
              ]}
              onPress={() => handleCommentUpvote(comment.id)}
            >
              <Ionicons
                name={hasUpvoted ? "thumbs-up" : "thumbs-up-outline"}
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

        {/* Reply button */}
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => handleReply(comment.id)}
        >
          <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.replyButtonText, { color: theme.colors.textSecondary }]}>
            Reply {comment.replies && comment.replies.length > 0 ? `(${comment.replies.length})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => renderReply(reply, comment.id))}
          </View>
        )}

        {/* Reply input (shown when replying to this comment) */}
        {replyingTo === comment.id && (
          <View style={[styles.replyInputContainer, { borderTopColor: theme.colors.border }]}>
            <TextInput
              style={[styles.replyInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Write a reply..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newReply}
              onChangeText={setNewReply}
              multiline
              maxLength={200}
            />
            <View style={styles.replyInputActions}>
              <TouchableOpacity
                style={[styles.cancelReplyButton, { backgroundColor: theme.colors.error + '20' }]}
                onPress={handleCancelReply}
              >
                <Text style={[styles.cancelReplyText, { color: theme.colors.error }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendReplyButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleAddReply(comment.id)}
              >
                <Ionicons name="send" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
                <Text style={[styles.reportTitle, { color: theme.colors.text }]}>{report.type}</Text>
                <Text style={[styles.reportTime, { color: theme.colors.textSecondary }]}>{report.time}</Text>
              </View>
              {report.severity && (
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
                  <Text style={styles.severityText}>{report.severity.toUpperCase()}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.reportDescription, { color: theme.colors.text }]}>
              {report.description}
            </Text>

            {/* Location and Meta Info */}
            <View style={styles.reportMeta}>
              {report.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    {report.location.address || `${report.location.latitude}, ${report.location.longitude}`}
                  </Text>
                </View>
              )}
              {report.estimatedClearTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    Est. clear: {report.estimatedClearTime}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Map */}
          {report.location && (
            <View style={styles.mapContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location</Text>
              <MapComponent
                location={report.location}
                reports={[]}
                showUserLocation={false}
                followUserLocation={false}
                style={styles.map}
              />
            </View>
          )}

          {/* Report Images */}
          {report.images && report.images.length > 0 && (
            <View style={styles.imageSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Report Image{report.images.length > 1 ? 's' : ''}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {report.images.map((imageUrl: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.imageWrapper,
                      index === report.images.length - 1 ? { marginRight: 0 } : {}
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
                  isUpvoted && styles.voteButtonUpvoted,
                  isVoting && styles.voteButtonDisabled
                ]}
                onPress={handleUpvote}
                disabled={isVoting}
              >
                <Ionicons
                  name="arrow-up"
                  size={24}
                  color={isUpvoted ? "#fff" : theme.colors.success}
                />
                <Text style={[styles.voteText, { color: isUpvoted ? "#fff" : theme.colors.textSecondary }]}>
                  {upvotes} Upvotes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  isDownvoted && styles.voteButtonDownvoted,
                  isVoting && styles.voteButtonDisabled
                ]}
                onPress={handleDownvote}
                disabled={isVoting}
              >
                <Ionicons
                  name="arrow-down"
                  size={24}
                  color={isDownvoted ? "#fff" : theme.colors.error}
                />
                <Text style={[styles.voteText, { color: isDownvoted ? "#fff" : theme.colors.textSecondary }]}>
                  {downvotes} Downvotes
                </Text>
              </TouchableOpacity>
            </View>
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
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 44,
    marginTop: 8,
    paddingVertical: 4,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 12,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#E0E0E0",
  },
  replyCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  replyText: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 36,
    marginTop: 4,
  },
  replyInputContainer: {
    marginTop: 12,
    marginLeft: 20,
    padding: 12,
    borderTopWidth: 1,
    borderRadius: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    maxHeight: 80,
    marginBottom: 8,
  },
  replyInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelReplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelReplyText: {
    fontSize: 12,
    fontWeight: "500",
  },
  sendReplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
})
