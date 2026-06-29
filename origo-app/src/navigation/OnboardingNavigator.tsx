import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParams } from './types';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import RegisterScreen from '../screens/onboarding/RegisterScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import CollegeVerifyScreen from '../screens/onboarding/CollegeVerifyScreen';
import InterestPickerScreen from '../screens/onboarding/InterestPickerScreen';
import LookingForScreen from '../screens/onboarding/LookingForScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';

const Stack = createStackNavigator<OnboardingStackParams>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0D0D14' } }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CollegeVerify" component={CollegeVerifyScreen} />
      <Stack.Screen name="InterestPicker" component={InterestPickerScreen} />
      <Stack.Screen name="LookingFor" component={LookingForScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
