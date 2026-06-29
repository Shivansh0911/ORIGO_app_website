import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParams } from './types';
import { useAuthStore } from '../store/authStore';
import { Storage } from '../utils/storage';
import SplashScreen from '../screens/SplashScreen';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParams>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, refreshUser } = useAuthStore();

  useEffect(() => {
    const token = Storage.getAccessToken();
    if (token) {
      refreshUser();
    } else {
      useAuthStore.getState().setLoading(false);
    }
  }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
