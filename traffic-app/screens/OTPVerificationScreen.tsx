"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface OTPVerificationScreenProps {
  navigation: any
  route: any
}

export default function OTPVerificationScreen({ navigation, route }: OTPVerificationScreenProps) {
  const { email, type } = route.params // type: 'signup' or 'forgot-password'
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<TextInput[]>([])

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all fields are filled
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOtp(newOtp.join(''))
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join('')
    
    if (codeToVerify.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call for OTP verification
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, accept any 6-digit code
      if (codeToVerify.length === 6) {
        Alert.alert(
          "Success!",
          "OTP verified successfully",
          [
            {
              text: "OK",
              onPress: () => {
                if (type === 'signup') {
                  navigation.replace("Main")
                } else if (type === 'forgot-password') {
                  navigation.navigate("ResetPassword", { email, otp: codeToVerify })
                }
              }
            }
          ]
        )
      } else {
        Alert.alert("Error", "Invalid OTP code. Please try again.")
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend) return

    try {
      // Simulate API call for resending OTP
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      Alert.alert("OTP Sent", "A new verification code has been sent to your email.")
      
      // Reset timer
      setTimer(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      
      // Restart countdown
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={80} color="#2196F3" />
            </View>

            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputRefs.current[index] = ref
                  }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]} 
              onPress={() => handleVerifyOtp()}
              disabled={isLoading}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? "Verifying..." : "Verify Code"}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Resend code in {formatTime(timer)}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.changeEmailButton}>
              <Text style={styles.changeEmailText}>Change Email Address</Text>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    alignSelf: "flex-start",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  emailText: {
    fontWeight: "600",
    color: "#2196F3",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    width: "100%",
    maxWidth: 300,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  otpInputFilled: {
    borderColor: "#2196F3",
    backgroundColor: "#f0f8ff",
  },
  verifyButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    marginBottom: 30,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    marginBottom: 20,
  },
  resendText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600",
  },
  timerText: {
    color: "#666",
    fontSize: 16,
  },
  changeEmailButton: {
    padding: 10,
  },
  changeEmailText: {
    color: "#999",
    fontSize: 14,
    textDecorationLine: "underline",
  },
})
