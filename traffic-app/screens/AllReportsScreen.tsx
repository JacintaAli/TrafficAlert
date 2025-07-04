import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Image, Share, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"

interface AllReportsScreenProps {
  navigation: any
}

const dummyReports = [
  {
    id: "1",
    type: "Car crash",
    description:
      "2 cars hit each other near For You supermarket kmskmkmzmsami jnecjdknms klsmxkm wkas mfosowmsaoi kmewuksmc nkk jnjxk mcdsmkms kmemwsk",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
    comments: 10,
    upvotes: 15,
    downvotes: 2,
    time: "2h ago",
  },
  {
    id: "2",
    type: "Car crash",
    description:
      "2 cars hit each other near For You supermarket kmskmkmzmsami jnecjdknms klsmxkm wkas mfosowmsaoi kmewuksmc nkk jnjxk mcdsmkms kmemwsk",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop",
    comments: 10,
    upvotes: 8,
    downvotes: 1,
    time: "4h ago",
  },
  {
    id: "3",
    type: "Car crash",
    description: "2 cars hit each other near For You supermarket",
    image: null,
    comments: 5,
    upvotes: 12,
    downvotes: 0,
    time: "6h ago",
  },
]

export default function AllReportsScreen({ navigation }: AllReportsScreenProps) {
  const { theme } = useTheme()

  const handleShare = async (report: typeof dummyReports[0]) => {
    try {
      const shareContent = {
        message: `Traffic Alert: ${report.type}\n\n${report.description}\n\nShared via TrafficAlert app`,
        title: "Traffic Alert",
      }

      await Share.share(shareContent)
    } catch (error) {
      Alert.alert("Error", "Failed to share report")
    }
  }

  const renderReportItem = ({ item }: { item: (typeof dummyReports)[0] }) => (
    <TouchableOpacity
      style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate("ReportDetails", { report: item })}
      activeOpacity={0.7}
    >
      {item.image && <Image source={{ uri: item.image }} style={styles.reportImage} />}

      <View style={styles.reportContent}>
        <View style={styles.reportHeader}>
          <Ionicons name="person-circle-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={[styles.reportType, { color: theme.colors.text }]}>{item.type}</Text>
        </View>

        <Text style={[styles.reportDescription, { color: theme.colors.textSecondary }]}>{item.description}</Text>

        <TouchableOpacity
          style={styles.viewCommentsButton}
          onPress={() => navigation.navigate("ReportDetails", { report: item })}
        >
          <Text style={[styles.viewCommentsText, { color: theme.colors.primary }]}>View all {item.comments} comments</Text>
        </TouchableOpacity>

        <View style={styles.reportActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              // Handle upvote action here if needed
            }}
          >
            <Ionicons name="arrow-up" size={20} color={theme.colors.success} />
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{item.upvotes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              // Handle downvote action here if needed
            }}
          >
            <Ionicons name="arrow-down" size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{item.downvotes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate("ReportDetails", { report: item });
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleShare(item);
            }}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>All Reports</Text>
        <View style={{ width: 24 }} />
      </View> */}

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <Text style={[styles.searchPlaceholder, { color: theme.colors.textSecondary }]}>Ademola Adetokunbo Cresent, Wuse 2,...</Text>
      </View>

      <FlatList
        data={dummyReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: "#666",
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  reportItem: {
    backgroundColor: "#fff",
    marginBottom: 1,
    paddingBottom: 16,
  },
  reportImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
  },
  reportContent: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  viewCommentsButton: {
    marginBottom: 12,
  },
  viewCommentsText: {
    fontSize: 12,
    color: "#666",
  },
  reportActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
})
