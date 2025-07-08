import AsyncStorage from '@react-native-async-storage/async-storage'
import apiService from './apiService'

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  joinDate: Date
  stats: UserStats
  preferences: UserPreferences
  badges: Badge[]
  level: number
  experience: number
}

export interface UserStats {
  reportsSubmitted: number
  reportsVerified: number
  upvotesReceived: number
  helpfulVotes: number
  distanceTraveled: number
  timesSaved: number // minutes saved by using app
}

export interface UserPreferences {
  notifications: {
    trafficAlerts: boolean
    routeUpdates: boolean
    nearbyIncidents: boolean
    weeklyDigest: boolean
  }
  privacy: {
    shareLocation: boolean
    showProfile: boolean
    allowFriendRequests: boolean
  }
  routes: {
    avoidTolls: boolean
    avoidHighways: boolean
    preferFastestRoute: boolean
  }
  units: 'metric' | 'imperial'
  language: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

class UserService {
  private currentUser: UserProfile | null = null
  private readonly STORAGE_KEY = 'user_profile'

  // Initialize user service
  async initialize(): Promise<void> {
    try {
      const savedUser = await AsyncStorage.getItem(this.STORAGE_KEY)
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser)
      }

      // Also load and set the auth token in apiService
      const token = await AsyncStorage.getItem('authToken')
      if (token) {
        apiService.setToken(token)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // Create new user profile
  async createProfile(username: string, email: string): Promise<UserProfile> {
    const newUser: UserProfile = {
      id: Date.now().toString(),
      username,
      email,
      joinDate: new Date(),
      stats: {
        reportsSubmitted: 0,
        reportsVerified: 0,
        upvotesReceived: 0,
        helpfulVotes: 0,
        distanceTraveled: 0,
        timesSaved: 0
      },
      preferences: {
        notifications: {
          trafficAlerts: true,
          routeUpdates: true,
          nearbyIncidents: true,
          weeklyDigest: false
        },
        privacy: {
          shareLocation: true,
          showProfile: true,
          allowFriendRequests: true
        },
        routes: {
          avoidTolls: false,
          avoidHighways: false,
          preferFastestRoute: true
        },
        units: 'metric',
        language: 'en'
      },
      badges: [this.getWelcomeBadge()],
      level: 1,
      experience: 0
    }

    this.currentUser = newUser
    await this.saveProfile()
    return newUser
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.currentUser
  }



  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (this.currentUser) {
      this.currentUser.preferences = { ...this.currentUser.preferences, ...preferences }
      await this.saveProfile()
    }
  }

  // Add experience points and check for level up
  async addExperience(points: number, action: string): Promise<{ leveledUp: boolean; newLevel?: number; badge?: Badge }> {
    if (!this.currentUser) return { leveledUp: false }

    this.currentUser.experience += points
    const oldLevel = this.currentUser.level
    const newLevel = this.calculateLevel(this.currentUser.experience)
    
    let result: { leveledUp: boolean; newLevel?: number; badge?: Badge } = { leveledUp: false }

    if (newLevel > oldLevel) {
      this.currentUser.level = newLevel
      result.leveledUp = true
      result.newLevel = newLevel
      
      // Award level-up badge
      const levelBadge = this.getLevelBadge(newLevel)
      if (levelBadge) {
        this.currentUser.badges.push(levelBadge)
        result.badge = levelBadge
      }
    }

    // Check for action-specific badges
    const actionBadge = await this.checkActionBadges(action)
    if (actionBadge) {
      this.currentUser.badges.push(actionBadge)
      if (!result.badge) result.badge = actionBadge
    }

    await this.saveProfile()
    return result
  }

  // Update user stats
  async updateStats(statUpdates: Partial<UserStats>): Promise<void> {
    if (this.currentUser) {
      this.currentUser.stats = { ...this.currentUser.stats, ...statUpdates }
      await this.saveProfile()
    }
  }

  // Award badge
  async awardBadge(badge: Badge): Promise<void> {
    if (this.currentUser && !this.currentUser.badges.find(b => b.id === badge.id)) {
      this.currentUser.badges.push(badge)
      await this.saveProfile()
    }
  }

  // Get user level based on experience
  private calculateLevel(experience: number): number {
    // Level formula: level = floor(sqrt(experience / 100)) + 1
    return Math.floor(Math.sqrt(experience / 100)) + 1
  }

