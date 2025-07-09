"use client"

import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface HelpSupportScreenProps {
  navigation: any
}

const { width } = Dimensions.get("window")

export default function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { id: 0, title: "FAQ", icon: "help-circle-outline" },
    { id: 1, title: "Privacy", icon: "shield-checkmark-outline" },
    { id: 2, title: "Terms", icon: "document-text-outline" },
  ]

  const faqData = [
    {
      question: "How do I report a traffic incident?",
      answer: "Tap the '+' button on the home screen, select the type of incident, add details, and submit. Your location will be automatically detected."
    },
    {
      question: "What does it mean to verify a report?",
      answer: "Verifying a report means you confirm that the traffic incident is real and accurate. This helps increase the report's credibility for other users."
    },
    {
      question: "What happens when I dispute a report?",
      answer: "Disputing a report signals that the information may be false, outdated, or misleading. Reports with multiple disputes will be reviewed and may be flagged or removed."
    },
    {
      question: "Are my reports anonymous?",
      answer: "Your reports are associated with your account for credibility, but your personal information is not shared publicly. Only your username is visible to other users."
    },
    {
      question: "Can I see who verified or disputed a report?",
      answer: "No, verify and dispute actions are anonymous to prevent bias or user targeting. However, we track the total number of verifications and disputes for each report."
    },

    {
      question: "",
      answer: "Go to Profile > Settings > Notifications to customize which alerts you want to receive."
    },
    {
      question: "How accurate are the traffic reports?",
      answer: "Reports are community-verified and cross-referenced with multiple sources. The more users confirm an incident, the higher its reliability score."
    },
    {
      question: "Can I edit or delete my reports?",
      answer: "Yes, you can edit or delete your reports within 24 hours of submission. Go to your profile and find 'My Reports' section."
    }, {
      question: "How do I verify or dispute a report?",
      answer: "When viewing a report, tap the thumbs-up (verify) or thumbs-down (dispute) icon to give feedback. You can only do one per report."
    },
    {
      question: "Can I undo a verify or dispute?",
      answer: "Yes, simply tap the same icon again to undo your action. You can also switch from verify to dispute and vice versa."
    },
    {
      question: "How are comments used in reports?",
      answer: "Comments allow users to provide additional information, updates, or context about a report. This helps others better understand the situation."
    },
    {
      question: "How do I get route suggestions?",
      answer: "Enter your destination in the search bar, and TrafficAlert will suggest the best routes based on current traffic conditions and user reports."
    },
    {
      question: "Why do I need location permissions?",
      answer: "Location access helps us show relevant traffic reports near you and allows you to quickly report incidents at your current location."
    },
    {
      question: "How do I turn off notifications?",
      answer: "Go to Profile > Settings > Notifications to customize which alerts you want to receive."
    }, {
      question: "Are there any rules for commenting?",
      answer: "Yes, comments must be respectful and relevant to the traffic report. Spam, offensive content, or misinformation will be removed."
    },
    {
      question: "Can I delete or edit my comments?",
      answer: "Yes, you can edit or delete your own comments at any time by tapping the three-dot icon next to your comment."
    },
    {
      question: "Is TrafficAlert free to use?",
      answer: "Yes, TrafficAlert is completely free. We're committed to keeping road safety information accessible to everyone."
    }
  ]

  const renderFAQ = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.faqContainer}>
        <Text style={styles.tabTitle}>Frequently Asked Questions</Text>
        <Text style={styles.tabSubtitle}>Find answers to common questions about TrafficAlert</Text>

        {faqData.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <View style={styles.questionContainer}>
              <Ionicons name="help-circle" size={20} color="#2196F3" />
              <Text style={styles.question}>{item.question}</Text>
            </View>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>Contact our support team at support@trafficalert.com</Text>
        </View>
      </View>
    </ScrollView>
  )

  const renderPrivacy = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.legalContainer}>
        <Text style={styles.tabTitle}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: July 2025</Text>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Information We Collect</Text>
          <Text style={styles.legalText}>
            • Location data (when you use location-based features){'\n'}
            • Account information (username, email){'\n'}
            • Traffic reports and interactions{'\n'}
            • Device information and usage analytics
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>How We Use Your Information</Text>
          <Text style={styles.legalText}>
            • Provide real-time traffic updates{'\n'}
            • Improve route suggestions{'\n'}
            • Verify and moderate user reports{'\n'}
            • Send relevant notifications{'\n'}
            • Enhance app performance and features
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Data Sharing</Text>
          <Text style={styles.legalText}>
            We do not sell your personal information. We may share anonymized traffic data with transportation authorities to improve road safety and traffic management.
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Your Rights</Text>
          <Text style={styles.legalText}>
            • Access your personal data{'\n'}
            • Correct inaccurate information{'\n'}
            • Delete your account and data{'\n'}
            • Control notification preferences{'\n'}
            • Opt out of data collection
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Contact Us</Text>
          <Text style={styles.legalText}>
            For privacy-related questions, contact us at privacy@trafficalert.com
          </Text>
        </View>
      </View>
    </ScrollView>
  )

  const renderTerms = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.legalContainer}>
        <Text style={styles.tabTitle}>Terms & Conditions</Text>
        <Text style={styles.lastUpdated}>Last updated: July 2025</Text>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.legalText}>
            By using TrafficAlert, you agree to these terms and conditions. If you disagree with any part of these terms, you may not use our service.
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>User Responsibilities</Text>
          <Text style={styles.legalText}>
            • Provide accurate traffic reports{'\n'}
            • Do not submit false or misleading information{'\n'}
            • Use the app safely while driving{'\n'}
            • Respect other users and community guidelines{'\n'}
            • Do not use the app for illegal activities
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Content and Reports</Text>
          <Text style={styles.legalText}>
            You retain ownership of your reports but grant TrafficAlert a license to use, display, and distribute them for the purpose of providing traffic information to other users.
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Disclaimer</Text>
          <Text style={styles.legalText}>
            TrafficAlert provides information "as is" without warranties. We are not responsible for the accuracy of user-generated content or any consequences of using our service.
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Limitation of Liability</Text>
          <Text style={styles.legalText}>
            TrafficAlert shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the service.
          </Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Contact Information</Text>
          <Text style={styles.legalText}>
            For questions about these terms, contact us at legal@trafficalert.com
          </Text>
        </View>
      </View>
    </ScrollView>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderFAQ()
      case 1:
        return renderPrivacy()
      case 2:
        return renderTerms()
      default:
        return renderFAQ()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? "#2196F3" : "#666"}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#2196F3",
  },
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#999",
    marginBottom: 24,
  },
  faqContainer: {
    padding: 20,
  },
  faqItem: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  answer: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginLeft: 32,
  },
  contactSection: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  legalContainer: {
    padding: 20,
  },
  legalSection: {
    marginBottom: 24,
  },
  legalSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  legalText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
})
