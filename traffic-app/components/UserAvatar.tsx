import React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { userService } from '../services/userService'

interface UserAvatarProps {
  size?: number
  showBorder?: boolean
  borderColor?: string
  backgroundColor?: string
  iconColor?: string
  style?: any
  // Optional: specify a different user's data instead of current user
  userAvatar?: string | null
  userName?: string
}

export default function UserAvatar({
  size = 40,
  showBorder = false,
  borderColor = '#ddd',
  backgroundColor = '#f5f5f5',
  iconColor = '#666',
  style,
  userAvatar,
  userName
}: UserAvatarProps) {
  // Use provided userAvatar or fall back to current user's avatar
  const currentUser = userService.getCurrentUser()
  const profilePicture = userAvatar !== undefined ? userAvatar : currentUser?.avatar

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    ...(showBorder && {
      borderWidth: 2,
      borderColor: borderColor,
    }),
    ...style,
  }

  if (profilePicture) {
    return (
      <View style={containerStyle}>
        <Image 
          source={{ uri: profilePicture }} 
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      </View>
    )
  }

  // Fallback to icon
  return (
    <View style={containerStyle}>
      <Ionicons 
        name="person" 
        size={size * 0.6} 
        color={iconColor} 
      />
    </View>
  )
}

// Preset sizes for common use cases
export const UserAvatarSizes = {
  small: 24,
  medium: 40,
  large: 60,
  xlarge: 80,
}
