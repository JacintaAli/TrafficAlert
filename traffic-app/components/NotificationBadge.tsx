"use client"

import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useTheme } from "../contexts/ThemeContext"

interface NotificationBadgeProps {
  count: number
  severity?: 'low' | 'medium' | 'high' | 'critical'
  size?: 'small' | 'medium' | 'large'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showZero?: boolean
}

export default function NotificationBadge({ 
  count, 
  severity = 'medium',
  size = 'medium',
  position = 'top-right',
  showZero = false 
}: NotificationBadgeProps) {
  const { theme } = useTheme()

  // Don't show badge if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null
  }

  const getBadgeColor = () => {
    switch (severity) {
      case 'low':
        return '#4CAF50' // Green
      case 'medium':
        return '#ff9800' // Orange
      case 'high':
        return '#f44336' // Red
      case 'critical':
        return '#d32f2f' // Dark Red
      default:
        return '#f44336'
    }
  }

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return {
          width: count > 9 ? 18 : 14,
          height: 14,
          borderRadius: 7,
          fontSize: 9,
          minWidth: 14,
        }
      case 'medium':
        return {
          width: count > 9 ? 22 : 18,
          height: 18,
          borderRadius: 9,
          fontSize: 11,
          minWidth: 18,
        }
      case 'large':
        return {
          width: count > 9 ? 26 : 22,
          height: 22,
          borderRadius: 11,
          fontSize: 13,
          minWidth: 22,
        }
      default:
        return {
          width: count > 9 ? 22 : 18,
          height: 18,
          borderRadius: 9,
          fontSize: 11,
          minWidth: 18,
        }
    }
  }

  const getPositionStyle = () => {
    const offset = size === 'small' ? -5 : size === 'large' ? -8 : -6
    
    switch (position) {
      case 'top-right':
        return { top: offset, right: offset }
      case 'top-left':
        return { top: offset, left: offset }
      case 'bottom-right':
        return { bottom: offset, right: offset }
      case 'bottom-left':
        return { bottom: offset, left: offset }
      default:
        return { top: offset, right: offset }
    }
  }

  const badgeSize = getBadgeSize()
  const positionStyle = getPositionStyle()

  // Format count display
  const getDisplayText = () => {
    if (count === 0) return ''
    if (count <= 99) return count.toString()
    return '99+'
  }

  return (
    <View 
      style={[
        styles.badge,
        {
          backgroundColor: getBadgeColor(),
          width: badgeSize.width,
          height: badgeSize.height,
          borderRadius: badgeSize.borderRadius,
          minWidth: badgeSize.minWidth,
        },
        positionStyle
      ]}
    >
      {count > 0 && (
        <Text 
          style={[
            styles.badgeText,
            {
              fontSize: badgeSize.fontSize,
              color: '#fff'
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {getDisplayText()}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1000,
  },
  badgeText: {
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
})