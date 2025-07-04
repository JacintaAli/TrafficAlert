"use client"

import { useState, useRef } from "react"
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
import MapComponent from "../components/MapComponent"

interface ReportDetailsScreenProps {
  navigation: any
  route: any
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
  const [comments, setComments] = useState(dummyComments)
  const [newComment, setNewComment] = useState("")
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
      // Try to add comment via backend if report has an ID
      if (report.id) {
        await reportService.addComment(report.id, {
          text: newComment.trim(),
          userId: "current-user-id", // This will be replaced by backend with actual user ID
          username: "You" // This will be replaced by backend with actual user info
        })
      }

      // Add comment to local state
      const comment = {
        id: Date.now().toString(),
        user: "You",
        avatar: "person-circle",
        comment: newComment.trim(),
        time: "now",
        upvotes: 0,
      }

      setComments([comment, ...comments])
      setNewComment("")
      commentInputRef.current?.blur()
      Alert.alert("Success", "Comment added successfully!")
    } catch (error) {
      console.error('Error adding comment:', error)
      Alert.alert("Error", "Failed to add comment. Please try again.")
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

  const renderComment = (comment: typeof dummyComments[0]) => (
    <View key={comment.id} style={[styles.commentCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.commentHeader}>
        <Ionicons name={comment.avatar as any} size={32} color={theme.colors.textSecondary} />
        <View style={styles.commentUserInfo}>
          <Text style={[styles.commentUser, { color: theme.colors.text }]}>{comment.user}</Text>
          <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>{comment.time}</Text>
        </View>
        <TouchableOpacity style={[styles.commentUpvote, { backgroundColor: theme.colors.success + '20' }]}>
          <Ionicons name="thumbs-up" size={16} color={theme.colors.success} />
          <Text style={[styles.commentUpvoteText, { color: theme.colors.success }]}>{comment.upvotes}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.commentText, { color: theme.colors.text }]}>{comment.comment}</Text>
    </View>
  )

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

          {/* Report Image */}
          {report.image && (
            <View style={styles.imageSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Report Image</Text>
              <Image source={{ uri: report.image }} style={styles.reportImage} />
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

            {comments.map(renderComment)}
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
  reportImage: {
    width: "100%",
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
})
