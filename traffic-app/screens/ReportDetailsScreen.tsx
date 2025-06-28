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
  const commentInputRef = useRef<TextInput>(null)

  const handleUpvote = () => {
    if (isUpvoted) {
      setUpvotes(upvotes - 1)
      setIsUpvoted(false)
    } else {
      setUpvotes(upvotes + 1)
      setIsUpvoted(true)
      if (isDownvoted) {
        setDownvotes(downvotes - 1)
        setIsDownvoted(false)
      }
    }
  }

  const handleDownvote = () => {
    if (isDownvoted) {
      setDownvotes(downvotes - 1)
      setIsDownvoted(false)
    } else {
      setDownvotes(downvotes + 1)
      setIsDownvoted(true)
      if (isUpvoted) {
        setUpvotes(upvotes - 1)
        setIsUpvoted(false)
      }
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment")
      return
    }

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

  const renderComment = (comment: typeof dummyComments[0]) => (
    <View key={comment.id} style={[styles.commentItem, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.commentHeader}>
        <Ionicons name={comment.avatar as any} size={32} color={theme.colors.textSecondary} />
        <View style={styles.commentUserInfo}>
          <Text style={[styles.commentUser, { color: theme.colors.text }]}>{comment.user}</Text>
          <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>{comment.time}</Text>
        </View>
        <TouchableOpacity style={styles.commentUpvote}>
          <Ionicons name="arrow-up" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.commentUpvoteText, { color: theme.colors.textSecondary }]}>{comment.upvotes}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.commentText, { color: theme.colors.textSecondary }]}>{comment.comment}</Text>
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
          {/* Report Details */}
          <View style={[styles.reportCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {report.image && <Image source={{ uri: report.image }} style={styles.reportImage} />}
            
            <View style={styles.reportContent}>
              <View style={styles.reportHeader}>
                <Ionicons name="person-circle-outline" size={24} color={theme.colors.textSecondary} />
                <Text style={[styles.reportType, { color: theme.colors.text }]}>{report.type}</Text>
                <Text style={[styles.reportTime, { color: theme.colors.textSecondary }]}>{report.time}</Text>
              </View>

              <Text style={[styles.reportDescription, { color: theme.colors.textSecondary }]}>
                {report.description}
              </Text>

              <View style={styles.reportActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, isUpvoted && styles.actionButtonActive]} 
                  onPress={handleUpvote}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={20} 
                    color={isUpvoted ? theme.colors.primary : theme.colors.success} 
                  />
                  <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{upvotes}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, isDownvoted && styles.actionButtonActive]} 
                  onPress={handleDownvote}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={20} 
                    color={isDownvoted ? theme.colors.primary : theme.colors.error} 
                  />
                  <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{downvotes}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{comments.length}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={[styles.commentsSection, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.commentsTitle, { color: theme.colors.text }]}>
              Comments ({comments.length})
            </Text>
            
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
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  reportImage: {
    width: "100%",
    height: 200,
  },
  reportContent: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reportType: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  reportTime: {
    fontSize: 12,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  reportActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
  actionButtonActive: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  commentsSection: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  commentUpvoteText: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
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
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
})
