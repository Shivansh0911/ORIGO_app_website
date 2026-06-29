import { NavigatorScreenParams } from '@react-navigation/native';
import { User, PublicUser } from '../types/user.types';

export type OnboardingStackParams = {
  Welcome: undefined;
  Register: undefined;
  Login: undefined;
  CollegeVerify: undefined;
  InterestPicker: undefined;
  LookingFor: undefined;
  ProfileSetup: undefined;
};

export type DiscoverStackParams = {
  DiscoverHome: undefined;
  UserProfile: { user: PublicUser };
};

export type RizzStackParams = {
  RizzInbox: undefined;
  RizzChat: { sessionId: string };
};

export type MessagesStackParams = {
  Conversations: undefined;
  Chat: { conversationId: string; otherUser: User };
};

export type CommunitiesStackParams = {
  CommunitiesList: undefined;
  CommunityDetail: { communityId: string };
  PostComposer: { communityId: string };
  EventDetail: { eventId: string };
};

export type ProfileStackParams = {
  MyProfile: undefined;
  EditProfile: undefined;
  Premium: undefined;
  Settings: undefined;
};

export type MainTabParams = {
  Discover: NavigatorScreenParams<DiscoverStackParams>;
  Communities: NavigatorScreenParams<CommunitiesStackParams>;
  Rizz: NavigatorScreenParams<RizzStackParams>;
  Messages: NavigatorScreenParams<MessagesStackParams>;
  Profile: NavigatorScreenParams<ProfileStackParams>;
};

export type RootStackParams = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParams>;
  Main: NavigatorScreenParams<MainTabParams>;
};
