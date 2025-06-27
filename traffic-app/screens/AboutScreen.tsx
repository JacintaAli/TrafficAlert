"use client"

import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"

interface AboutScreenProps {
  navigation: any
}

export default function AboutScreen({ navigation }: AboutScreenProps) {
  const { theme } = useTheme()
  const appVersion = "1.0.0"
  const buildNumber = "1"

  const handleLinkPress = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert("Error", `Cannot open ${title}`)
      }
    } catch (error) {
      Alert.alert("Error", `Failed to open ${title}`)
    }
  }

  const handleFeedback = () => {
    Alert.alert(
      "Send Feedback",
      "How would you like to send feedback?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Email",
          onPress: () => handleLinkPress("mailto:support@trafficalert.com", "Email")
        },
        {
          text: "Rate App",
          onPress: () => Alert.alert("Rate App", "This would open the app store rating page")
        }
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Info Section */}
        <View style={styles.section}>
          <View style={styles.appLogoContainer}>
            <Ionicons name="car-sport" size={80} color={theme.colors.primary} />
            <Text style={[styles.appName, { color: theme.colors.text }]}>TrafficAlert</Text>
            <Text style={[styles.appTagline, { color: theme.colors.textSecondary }]}>Crowdsourced Traffic Reporting</Text>
            <Text style={[styles.appVersion, { color: theme.colors.textSecondary }]}>Version {appVersion} (Build {buildNumber})</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About TrafficAlert</Text>
          <Text style={styles.description}>
            TrafficAlert is a community-driven traffic reporting app that helps drivers stay informed about road conditions, 
            accidents, construction, and other traffic incidents in real-time. By sharing and receiving traffic updates, 
            we create a safer and more efficient driving experience for everyone.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Real-time traffic reports</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="map" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Smart route suggestions</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Instant traffic alerts</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Community-driven updates</Text>
            </View>
          </View>
        </View>

       

        {/* Developer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <Text style={styles.developerText}>
            Developed with ❤️ for safer roads and better commutes.
          </Text>
          <Text style={styles.copyrightText}>
            ©Copyright 2025 TrafficAlert. All rights reserved.
          </Text>
        </View>

        {/* Technical Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Information</Text>
          <View style={styles.techInfo}>
            <Text style={styles.techItem}>App Version: {appVersion}</Text>
            <Text style={styles.techItem}>Build Number: {buildNumber}</Text>
            <Text style={styles.techItem}>Platform: React Native</Text>
            <Text style={styles.techItem}>Last Updated: July 2025</Text>
            <Text style={styles.techItem}>Developers: Ivy & Jacinta</Text>
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  appLogoContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  appTagline: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  appVersion: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#555",
    flex: 1,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  linkText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 12,
  },
  developerText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  techInfo: {
    gap: 8,
  },
  techItem: {
    fontSize: 14,
    color: "#666",
  },
})
