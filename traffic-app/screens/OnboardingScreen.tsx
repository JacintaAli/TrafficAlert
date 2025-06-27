"use client"

import React, { useEffect, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface OnboardingScreenProps {
  navigation: any
}

const { width, height } = Dimensions.get("window")

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  // Animation values
  const carPosition = useRef(new Animated.Value(-100)).current
  const carRotation = useRef(new Animated.Value(0)).current
  const carScale = useRef(new Animated.Value(1.3)).current // Start bigger for animation
  const titleOpacity = useRef(new Animated.Value(0)).current
  const subtitleOpacity = useRef(new Animated.Value(0)).current
  const buttonOpacity = useRef(new Animated.Value(0)).current
  const pulseAnimation = useRef(new Animated.Value(1)).current

  useEffect(() => {
    startAnimation()
  }, [])

  const startAnimation = () => {
    // Enhanced car animation sequence
    Animated.sequence([
      // Phase 1: Car drives in from left to center
      Animated.timing(carPosition, {
        toValue: width / 2 - 40,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Phase 2: Car continues driving to exit right side
      Animated.timing(carPosition, {
        toValue: width + 100,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Phase 3: Car drives back from right to slightly left of center and scales down
      Animated.parallel([
        Animated.timing(carPosition, {
          toValue: width / 2 - 190, // Move a bit more to the left
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(carScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      // Phase 4: Car settles with a gentle bounce
      Animated.spring(carRotation, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    // Title appears after car settles
    setTimeout(() => {
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start()
    }, 4200)

    // Subtitle appears
    setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start()
    }, 4800)

    // Button appears
    setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start()
    }, 5200)

    // Start pulse animation after car settles
    setTimeout(() => {
      startPulseAnimation()
    }, 4000)
  }

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  const handleGetStarted = () => {
    navigation.replace("Login")
  }

  const carRotationInterpolate = carRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "0deg"],
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Centered Content Container */}
        <View style={styles.centeredContainer}>
          {/* Logo Section with Car and Title */}
          <View style={styles.logoSection}>
            {/* Single Animated Car that becomes the logo */}
            <Animated.View
              style={[
                styles.carContainer,
                {
                  transform: [
                    { translateX: carPosition },
                    { rotate: carRotationInterpolate },
                    { scale: carScale },
                    { scale: pulseAnimation },
                  ],
                },
              ]}
            >
              <Ionicons name="car-sport" size={80} color="#2196F3" />
            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
              TrafficAlert
            </Animated.Text>
          </View>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            Crowdsourced Traffic Reporting{"\n"}
            Stay informed, drive smarter
          </Animated.Text>

          {/* Get Started Button */}
          <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  carContainer: {
    marginBottom: 20, // Space between car and title
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    lineHeight: 26,
  },
  buttonContainer: {
    marginTop: 40,
    width: "100%",
  },
  getStartedButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
})
