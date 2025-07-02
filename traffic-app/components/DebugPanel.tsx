import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../services/userService';

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({
    hasToken: false,
    hasUser: false,
    tokenPreview: '',
    userEmail: ''
  });

  const checkAuthStatus = async () => {
    try {
      // Check token
      const token = await AsyncStorage.getItem('authToken');
      
      // Check user
      const user = await userService.getCurrentUser();
      
      setDebugInfo({
        hasToken: !!token,
        hasUser: !!user,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
        userEmail: user?.email || 'No user'
      });
    } catch (error) {
      console.error('Debug check error:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Debug Info</Text>
      <Text style={styles.info}>Token: {debugInfo.hasToken ? '✅' : '❌'}</Text>
      <Text style={styles.info}>User: {debugInfo.hasUser ? '✅' : '❌'}</Text>
      <Text style={styles.info}>Email: {debugInfo.userEmail}</Text>
      <Text style={styles.info}>Token: {debugInfo.tokenPreview}</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkAuthStatus}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default DebugPanel;
