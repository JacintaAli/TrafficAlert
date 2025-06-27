import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { userService, UserProfile } from "../services/userService"
import { reportService } from "../services/reportService"

interface ProfileScreenProps {
  navigation: any
}



export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userReports, setUserReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingReports, setLoadingReports] = useState(false)

  useEffect(() => {
    loadUserProfile()
    loadUserReports()
  }, [])

  const loadUserProfile = async () => {
    try {
      let profile = userService.getCurrentUser()

      // Create a demo profile if none exists
      if (!profile) {
        profile = await userService.createProfile("TrafficUser", "user@example.com")
      }

      setUserProfile(profile)
    } catch (error) {
      console.error("Failed to load user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserReports = async () => {
    setLoadingReports(true)
    try {
      // For demo purposes, let's create some sample user reports
      // In a real app, you'd filter reports by user ID from the report service
      const sampleUserReports = [
        {
          id: "user-1",
          type: "Traffic Jam",
          location: "Wuse 2, Abuja",
          date: "2024-01-15",
          status: "Active",
          severity: "Medium",
          description: "Heavy traffic due to road construction"
        },
        {
          id: "user-2",
          type: "Accident",
          location: "Garki Area 1",
          date: "2024-01-12",
          status: "Resolved",
          severity: "High",
          description: "Minor collision, cleared by authorities"
        },
        {
          id: "user-3",
          type: "Construction",
          location: "Central Business District",
          date: "2024-01-10",
          status: "Active",
          severity: "Low",
          description: "Road maintenance work in progress"
        }
      ]

      setUserReports(sampleUserReports)
    } catch (error) {
      console.error("Failed to load user reports:", error)
    } finally {
      setLoadingReports(false)
    }
  }

  const renderReportItem = ({ item }: { item: any }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>{item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === "Active" ? "#4CAF50" : "#9E9E9E" }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.reportDescription}>{item.description}</Text>
      <Text style={styles.reportLocation}>📍 {item.location}</Text>
      <View style={styles.reportFooter}>
        <Text style={styles.reportDate}>{item.date}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
      </View>
    </View>
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return '#f44336'
      case 'Medium': return '#ff9800'
      case 'Low': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await userService.clearUserData()
            navigation.replace("Login")
          }
        }
      ]
    )
  }



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle" size={64} color="#ccc" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#f44336" />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile.username}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="create-outline" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("About")}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* My Reports Section */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>My Reports ({userReports.length})</Text>
          {loadingReports ? (
            <View style={styles.loadingReportsContainer}>
              <Text style={styles.loadingReportsText}>Loading reports...</Text>
            </View>
          ) : userReports.length === 0 ? (
            <View style={styles.emptyReportsContainer}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyReportsText}>No reports yet</Text>
              <Text style={styles.emptyReportsSubtext}>Your submitted traffic reports will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={userReports}
              renderItem={renderReportItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  editButton: {
    padding: 8,
  },
  statsSection: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  menuSection: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f44336",
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    color: "#f44336",
    marginLeft: 8,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reportsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  loadingReportsContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingReportsText: {
    fontSize: 14,
    color: "#666",
  },
  emptyReportsContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyReportsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
  },
  emptyReportsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  reportItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  reportDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },
  reportLocation: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportDate: {
    fontSize: 12,
    color: "#999",
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
})
