import { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  FlatList, 
  Alert,
  RefreshControl 
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { reportService } from "../services/reportService"

interface MyReportsScreenProps {
  navigation: any
}

interface UserReport {
  id: string
  type: string
  location: string
  date: string
  status: 'Active' | 'Resolved' | 'Pending'
  severity: 'Low' | 'Medium' | 'High'
  description: string
  upvotes: number
  downvotes: number
  comments: number
  image?: string
}

export default function MyReportsScreen({ navigation }: MyReportsScreenProps) {
  const { theme } = useTheme()
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUserReports()
  }, [])

  const loadUserReports = async () => {
    try {
      // For demo purposes, let's create some sample user reports
      // In a real app, you'd filter reports by user ID from the report service
      const sampleUserReports: UserReport[] = [
        {
          id: "user-1",
          type: "Traffic Jam",
          location: "Wuse 2, Abuja",
          date: "2024-01-15",
          status: "Active",
          severity: "Medium",
          description: "Heavy traffic due to road construction on the main road",
          upvotes: 12,
          downvotes: 2,
          comments: 5
        },
        {
          id: "user-2",
          type: "Accident",
          location: "Garki Area 1",
          date: "2024-01-12",
          status: "Resolved",
          severity: "High",
          description: "Minor collision between two vehicles, cleared by authorities",
          upvotes: 8,
          downvotes: 1,
          comments: 3
        },
        {
          id: "user-3",
          type: "Construction",
          location: "Central Business District",
          date: "2024-01-10",
          status: "Active",
          severity: "Low",
          description: "Road maintenance work in progress, expect delays",
          upvotes: 15,
          downvotes: 0,
          comments: 7
        },
        {
          id: "user-4",
          type: "Weather Alert",
          location: "Maitama District",
          date: "2024-01-08",
          status: "Resolved",
          severity: "Medium",
          description: "Heavy rainfall causing flooding on major roads",
          upvotes: 20,
          downvotes: 3,
          comments: 12
        }
      ]

      setUserReports(sampleUserReports)
    } catch (error) {
      console.error("Failed to load user reports:", error)
      Alert.alert("Error", "Failed to load your reports. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadUserReports()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return '#f44336'
      case 'Medium': return '#ff9800'
      case 'Low': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#4CAF50'
      case 'Resolved': return '#9E9E9E'
      case 'Pending': return '#ff9800'
      default: return '#9e9e9e'
    }
  }

  const handleViewReport = (report: UserReport) => {
    // Navigate to ReportDetailsScreen with the report data
    navigation.navigate('ReportDetails', { 
      report: {
        ...report,
        time: report.date,
        image: report.image || null
      }
    })
  }

  const handleEditReport = (report: UserReport) => {
    Alert.alert(
      "Edit Report",
      "What would you like to edit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit Description",
          onPress: () => editReportDescription(report)
        },
        {
          text: "Change Status",
          onPress: () => changeReportStatus(report)
        }
      ]
    )
  }

  const editReportDescription = (report: UserReport) => {
    Alert.prompt(
      "Edit Description",
      "Enter new description:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (newDescription) => {
            if (newDescription && newDescription.trim()) {
              setUserReports(prev =>
                prev.map(r =>
                  r.id === report.id
                    ? { ...r, description: newDescription.trim() }
                    : r
                )
              )
              Alert.alert("Success", "Report description updated successfully")
            }
          }
        }
      ],
      "plain-text",
      report.description
    )
  }

  const changeReportStatus = (report: UserReport) => {
    const statusOptions = ['Active', 'Resolved', 'Pending']
    const currentIndex = statusOptions.indexOf(report.status)
    const otherStatuses = statusOptions.filter(s => s !== report.status)

    Alert.alert(
      "Change Status",
      `Current status: ${report.status}`,
      [
        { text: "Cancel", style: "cancel" },
        ...otherStatuses.map(status => ({
          text: status,
          onPress: () => {
            setUserReports(prev =>
              prev.map(r =>
                r.id === report.id
                  ? { ...r, status: status as 'Active' | 'Resolved' | 'Pending' }
                  : r
              )
            )
            Alert.alert("Success", `Report status changed to ${status}`)
          }
        }))
      ]
    )
  }

  const handleDeleteReport = (report: UserReport) => {
    Alert.alert(
      "Delete Report",
      `Are you sure you want to delete this ${report.type} report?\n\nLocation: ${report.location}\nDate: ${report.date}\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // In a real app, you would call the API to delete the report
              // await reportService.deleteReport(report.id)

              setUserReports(prev => prev.filter(r => r.id !== report.id))
              Alert.alert("Success", "Report deleted successfully")
            } catch (error) {
              Alert.alert("Error", "Failed to delete report. Please try again.")
            }
          }
        }
      ]
    )
  }

  const renderReportItem = ({ item }: { item: UserReport }) => (
    <View style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleSection}>
          <Text style={[styles.reportType, { color: theme.colors.text }]}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.reportActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleViewReport(item)}
          >
            <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleEditReport(item)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleDeleteReport(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.reportDescription, { color: theme.colors.textSecondary }]}>
        {item.description}
      </Text>

      <View style={styles.reportMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.reportStats}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-up" size={16} color={theme.colors.success} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{item.upvotes}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="arrow-down" size={16} color={theme.colors.error} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{item.downvotes}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{item.comments}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color={theme.colors.border} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Reports Yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Your submitted traffic reports will appear here
      </Text>
      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateReport')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Report</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Reports</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateReport')}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your reports...</Text>
        </View>
      ) : userReports.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={userReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reportTitleSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reportType: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  reportActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  reportStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "500",
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: "auto",
  },
  severityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})