  // Check for action-specific badges
  private async checkActionBadges(action: string): Promise<Badge | null> {
    if (!this.currentUser) return null

    const stats = this.currentUser.stats

    switch (action) {
      case 'report_submitted':
        if (stats.reportsSubmitted === 1) {
          return this.createBadge('first_report', 'First Reporter', 'Submitted your first traffic report', '📝', 'common')
        }
        if (stats.reportsSubmitted === 10) {
          return this.createBadge('reporter_10', 'Active Reporter', 'Submitted 10 traffic reports', '📊', 'rare')
        }
        if (stats.reportsSubmitted === 50) {
          return this.createBadge('reporter_50', 'Traffic Expert', 'Submitted 50 traffic reports', '🏆', 'epic')
        }
        break

      case 'upvote_received':
        if (stats.upvotesReceived === 10) {
          return this.createBadge('helpful_10', 'Helpful Reporter', 'Received 10 upvotes', '👍', 'rare')
        }
        break

      case 'distance_traveled':
        if (stats.distanceTraveled >= 1000) {
          return this.createBadge('traveler_1000', 'Road Warrior', 'Traveled 1000km using the app', '🛣️', 'epic')
        }
        break
    }

    return null
  }

  // Create badge helper
  private createBadge(id: string, name: string, description: string, icon: string, rarity: Badge['rarity']): Badge {
    return {
      id,
      name,
      description,
      icon,
      unlockedAt: new Date(),
      rarity
    }
  }

  // Get welcome badge
  private getWelcomeBadge(): Badge {
    return this.createBadge('welcome', 'Welcome!', 'Welcome to TrafficAlert', '🎉', 'common')
  }

  // Get level badge
  private getLevelBadge(level: number): Badge | null {
    const levelBadges: { [key: number]: { name: string; icon: string; rarity: Badge['rarity'] } } = {
      5: { name: 'Rising Star', icon: '⭐', rarity: 'rare' },
      10: { name: 'Traffic Veteran', icon: '🎖️', rarity: 'epic' },
      20: { name: 'Road Master', icon: '👑', rarity: 'legendary' }
    }

    const badgeInfo = levelBadges[level]
    if (badgeInfo) {
      return this.createBadge(
        `level_${level}`,
        badgeInfo.name,
        `Reached level ${level}`,
        badgeInfo.icon,
        badgeInfo.rarity
      )
    }

    return null
  }

