import AsyncStorage from '@react-native-async-storage/async-storage'

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

  // Update user profile
  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates }
      await this.saveProfile()
    }
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
    
    let result = { leveledUp: false, newLevel: undefined, badge: undefined }

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

  // Clear user data (logout)
  async clearUserData(): Promise<void> {
    this.currentUser = null
    await AsyncStorage.removeItem(this.STORAGE_KEY)
  }
}

export const userService = new UserService()
