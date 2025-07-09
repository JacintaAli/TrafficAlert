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
  location: {
    latitude: number
    longitude: number
    address?: string
  }
  date: string
  status: 'active' | 'resolved' | 'expired' | 'flagged'
  severity: 'low' | 'medium' | 'high'
  description: string
  verifications: number
  disputes: number
  comments: number
  images?: string[]
  timestamp: Date
  expiresAt?: Date
  verified: boolean
  user?: {
    id: string
    name: string
    profilePicture?: string
  }
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
      console.log('📋 MyReportsScreen: Loading user reports from backend...')
      const backendReports = await reportService.getUserReports(1, 50) // Get up to 50 reports

      // Convert backend reports to UserReport format
      const convertedReports: UserReport[] = backendReports.map(report => ({
        id: report.id,
        type: report.type.charAt(0).toUpperCase() + report.type.slice(1), // Capitalize first letter
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          address: report.user?.name ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` : 'Unknown Location'
        },
        date: report.timestamp.toISOString().split('T')[0], // Format as YYYY-MM-DD
        status: report.status || 'active',
        severity: report.severity || 'medium',
        description: report.description,
        verifications: report.upvotes || 0,
        disputes: report.downvotes || 0,
        comments: report.comments?.length || 0,
        images: report.images || [],
        timestamp: report.timestamp,
        expiresAt: report.expiresAt,
        verified: report.verified || false,
        user: report.user
      }))

      console.log('📋 MyReportsScreen: Loaded', convertedReports.length, 'user reports')
      setUserReports(convertedReports)
    } catch (error) {
      console.error("📋 MyReportsScreen: Failed to load user reports:", error)
      Alert.alert("Error", "Failed to load your reports. Please try again.")
      // Set empty array on error
      setUserReports([])
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
    switch (severity.toLowerCase()) {
      case 'high': return '#f44336'
      case 'medium': return '#ff9800'
      case 'low': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#4CAF50'
      case 'resolved': return '#9E9E9E'
      case 'expired': return '#757575'
      case 'flagged': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  const handleViewReport = (report: UserReport) => {
    // Navigate to ReportDetailsScreen with the report data
    navigation.navigate('ReportDetails', {
      report: {
        id: report.id,
        type: report.type,
        description: report.description,
        images: report.images || [],
        comments: report.comments,
        upvotes: report.verifications,
        downvotes: report.disputes,
        time: report.date,
        location: report.location,
        severity: report.severity,
        verified: report.verified,
        user: report.user,
        timestamp: report.timestamp,
        expiresAt: report.expiresAt,
        status: report.status
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
          text: "Change Severity",
          onPress: () => changeReportSeverity(report)
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
          onPress: async (newDescription) => {
            if (newDescription && newDescription.trim()) {
              try {
                await reportService.updateReport(report.id, {
                  description: newDescription.trim()
                })

                // Update local state
                setUserReports(prev =>
                  prev.map(r =>
                    r.id === report.id
                      ? { ...r, description: newDescription.trim() }
                      : r
                  )
                )
                Alert.alert("Success", "Report description updated successfully")
              } catch (error) {
                console.error("Failed to update report description:", error)
                Alert.alert("Error", "Failed to update report description. Please try again.")
              }
            }
          }
        }
      ],
      "plain-text",
      report.description
    )
  }

  const changeReportSeverity = (report: UserReport) => {
    const severityOptions = [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' }
    ]
    const currentSeverity = severityOptions.find(s => s.value === report.severity)
    const otherSeverities = severityOptions.filter(s => s.value !== report.severity)

    Alert.alert(
      "Change Severity",
      `Current severity: ${currentSeverity?.label || report.severity}`,
      [
        { text: "Cancel", style: "cancel" },
        ...otherSeverities.map(severity => ({
          text: severity.label,
          onPress: async () => {
            try {
              await reportService.updateReport(report.id, {
                severity: severity.value
              })

              // Update local state
              setUserReports(prev =>
                prev.map(r =>
                  r.id === report.id
                    ? { ...r, severity: severity.value as 'low' | 'medium' | 'high' }
                    : r
                )
              )
              Alert.alert("Success", `Report severity changed to ${severity.label}`)
            } catch (error) {
              console.error("Failed to update report severity:", error)
              Alert.alert("Error", "Failed to update report severity. Please try again.")
            }
          }
        }))
      ]
    )
  }

  const changeReportStatus = (report: UserReport) => {
    // Note: Only admins can change status in the backend, so this is mainly for display
    // Regular users can only edit description and severity
    const statusOptions = [
      { label: 'Active', value: 'active' },
      { label: 'Resolved', value: 'resolved' }
    ]
    const currentStatus = statusOptions.find(s => s.value === report.status)
    const otherStatuses = statusOptions.filter(s => s.value !== report.status)

    Alert.alert(
      "Change Status",
      `Current status: ${currentStatus?.label || report.status}\n\nNote: Status changes may require admin approval.`,
      [
        { text: "Cancel", style: "cancel" },
        ...otherStatuses.map(status => ({
          text: status.label,
          onPress: async () => {
            try {
              // Try to update status (may fail if user is not admin)
              await reportService.updateReport(report.id, {
                status: status.value
              })

              // Update local state
              setUserReports(prev =>
                prev.map(r =>
                  r.id === report.id
                    ? { ...r, status: status.value as 'active' | 'resolved' | 'expired' | 'flagged' }
                    : r
                )
              )
              Alert.alert("Success", `Report status changed to ${status.label}`)
            } catch (error) {
              console.error("Failed to update report status:", error)
              Alert.alert("Error", "Failed to update report status. You may not have permission to change this.")
            }
          }
        }))
      ]
    )
  }

  const handleDeleteReport = (report: UserReport) => {
    const locationText = report.location.address || `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`

    Alert.alert(
      "Delete Report",
      `Are you sure you want to delete this ${report.type} report?\n\nLocation: ${locationText}\nDate: ${report.date}\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await reportService.deleteReport(report.id)
              setUserReports(prev => prev.filter(r => r.id !== report.id))
              Alert.alert("Success", "Report deleted successfully")
            } catch (error) {
              console.error("Failed to delete report:", error)
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
            <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
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
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {item.location.address || `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.reportStats}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{item.verifications}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="close-circle" size={16} color={theme.colors.error} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{item.disputes}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{item.comments}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}</Text>
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
        onPress={() => navigation.navigate('ReportIncident')}
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
          onPress={() => navigation.navigate('ReportIncident')}
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