  // Save profile to storage
  private async saveProfile(): Promise<void> {
    try {
      if (this.currentUser) {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser))
      }
    } catch (error) {
      console.error('Error saving user profile:', error)
    }
  }

  // Get leaderboard data (mock implementation)
  async getLeaderboard(): Promise<Array<{ username: string; level: number; reportsSubmitted: number }>> {
    // In a real app, this would fetch from your backend
    return [
      { username: 'TrafficPro', level: 15, reportsSubmitted: 127 },
      { username: 'RoadWatcher', level: 12, reportsSubmitted: 89 },
      { username: 'SpeedDemon', level: 10, reportsSubmitted: 76 },
      { username: this.currentUser?.username || 'You', level: this.currentUser?.level || 1, reportsSubmitted: this.currentUser?.stats.reportsSubmitted || 0 }
    ].sort((a, b) => b.level - a.level)
  }

  // Update user profile with backend integration
  async updateProfile(updatedProfile: UserProfile): Promise<void> {
    try {
      console.log('📝 UserService: Updating profile...')
      console.log('📝 UserService: Profile data received:', updatedProfile)

      // Validate name locally first
      const trimmedName = updatedProfile.username?.trim()
      if (!trimmedName || trimmedName.length < 2) {
        throw new Error('Name must be at least 2 characters long')
      }
      if (trimmedName.length > 50) {
        throw new Error('Name cannot exceed 50 characters')
      }

      // Prepare data for backend (only send fields that backend accepts)
      const backendUpdateData: any = {
        name: trimmedName, // Backend expects 'name' not 'username'
        // Note: Email updates are not supported by backend validation schema
        // phone: updatedProfile.phone, // Add if we have phone field
        // quickDestinations: updatedProfile.quickDestinations, // Add if we have this field
      }

      // Include profile picture if it's a Cloudinary URL (uploaded to cloud)
      if (updatedProfile.avatar && updatedProfile.avatar.includes('cloudinary.com')) {
        backendUpdateData.profilePicture = updatedProfile.avatar
        console.log('📝 UserService: Including profile picture in backend update')
      }

      console.log('📝 UserService: Sending profile update to backend:', backendUpdateData)

      // Update on backend first
      const response = await apiService.updateProfile(backendUpdateData)
      console.log('📝 UserService: Backend update response:', response)
      console.log('📝 UserService: Response type:', typeof response)
      console.log('📝 UserService: Response success:', response?.success)
      console.log('📝 UserService: Response message:', response?.message)
      console.log('📝 UserService: Response errors:', response?.errors)

      if (response.success) {
        console.log('📝 UserService: Backend update successful')

        // Update local profile, preserving local-only fields like avatar
        const currentAvatar = this.currentUser?.avatar
        this.currentUser = {
          ...updatedProfile,
          username: trimmedName, // Ensure we use the trimmed name
          // Preserve local avatar if it exists and wasn't changed in this update
          avatar: updatedProfile.avatar || currentAvatar
        }
        await this.saveProfile()

        console.log('📝 UserService: Profile updated successfully, preserved avatar:', this.currentUser.avatar)
      } else {
        // Handle backend validation errors more specifically
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map((err: any) => err.message).join(', ')
          throw new Error(errorMessages)
        }
        throw new Error(response.message || 'Failed to update profile on backend')
      }
    } catch (error) {
      console.error('📝 UserService: Error updating user profile:', error)

      // Provide more user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.message.includes('Validation')) {
          throw new Error('Please check that your name is between 2-50 characters long')
        }
        throw error
      }
      throw new Error('Failed to update profile. Please try again.')
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      console.log('🔐 UserService: Attempting login for:', email)
      const response = await apiService.login({ email, password })
      console.log('🔐 UserService: Login response:', response)

      if (response.success && response.data.user) {
        // Convert backend user to our UserProfile format
        const user = this.convertBackendUserToProfile(response.data.user)
        this.currentUser = user
        await this.saveProfile()

        // Ensure the token is set in apiService
        if (response.data.token) {
          apiService.setToken(response.data.token)
          console.log('🔐 UserService: Token set successfully')
        }

        console.log('🔐 UserService: Login successful for user:', user.username)
        return { success: true, user }
      } else {
        console.log('🔐 UserService: Login failed:', response.message)
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error) {
      console.error('🔐 UserService: Login error:', error)
      return { success: false, message: (error as Error).message || 'Network error. Please try again.' }
    }
  }

  async register(userData: { name: string; email: string; password: string; phone?: string }): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      console.log('👤 UserService: Attempting registration for:', userData.email)
      const response = await apiService.register(userData)
      console.log('👤 UserService: Registration response:', response)

      if (response.success && response.data.user) {
        // Convert backend user to our UserProfile format
        const user = this.convertBackendUserToProfile(response.data.user)
        this.currentUser = user
        await this.saveProfile()

        // Ensure the token is set in apiService
        if (response.data.token) {
          apiService.setToken(response.data.token)
          console.log('👤 UserService: Token set successfully')
        }

        console.log('👤 UserService: Registration successful for user:', user.username)
        return { success: true, user }
      } else {
        console.log('👤 UserService: Registration failed:', response.message)
        return { success: false, message: response.message || 'Registration failed' }
      }
    } catch (error) {
      console.error('👤 UserService: Registration error:', error)
      return { success: false, message: (error as Error).message || 'Network error. Please try again.' }
    }
  }



  // Convert backend user format to our UserProfile format
  private convertBackendUserToProfile(backendUser: any): UserProfile {
    console.log('🔄 UserService: Converting backend user:', backendUser)
    console.log('🔄 UserService: Backend profilePicture:', backendUser.profilePicture)

    return {
      id: backendUser.id || backendUser._id,
      username: backendUser.name,
      email: backendUser.email,
      avatar: backendUser.profilePicture,
      joinDate: new Date(backendUser.createdAt || Date.now()),
      stats: {
        reportsSubmitted: backendUser.stats?.reportsSubmitted || 0,
        reportsVerified: backendUser.stats?.reportsVerified || 0,
        upvotesReceived: backendUser.stats?.helpfulVotes || 0,
        helpfulVotes: backendUser.stats?.helpfulVotes || 0,
        distanceTraveled: 0, // Not tracked in backend yet
        timesSaved: 0 // Not tracked in backend yet
      },
      preferences: {
        notifications: {
          trafficAlerts: backendUser.preferences?.notifications?.nearbyReports ?? true,
          routeUpdates: backendUser.preferences?.notifications?.routeAlerts ?? true,
          nearbyIncidents: backendUser.preferences?.notifications?.nearbyReports ?? true,
          weeklyDigest: backendUser.preferences?.notifications?.email ?? true,
        },
        privacy: {
          shareLocation: backendUser.preferences?.privacy?.shareLocation ?? true,
          showProfile: backendUser.preferences?.privacy?.showProfile ?? true,
          allowFriendRequests: true, // Not in backend yet
        },
        routes: {
          avoidTolls: false, // Not in backend yet
          avoidHighways: false, // Not in backend yet
          preferFastestRoute: true, // Not in backend yet
        },
        units: 'metric' as const,
        language: 'en'
      },
      badges: [], // Not implemented in backend yet
      level: Math.floor((backendUser.stats?.reportsSubmitted || 0) / 10) + 1,
      experience: (backendUser.stats?.reportsSubmitted || 0) * 10
    }
  }

  // Logout method
  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🚪 UserService: Logging out user')

      // Call backend logout if we have a token
      try {
        await apiService.logout()
      } catch (error) {
        console.log('🚪 UserService: Backend logout failed (continuing with local logout):', error)
      }

      // Clear local data
      await this.clearUserData()

      // Clear token from apiService
      apiService.setToken(null)
      await AsyncStorage.removeItem('authToken')

      console.log('🚪 UserService: Logout successful')
      return { success: true }
    } catch (error) {
      console.error('🚪 UserService: Logout error:', error)
      return { success: false, message: 'Failed to logout properly' }
    }
  }

  // Upload profile picture
  async uploadProfilePicture(imageUri: string): Promise<string> {
    try {
      console.log('📸 UserService: Uploading profile picture from:', imageUri)

      // Prepare image file for upload
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`
      }

      console.log('📸 UserService: Image file prepared:', imageFile)
      const response = await apiService.uploadProfilePicture(imageFile)
      console.log('📸 UserService: Upload response:', response)

      if (response.success && response.data?.profilePicture) {
        console.log('📸 UserService: Profile picture uploaded successfully to:', response.data.profilePicture)
        return response.data.profilePicture
      } else {
        console.error('📸 UserService: Upload failed - Response:', response)
        throw new Error(response.message || 'Failed to upload profile picture')
      }
    } catch (error) {
      console.error('📸 UserService: Error uploading profile picture:', error)
      console.error('📸 UserService: Error details:', (error as Error).message)
      throw error
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔐 UserService: Attempting password change...')
      const response = await apiService.changePassword({
        currentPassword,
        newPassword
      })
      console.log('🔐 UserService: Password change response:', response)

      if (response.success) {
        console.log('🔐 UserService: Password changed successfully')
        return { success: true, message: response.message || 'Password changed successfully' }
      } else {
        console.error('🔐 UserService: Password change failed:', response.message)
        return { success: false, message: response.message || 'Failed to change password' }
      }
    } catch (error) {
      console.error('🔐 UserService: Password change error:', error)
      return { success: false, message: (error as Error).message || 'Network error. Please try again.' }
    }
  }

  // Get user stats from backend
  async getUserStats(): Promise<UserStats | null> {
    try {
      console.log('📊 UserService: Fetching user stats from backend...')
      const response = await apiService.getUserStats()

      if (response.success && response.data) {
        console.log('📊 UserService: User stats fetched successfully')
        return {
          reportsSubmitted: response.data.reportsSubmitted || 0,
          reportsVerified: response.data.reportsVerified || 0,
          upvotesReceived: response.data.upvotesReceived || 0,
          helpfulVotes: response.data.helpfulVotes || 0,
          distanceTraveled: response.data.distanceTraveled || 0,
          timesSaved: response.data.timesSaved || 0
        }
      } else {
        console.log('📊 UserService: Failed to fetch user stats:', response.message)
        return null
      }
    } catch (error) {
      console.error('📊 UserService: Error fetching user stats:', error)
      return null
    }
  }

  // Refresh profile from backend
  async refreshProfileFromBackend(): Promise<UserProfile | null> {
    try {
      console.log('🔄 UserService: Refreshing profile from backend...')
      const response = await apiService.getUserProfile()

      if (response.success && response.data.user) {
        const currentAvatar = this.currentUser?.avatar
        const user = this.convertBackendUserToProfile(response.data.user)

        // Preserve local avatar if backend doesn't have one
        if (!user.avatar && currentAvatar) {
          user.avatar = currentAvatar
          console.log('🔄 UserService: Preserved local avatar during refresh')
        }

        this.currentUser = user
        await this.saveProfile()
        console.log('🔄 UserService: Profile refreshed successfully, final avatar:', user.avatar)
        return user
      } else {
        console.log('🔄 UserService: Failed to refresh profile:', response.message)
        return null
      }
    } catch (error) {
      console.error('🔄 UserService: Error refreshing profile:', error)
      return null
    }
  }

  // Clear user data (logout)
  async clearUserData(): Promise<void> {
    this.currentUser = null
    await AsyncStorage.removeItem(this.STORAGE_KEY)
  }
}

export const userService = new UserService()
