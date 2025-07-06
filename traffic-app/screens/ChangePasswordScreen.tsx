"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { userService } from "../services/userService"

interface ChangePasswordScreenProps {
  navigation: any
}

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  }

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password")
      return
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password")
      return
    }

    if (!confirmPassword.trim()) {
      Alert.alert("Error", "Please confirm your new password")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords don't match")
      return
    }

    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from current password")
      return
    }

    if (!validatePassword(newPassword)) {
      Alert.alert(
        "Weak Password", 
        "Password must be at least 8 characters long and contain:\n• At least one uppercase letter\n• At least one lowercase letter\n• At least one number"
      )
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 ChangePasswordScreen: Attempting password change...')
      const result = await userService.changePassword(currentPassword, newPassword)

      if (result.success) {
        Alert.alert(
          "Password Changed!",
          "Your password has been successfully updated.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack()
            }
          ]
        )
      } else {
        Alert.alert("Error", result.message || "Failed to change password. Please try again.")
      }
    } catch (error) {
      console.error('🔐 ChangePasswordScreen: Error changing password:', error)
      Alert.alert("Error", "Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={60} color="#2196F3" />
          </View>

          <Text style={styles.title}>Update Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your current password and choose a new secure password.
          </Text>

          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowCurrentPassword(!showCurrentPassword)} 
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowNewPassword(!showNewPassword)} 
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={styles.requirementText}>• At least 8 characters long</Text>
              <Text style={styles.requirementText}>• At least one uppercase letter</Text>
              <Text style={styles.requirementText}>• At least one lowercase letter</Text>
              <Text style={styles.requirementText}>• At least one number</Text>
            </View>

            <TouchableOpacity 
              style={[styles.changeButton, isLoading && styles.changeButtonDisabled]} 
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              <Text style={styles.changeButtonText}>
                {isLoading ? "Changing Password..." : "Change Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  changeButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
