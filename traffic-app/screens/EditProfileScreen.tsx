"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
import { userService, UserProfile } from "../services/userService"
import { useTheme } from "../contexts/ThemeContext"

interface EditProfileScreenProps {
  navigation: any
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { theme } = useTheme()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = userService.getCurrentUser()
      if (profile) {
        setUserProfile(profile)
        setUsername(profile.username)
        setEmail(profile.email)
        setProfileImage(profile.avatar || null)
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }



  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter your name")
      return
    }

    setSaving(true)
    try {
      console.log('💾 EditProfileScreen: Saving profile changes...')

      if (userProfile) {
        // Handle profile picture upload
        let profilePictureUrl = userProfile.avatar

        if (profileImage && profileImage !== userProfile.avatar) {
          console.log('📸 EditProfileScreen: New profile picture selected, attempting upload...')
          try {
            profilePictureUrl = await userService.uploadProfilePicture(profileImage)
            console.log('📸 EditProfileScreen: Profile picture uploaded successfully:', profilePictureUrl)
          } catch (error) {
            console.error('📸 EditProfileScreen: Failed to upload profile picture:', error)
            console.error('📸 EditProfileScreen: Error details:', (error as Error).message)

            // Fall back to local storage for now
            profilePictureUrl = profileImage
            Alert.alert(
              "Profile Picture",
              "Profile picture saved locally. Upload to cloud storage failed, but your picture will be visible in the app.",
              [{ text: "OK", style: "default" }]
            )
          }
        }

        // Update user profile
        const updatedProfile = {
          ...userProfile,
          username: username.trim(),
          email: email.trim(), // Keep locally (not sent to backend)
          avatar: profilePictureUrl || undefined,
        }

        console.log('💾 EditProfileScreen: Updating profile with avatar:', profilePictureUrl)
        await userService.updateProfile(updatedProfile)
        console.log('💾 EditProfileScreen: Profile updated, new current user:', userService.getCurrentUser())

        console.log('💾 EditProfileScreen: Profile updated successfully')
        Alert.alert(
          "Success",
          "Profile updated successfully!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack()
            }
          ]
        )
      }
    } catch (error) {
      console.error('💾 EditProfileScreen: Failed to update profile:', error)
      Alert.alert("Error", (error as Error).message || "Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle" size={64} color={theme.colors.border} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} disabled={saving}>
          <Text style={[styles.saveButtonText, saving && styles.saveButtonTextDisabled]}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.profilePictureButton}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <Ionicons name="person" size={40} color="#666" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profilePictureHint}>Tap to change photo</Text>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your Name"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={email}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={styles.helperText}>Email changes are not currently supported</Text>
          </View>
        </View>


      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonTextDisabled: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  profilePictureContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  profilePictureButton: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profilePictureHint: {
    fontSize: 14,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  readOnlyInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
})
