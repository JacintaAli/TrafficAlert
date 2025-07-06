import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Image, Share, Alert, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { reportService } from "../services/reportService"
import UserAvatar, { UserAvatarSizes } from "../components/UserAvatar"

interface AllReportsScreenProps {
  navigation: any
}

export default function AllReportsScreen({ navigation }: AllReportsScreenProps) {
  const { theme } = useTheme()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      console.log('📋 AllReportsScreen: Loading reports from backend...')
      const backendReports = await reportService.getAllReports()
      console.log('📋 AllReportsScreen: Loaded', backendReports.length, 'reports')
      setReports(backendReports)
    } catch (error) {
      console.error('📋 AllReportsScreen: Error loading reports:', error)
      // Don't show error alert, just use empty array
      setReports([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadReports()
  }

  const handleShare = async (report: any) => {
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

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const renderReportItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate("ReportDetails", { report: item })}
      activeOpacity={0.7}
    >
      {item.images && item.images.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.reportImage} />
      )}

      <View style={styles.reportContent}>
        <View style={styles.reportHeader}>
          <UserAvatar
            size={UserAvatarSizes.small}
            backgroundColor={theme.colors.surface}
            iconColor={theme.colors.textSecondary}
            userAvatar={item.user?.profilePicture || null}
            userName={item.user?.name || 'Anonymous'}
          />
          <View style={styles.reportHeaderText}>
            <Text style={[styles.reportUser, { color: theme.colors.textSecondary }]}>
              {item.user?.name || 'Anonymous'}
            </Text>
            <Text style={[styles.reportType, { color: theme.colors.text }]}>{item.type}</Text>
          </View>
          <Text style={[styles.reportTime, { color: theme.colors.textSecondary }]}>
            {formatTimeAgo(item.timestamp)}
          </Text>
        </View>

        <Text style={[styles.reportDescription, { color: theme.colors.textSecondary }]}>{item.description}</Text>

        <TouchableOpacity
          style={styles.viewCommentsButton}
          onPress={() => navigation.navigate("ReportDetails", { report: item })}
        >
          <Text style={[styles.viewCommentsText, { color: theme.colors.primary }]}>
            View all {item.comments?.length || 0} comments
          </Text>
        </TouchableOpacity>

        <View style={styles.reportActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              // Handle upvote action here if needed
            }}
          >
            <Ionicons name="arrow-up" size={20} color={theme.colors.success} />
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{item.upvotes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              // Handle downvote action here if needed
            }}
          >
            <Ionicons name="arrow-down" size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{item.downvotes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate("ReportDetails", { report: item });
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleShare(item);
            }}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>All Reports</Text>
        <View style={{ width: 24 }} />
      </View> */}

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <Text style={[styles.searchPlaceholder, { color: theme.colors.textSecondary }]}>Ademola Adetokunbo Cresent, Wuse 2,...</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading reports...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={theme.colors.border} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Reports Yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Be the first to report traffic incidents in your area
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
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
  list: {
    flex: 1,
  },
  reportItem: {
    backgroundColor: "#fff",
    marginBottom: 1,
    paddingBottom: 16,
  },
  reportImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
  },
  reportContent: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reportHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  reportUser: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  reportType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  reportTime: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  viewCommentsButton: {
    marginBottom: 12,
  },
  viewCommentsText: {
    fontSize: 12,
    color: "#666",
  },
  reportActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
})
