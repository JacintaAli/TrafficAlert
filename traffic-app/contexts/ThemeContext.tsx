import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Theme {
  colors: {
    primary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    card: string
    notification: string
    success: string
    warning: string
    error: string
    info: string
  }
  isDark: boolean
}

const lightTheme: Theme = {
  colors: {
    primary: '#2196F3',
    background: '#ffffff',
    surface: '#f9f9f9',
    text: '#333333',
    textSecondary: '#666666',
    border: '#eeeeee',
    card: '#ffffff',
    notification: '#2196F3',
    success: '#4CAF50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196F3',
  },
  isDark: false,
}

const darkTheme: Theme = {
  colors: {
    primary: '#64B5F6',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#ffffff',
    textSecondary: '#B0B0B0',
    border: '#333333',
    card: '#1E1E1E',
    notification: '#64B5F6',
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#64B5F6',
  },
  isDark: true,
}

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    loadThemePreference()
  }, [])

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference')
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark')
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error)
    }
  }

  const toggleTheme = async () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    try {
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light')
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  const theme = isDark ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
