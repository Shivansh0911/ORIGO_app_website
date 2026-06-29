import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParams } from './types';
import { colors } from '../theme';
import { useNotificationStore } from '../store/notificationStore';

import { createStackNavigator } from '@react-navigation/stack';
import {
  DiscoverStackParams, RizzStackParams, MessagesStackParams,
  ProfileStackParams, CommunitiesStackParams,
} from './types';

// Discover
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import UserProfileScreen from '../screens/discover/UserProfileScreen';

// Communities
import CommunitiesListScreen from '../screens/communities/CommunitiesListScreen';
import CommunityDetailScreen from '../screens/communities/CommunityDetailScreen';
import PostComposer from '../screens/communities/PostComposer';
import EventDetailScreen from '../screens/communities/EventDetailScreen';

// Rizz
import RizzInboxScreen from '../screens/rizz/RizzInboxScreen';
import RizzChatScreen from '../screens/rizz/RizzChatScreen';

// Messages
import ConversationsScreen from '../screens/messages/ConversationsScreen';
import ChatScreen from '../screens/messages/ChatScreen';

// Profile
import MyProfileScreen from '../screens/profile/MyProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PremiumScreen from '../screens/profile/PremiumScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import ShipAFriendScreen from '../screens/profile/ShipAFriendScreen';

const Tab = createBottomTabNavigator<MainTabParams>();
const DiscoverStack = createStackNavigator<DiscoverStackParams>();
const CommunitiesStack = createStackNavigator<CommunitiesStackParams>();
const RizzStack = createStackNavigator<RizzStackParams>();
const MessagesStack = createStackNavigator<MessagesStackParams>();
const ProfileStack = createStackNavigator<ProfileStackParams>();

const SCREEN_OPTS = { headerShown: false, cardStyle: { backgroundColor: '#0D0D14' } };

function DiscoverNavigator() {
  return (
    <DiscoverStack.Navigator screenOptions={SCREEN_OPTS}>
      <DiscoverStack.Screen name="DiscoverHome" component={DiscoverScreen} />
      <DiscoverStack.Screen name="UserProfile" component={UserProfileScreen} />
    </DiscoverStack.Navigator>
  );
}

function CommunitiesNavigator() {
  return (
    <CommunitiesStack.Navigator screenOptions={SCREEN_OPTS}>
      <CommunitiesStack.Screen name="CommunitiesList" component={CommunitiesListScreen} />
      <CommunitiesStack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <CommunitiesStack.Screen
        name="PostComposer"
        component={PostComposer}
        options={{ presentation: 'modal' }}
      />
      <CommunitiesStack.Screen name="EventDetail" component={EventDetailScreen} />
    </CommunitiesStack.Navigator>
  );
}

function RizzNavigator() {
  return (
    <RizzStack.Navigator screenOptions={SCREEN_OPTS}>
      <RizzStack.Screen name="RizzInbox" component={RizzInboxScreen} />
      <RizzStack.Screen name="RizzChat" component={RizzChatScreen} />
    </RizzStack.Navigator>
  );
}

function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={SCREEN_OPTS}>
      <MessagesStack.Screen name="Conversations" component={ConversationsScreen} />
      <MessagesStack.Screen name="Chat" component={ChatScreen} />
    </MessagesStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={SCREEN_OPTS}>
      <ProfileStack.Screen name="MyProfile" component={MyProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Premium" component={PremiumScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="ShipAFriend" component={ShipAFriendScreen} />
    </ProfileStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Discover: '🧭',
    Communities: '🏘️',
    Rizz: '⚡',
    Messages: '💬',
    Profile: '👤',
  };
  return (
    <View style={[
      styles.iconContainer,
      name === 'Rizz' && styles.rizzIcon,
      focused && name === 'Rizz' && styles.rizzIconActive,
    ]}>
      <Text style={[styles.iconText, name === 'Rizz' && styles.rizzIconText]}>
        {icons[name]}
      </Text>
    </View>
  );
}

export default function MainTabNavigator() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverNavigator} />
      <Tab.Screen name="Communities" component={CommunitiesNavigator} />
      <Tab.Screen name="Rizz" component={RizzNavigator} />
      <Tab.Screen
        name="Messages"
        component={MessagesNavigator}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A2E',
    borderTopColor: '#2A2A45',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  iconContainer: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  rizzIcon: {
    backgroundColor: '#6C3DFF', borderRadius: 20,
    width: 48, height: 48, marginBottom: 4,
  },
  rizzIconActive: { backgroundColor: '#8B5CF6' },
  iconText: { fontSize: 22 },
  rizzIconText: { fontSize: 24 },
});
