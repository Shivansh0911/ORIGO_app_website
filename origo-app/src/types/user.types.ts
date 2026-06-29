export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
export type LookingFor = 'FRIENDS' | 'DATING' | 'NETWORKING' | 'STUDY_BUDDY';

export interface Interest {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

export interface UserInterest {
  interest: Interest;
  weight: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  gender?: Gender;
  lookingFor: LookingFor[];
  collegeName?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  isPremium: boolean;
  interests: UserInterest[];
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  gender?: Gender;
  lookingFor: LookingFor[];
  collegeName?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  isPremium: boolean;
  interests: UserInterest[];
  compatibilityScore?: number;
}
