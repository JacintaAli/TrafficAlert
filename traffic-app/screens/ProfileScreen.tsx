import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { userService, UserProfile, Badge } from "../services/userService"

interface ProfileScreenProps {
  navigation: any
}

const userReports = [
  {
    id: "1",
    type: "Car Accident",
    location: "Wuse 2, Abuja",
    date: "2024-01-15",
    status: "Resolved",
  },
  {
    id: "2",
    type: "Road Construction",
    location: "Garki Area 1",
    date: "2024-01-12",
    status: "Active",
  },
  {
    id: "3",
    type: "Traffic Jam",
    location: "Central Business District",
    date: "2024-01-10",
    status: "Resolved",
  },
]

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
    loadLeaderboard()
  }, [])

  const loadUserProfile = async () => {
    try {
      let profile = userService.getCurrentUser()

      // Create a demo profile if none exists
      if (!profile) {
        profile = await userService.createProfile("TrafficUser", "user@example.com")

        // Add some demo experience and stats
        await userService.updateStats({
          reportsSubmitted: 5,
          reportsVerified: 3,
          upvotesReceived: 8,
          helpfulVotes: 12,
          distanceTraveled: 150,
          timesSaved: 45
        })

        await userService.addExperience(250, "demo_setup")
      }

      setUserProfile(profile)
    } catch (error) {
      console.error("Failed to load user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await userService.getLeaderboard()
      setLeaderboard(leaderboardData)
    } catch (error) {
      console.error("Failed to load leaderboard:", error)
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

  const renderBadgeItem = ({ item }: { item: Badge }) => (
    <View style={styles.badgeItem}>
      <Text style={styles.badgeIcon}>{item.icon}</Text>
      <Text style={styles.badgeName}>{item.name}</Text>
    </View>
  )

  const renderReportItem = ({ item }: { item: (typeof userReports)[0] }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>{item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === "Active" ? "#4CAF50" : "#9E9E9E" }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.reportLocation}>{item.location}</Text>
      <Text style={styles.reportDate}>{item.date}</Text>
    </View>
  )

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
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>Level {userProfile.level}</Text>
                <Text style={styles.experienceText}>{userProfile.experience} XP</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.stats.reportsSubmitted}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.stats.reportsVerified}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.stats.upvotesReceived}</Text>
            <Text style={styles.statLabel}>Upvotes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(userProfile.stats.distanceTraveled)}</Text>
            <Text style={styles.statLabel}>km Traveled</Text>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Badges ({userProfile.badges.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesContainer}>
            {userProfile.badges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeRarity}>{badge.rarity}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {leaderboard.slice(0, 5).map((user, index) => (
            <View key={index} style={styles.leaderboardItem}>
              <Text style={styles.leaderboardRank}>#{index + 1}</Text>
              <Text style={styles.leaderboardName}>{user.username}</Text>
              <Text style={styles.leaderboardLevel}>Level {user.level}</Text>
              <Text style={styles.leaderboardReports}>{user.reportsSubmitted} reports</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

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

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>My Reports</Text>
          <FlatList
            data={userReports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
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
  reportsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  reportItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    fontWeight: "500",
  },
  reportLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: "#999",
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
  levelContainer: {
    flexDirection: "row",
    marginTop: 4,
    gap: 12,
  },
  levelText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
  },
  experienceText: {
    fontSize: 12,
    color: "#666",
  },
  badgesSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  badgesContainer: {
    marginTop: 12,
  },
  badgeItem: {
    alignItems: "center",
    marginRight: 16,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    minWidth: 80,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  badgeRarity: {
    fontSize: 8,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },
  leaderboardSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
    width: 40,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
  },
  leaderboardLevel: {
    fontSize: 12,
    color: "#666",
    marginRight: 12,
  },
  leaderboardReports: {
    fontSize: 12,
    color: "#666",
  },
})
