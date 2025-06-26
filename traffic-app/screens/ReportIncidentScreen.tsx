"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocation } from "../hooks/useLocation"
import MapComponent from "../components/MapComponent"
import { reportService } from "../services/reportService"

interface ReportIncidentScreenProps {
  navigation: any
  route: any
}

const incidentTypes = [
  { id: "accident", label: "Accident", icon: "car-sport" },
  { id: "hazard", label: "Road Hazard", icon: "warning" },
  { id: "construction", label: "Construction", icon: "construct" },
  { id: "traffic", label: "Traffic Jam", icon: "car" },
  { id: "police", label: "Police", icon: "shield" },
  { id: "camera", label: "Speed Camera", icon: "camera" },
]

const severityLevels = [
  { id: "low", label: "Low", color: "#4CAF50" },
  { id: "medium", label: "Medium", color: "#FF9800" },
  { id: "high", label: "High", color: "#F44336" },
]

export default function ReportIncidentScreen({ navigation, route }: ReportIncidentScreenProps) {
  const [selectedType, setSelectedType] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("medium")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)

  const { location, loading, error, refreshLocation } = useLocation()

  // Use location from navigation params if available, otherwise use current location
  const reportLocation = route.params?.location || location

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert("Error", "Please select an incident type")
      return
    }

    if (!reportLocation) {
      Alert.alert("Error", "Location is required to submit a report")
      return
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please provide a description")
      return
    }

    setIsSubmitting(true)

    try {
      await reportService.submitReport({
        type: selectedType as any,
        latitude: reportLocation.latitude,
        longitude: reportLocation.longitude,
        description: description.trim(),
        severity: selectedSeverity as any,
        images,
        userId: "current_user_id", // Would come from auth service
      })

      Alert.alert("Success", "Report submitted successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddPhoto = () => {
    Alert.alert(
      "Add Photo",
      "Choose an option",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    )
  }

  const takePhoto = async () => {
    const imageUri = await reportService.takePhoto()
    if (imageUri) {
      setImages([...images, imageUri])
    }
  }

  const pickImage = async () => {
    const imageUri = await reportService.pickImage()
    if (imageUri) {
      setImages([...images, imageUri])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const selectedTypeData = incidentTypes.find((type) => type.id === selectedType)

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="location" size={48} color="#2196F3" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error && !reportLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapComponent location={reportLocation} showUserLocation={true} followUserLocation={true} style={styles.map} />
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.formContent}>
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.inputLabel}>Location</Text>
              <TouchableOpacity onPress={refreshLocation} style={styles.refreshLocationButton}>
                <Ionicons name="refresh" size={16} color="#2196F3" />
              </TouchableOpacity>
            </View>
            {reportLocation && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  {reportLocation.latitude.toFixed(6)}, {reportLocation.longitude.toFixed(6)}
                </Text>
                {reportLocation.address && <Text style={styles.addressText}>{reportLocation.address}</Text>}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTypePicker(!showTypePicker)}>
            <View style={styles.inputHeader}>
              <Ionicons name="warning-outline" size={20} color="#666" />
              <Text style={styles.inputLabel}>Type of Incident</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" style={styles.chevron} />
            </View>
            {selectedTypeData && <Text style={styles.selectedType}>{selectedTypeData.label}</Text>}
          </TouchableOpacity>

          {showTypePicker && (
            <View style={styles.typePicker}>
              {incidentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeOption, selectedType === type.id && styles.selectedTypeOption]}
                  onPress={() => {
                    setSelectedType(type.id)
                    setShowTypePicker(false)
                  }}
                >
                  <Ionicons name={type.icon as any} size={20} color="#666" />
                  <Text style={styles.typeOptionText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="document-text-outline" size={20} color="#666" />
              <Text style={styles.inputLabel}>Description</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Enter description here"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#666" />
              <Text style={styles.inputLabel}>Severity</Text>
            </View>
            <View style={styles.severityContainer}>
              {severityLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.severityOption,
                    { borderColor: level.color },
                    selectedSeverity === level.id && { backgroundColor: level.color }
                  ]}
                  onPress={() => setSelectedSeverity(level.id)}
                >
                  <Text style={[
                    styles.severityText,
                    selectedSeverity === level.id && { color: '#fff' }
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="camera-outline" size={20} color="#666" />
              <Text style={styles.inputLabel}>Photos ({images.length}/3)</Text>
            </View>

            {images.length > 0 && (
              <ScrollView horizontal style={styles.imageContainer} showsHorizontalScrollIndicator={false}>
                {images.map((imageUri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {images.length < 3 && (
              <TouchableOpacity style={styles.uploadButton} onPress={handleAddPhoto}>
                <Ionicons name="camera-outline" size={20} color="#666" />
                <Text style={styles.uploadButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!reportLocation || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!reportLocation || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    padding: 20,
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
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapContainer: {
    height: 200,
  },
  map: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  refreshLocationButton: {
    padding: 4,
  },
  chevron: {
    marginLeft: "auto",
  },
  locationInfo: {
    marginLeft: 30,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  selectedType: {
    fontSize: 14,
    color: "#666",
    marginLeft: 30,
  },
  typePicker: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedTypeOption: {
    backgroundColor: "#e3f2fd",
  },
  typeOptionText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginLeft: 30,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 30,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  severityContainer: {
    flexDirection: "row",
    marginLeft: 30,
    gap: 10,
  },
  severityOption: {
    flex: 1,
    padding: 10,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
  },
  severityText: {
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    marginLeft: 30,
    marginBottom: 10,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
})
