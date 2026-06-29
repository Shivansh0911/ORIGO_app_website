import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Image, Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DiscoverStackParams, RizzStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { PublicUser, LookingFor } from '../../types/user.types';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

type RouteT = RouteProp<DiscoverStackParams, 'UserProfile'>;
type Nav = StackNavigationProp<DiscoverStackParams, 'UserProfile'>;

const { width } = Dimensions.get('window');

const LOOKING_FOR_META: Record<LookingFor, { emoji: string; label: string }> = {
  FRIENDS: { emoji: '🤝', label: 'Friends' },
  DATING: { emoji: '💕', label: 'Dating' },
  NETWORKING: { emoji: '🚀', label: 'Networking' },
  STUDY_BUDDY: { emoji: '📚', label: 'Study Buddy' },
};

function OnlineDot({ isOnline }: { isOnline: boolean }) {
  return (
    <View style={[dotStyles.dot, { backgroundColor: isOnline ? colors.green : colors.textMuted }]} />
  );
}

const dotStyles = StyleSheet.create({
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.card },
});

function VibeMatchBar({ score }: { score: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: score / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={barStyles.container}>
      <View style={barStyles.track}>
        <Animated.View style={[barStyles.fill, { width: barWidth }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { marginTop: spacing.sm },
  track: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
});

export default function UserProfileScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const user: PublicUser = route.params.user;

  const rizzMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ sessionId: string }>('/rizz/sessions', { targetId: user.id });
      return res.data;
    },
    onSuccess: (data) => {
      // Navigate to Rizz tab > RizzChat
      // Using navigate as a workaround since we're crossing tab boundaries
      // Cross-tab navigation to RizzChat — cast required for cross-stack nav
      (navigation as { navigate: (screen: string, params: Record<string, unknown>) => void }).navigate('RizzChat', { sessionId: data.sessionId });
    },
  });

  return (
    <View style={styles.outer}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreBtn}>
            <Text style={styles.moreBtnText}>•••</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarRing}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{user.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.onlinePosition}>
              <OnlineDot isOnline={user.isOnline} />
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
            {user.isPremium && <Text style={styles.premiumBadge}>✨</Text>}
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.onlineStatus}>{user.isOnline ? 'Online now' : 'Recently active'}</Text>
        </View>

        {/* About */}
        {user.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        {/* Vibes / Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vibes</Text>
            <View style={styles.pillRow}>
              {user.interests.map((ui, i) => (
                <View key={i} style={styles.interestPill}>
                  <Text style={styles.interestPillText}>{ui.interest.emoji} {ui.interest.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Campus */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Campus</Text>
          <View style={styles.campusRow}>
            <Text style={styles.campusIcon}>🏫</Text>
            <View>
              <Text style={styles.campusName}>{user.collegeName ?? 'College Student'}</Text>
              {user.isVerified && <Text style={styles.campusVerified}>✓ College email verified</Text>}
            </View>
          </View>
        </View>

        {/* Looking For */}
        {user.lookingFor && user.lookingFor.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Looking For</Text>
            <View style={styles.lookingForRow}>
              {user.lookingFor.map((lf) => {
                const meta = LOOKING_FOR_META[lf];
                return (
                  <View key={lf} style={styles.lookingForPill}>
                    <Text style={styles.lookingForEmoji}>{meta.emoji}</Text>
                    <Text style={styles.lookingForLabel}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Vibe Match */}
        {user.compatibilityScore != null && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vibe Match</Text>
            <Text style={styles.vibeScore}>{Math.round(user.compatibilityScore)}%</Text>
            <Text style={styles.vibeSubtext}>compatibility based on shared interests</Text>
            <VibeMatchBar score={user.compatibilityScore} />
          </View>
        )}

        {/* Bottom padding for fixed button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.rizzBtn, rizzMutation.isPending && styles.rizzBtnDisabled]}
          onPress={() => !rizzMutation.isPending && rizzMutation.mutate()}
        >
          <Text style={styles.rizzBtnText}>Rizz in 5 ⚡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: colors.white, fontSize: 20 },
  moreBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  moreBtnText: { color: colors.textSecondary, fontSize: 16, letterSpacing: 2 },

  heroSection: { alignItems: 'center', paddingVertical: spacing.lg },
  avatarRing: {
    width: 148, height: 148,
    borderRadius: 74,
    borderWidth: 3, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatar: { width: 140, height: 140, borderRadius: 70 },
  avatarFallback: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 56, color: colors.textMuted },
  onlinePosition: { position: 'absolute', bottom: 6, right: 6 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  name: { fontSize: 26, fontWeight: '700', color: colors.white },
  verifiedBadge: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  premiumBadge: { fontSize: 18 },
  username: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  onlineStatus: { color: colors.green, fontSize: 12, marginTop: 4 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },

  bioText: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestPill: {
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  interestPillText: { color: colors.white, fontSize: 13 },

  campusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  campusIcon: { fontSize: 24 },
  campusName: { color: colors.white, fontSize: 15, fontWeight: '500' },
  campusVerified: { color: colors.green, fontSize: 12, marginTop: 2 },

  lookingForRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  lookingForPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.muted, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  lookingForEmoji: { fontSize: 18 },
  lookingForLabel: { color: colors.white, fontSize: 14, fontWeight: '500' },

  vibeScore: { fontSize: 48, fontWeight: '700', color: colors.primary },
  vibeSubtext: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.lg, paddingBottom: 34,
  },
  rizzBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54, alignItems: 'center', justifyContent: 'center',
    width: '100%',
  },
  rizzBtnDisabled: { opacity: 0.6 },
  rizzBtnText: { color: colors.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});
