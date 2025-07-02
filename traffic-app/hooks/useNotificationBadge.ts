"use client"

import { useState, useEffect } from "react"
import { notificationService } from "../services/notificationService"

interface NotificationBadgeData {
  count: number
  highestSeverity: 'low' | 'medium' | 'high' | 'critical'
  hasUnread: boolean
}

export function useNotificationBadge(): NotificationBadgeData {
  const [badgeData, setBadgeData] = useState<NotificationBadgeData>({
    count: 0,
    highestSeverity: 'medium',
    hasUnread: false
  })

  const updateBadgeData = () => {
    const notifications = notificationService.getNotifications()
    const unreadNotifications = notifications.filter(n => !n.read)
    
    if (unreadNotifications.length === 0) {
      setBadgeData({
        count: 0,
        highestSeverity: 'medium',
        hasUnread: false
      })
      return
    }

    // Determine highest severity among unread notifications
    const severityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 }
    const highestSeverity = unreadNotifications.reduce((highest, notification) => {
      const notificationSeverity = notification.priority as 'low' | 'medium' | 'high' | 'critical'
      const currentLevel = severityOrder[notificationSeverity] || 2
      const highestLevel = severityOrder[highest] || 2
      
      return currentLevel > highestLevel ? notificationSeverity : highest
    }, 'medium' as 'low' | 'medium' | 'high' | 'critical')

    setBadgeData({
      count: unreadNotifications.length,
      highestSeverity,
      hasUnread: true
    })
  }

  useEffect(() => {
    // Initial load
    updateBadgeData()

    // Set up interval to check for updates every 5 seconds
    const interval = setInterval(updateBadgeData, 5000)

    // Listen for focus events to update immediately when app becomes active
    const handleFocus = () => updateBadgeData()

    // For web, listen to focus events (check if addEventListener exists)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('focus', handleFocus)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [])

  // Expose method to manually refresh badge data
  const refreshBadge = () => {
    updateBadgeData()
  }

  return {
    ...badgeData,
    refreshBadge
  } as NotificationBadgeData & { refreshBadge: () => void }
}