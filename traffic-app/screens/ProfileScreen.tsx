import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { userService, UserProfile } from "../services/userService"
import { useTheme } from "../contexts/ThemeContext"
import UserAvatar, { UserAvatarSizes } from "../components/UserAvatar"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"

interface ProfileScreenProps {
  navigation: any
}



export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { theme, isDark, toggleTheme } = useTheme()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [])

  // Refresh profile when screen comes into focus (e.g., returning from EditProfile)
  useFocusEffect(
    useCallback(() => {
      console.log('👤 ProfileScreen: Screen focused, refreshing profile...')
      loadUserProfile()
    }, [])
  )

  const loadUserProfile = async () => {
    try {
      console.log('👤 ProfileScreen: Loading user profile...')

      // Get current user from local storage first
      let profile = userService.getCurrentUser()

      if (profile) {
        console.log('👤 ProfileScreen: Found local profile for:', profile.username)
        console.log('👤 ProfileScreen: Profile avatar:', profile.avatar)
        setUserProfile(profile)

        // Try to refresh from backend
        try {
          const backendProfile = await userService.refreshProfileFromBackend()
          if (backendProfile) {
            console.log('👤 ProfileScreen: Updated profile from backend')
            console.log('👤 ProfileScreen: Backend profile avatar:', backendProfile.avatar)
            setUserProfile(backendProfile)
          }


        } catch (error) {
          console.log('👤 ProfileScreen: Could not refresh from backend, using local profile')
        }
      } else {
        console.log('👤 ProfileScreen: No user profile found, redirecting to login')
        navigation.replace("Login")
      }
    } catch (error) {
      console.error('👤 ProfileScreen: Failed to load user profile:', error)
      Alert.alert("Error", "Failed to load profile. Please try logging in again.")
      navigation.replace("Login")
    } finally {
      setLoading(false)
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
            try {
              await userService.logout()
              navigation.replace("Login")
            } catch (error) {
              console.error("Logout error:", error)
              // Force logout even if backend call fails
              await userService.clearUserData()
              navigation.replace("Login")
            }
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

  const dynamicStyles = StyleSheet.create({
    container: {
      ...styles.container,
      backgroundColor: theme.colors.background,
    },
    header: {
      ...styles.header,
      borderBottomColor: theme.colors.border,
    },
    userName: {
      ...styles.userName,
      color: theme.colors.text,
    },
    userEmail: {
      ...styles.userEmail,
      color: theme.colors.textSecondary,
    },
  })

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={dynamicStyles.header}>
          <View style={styles.profileSection}>
            <UserAvatar
              size={UserAvatarSizes.large}
              showBorder={true}
              borderColor={theme.colors.primary}
              backgroundColor={theme.colors.surface}
              iconColor={theme.colors.textSecondary}
              userAvatar={userProfile.avatar}
              userName={userProfile.username}
            />
            <View style={styles.userInfo}>
              <Text style={dynamicStyles.userName}>{userProfile.username}</Text>
              <Text style={dynamicStyles.userEmail}>{userProfile.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="create-outline" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>

          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={24}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </Text>
            <View style={[styles.themeToggle, { backgroundColor: isDark ? theme.colors.primary : theme.colors.border }]}>
              <View style={[
                styles.themeToggleThumb,
                {
                  backgroundColor: theme.colors.background,
                  transform: [{ translateX: isDark ? 20 : 2 }]
                }
              ]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyReports")}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>My Reports</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ChangePassword")}>
            <Ionicons name="key-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("HelpSupport")}>
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
  themeToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  themeToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
})
