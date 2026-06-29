import React from 'react';
import {
  View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions,
} from 'react-native';
import { PublicUser } from '../../types/user.types';
import { colors, spacing, radius } from '../../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_H = SCREEN_H * 0.68;

interface Props {
  user: PublicUser;
  onPress: () => void;
  onRizz: () => void;
  onFriend: () => void;
  onDate?: () => void;
}

export default function SwipeCard({ user, onPress, onRizz, onFriend, onDate }: Props) {
  const age: number | null = null;

  const visibleInterests = user.interests.slice(0, 3);
  const showDate = user.lookingFor.includes('DATING');

  return (
    <TouchableOpacity activeOpacity={0.97} onPress={onPress} style={styles.card}>
      <ImageBackground
        source={user.avatarUrl ? { uri: user.avatarUrl } : undefined}
        style={styles.image}
        imageStyle={styles.imageBorder}
      >
        {!user.avatarUrl && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderInitial}>{user.name.charAt(0)}</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <View style={styles.gradient} />

        {/* Bottom content */}
        <View style={styles.overlay}>
          {/* Name row */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}{age ? `, ${age}` : ''}
            </Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
            {user.isPremium && <Text style={styles.premiumStar}>✨</Text>}
          </View>

          {/* College */}
          {user.collegeName ? (
            <Text style={styles.college} numberOfLines={1}>🏫 {user.collegeName}</Text>
          ) : null}

          {/* Compatibility score */}
          {user.compatibilityScore != null && (
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{Math.round(user.compatibilityScore)}% vibe match</Text>
            </View>
          )}

          {/* Interest pills */}
          {visibleInterests.length > 0 && (
            <View style={styles.interestRow}>
              {visibleInterests.map((ui, i) => (
                <View key={i} style={styles.interestPill}>
                  <Text style={styles.interestText}>{ui.interest.emoji} {ui.interest.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.friendBtn} onPress={onFriend}>
              <Text style={styles.actionIcon}>👥</Text>
            </TouchableOpacity>
            {showDate && onDate && (
              <TouchableOpacity style={styles.dateBtn} onPress={onDate}>
                <Text style={styles.actionIcon}>💕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.rizzBtn} onPress={onRizz}>
              <Text style={styles.rizzText}>Rizz ⚡</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_W - spacing.lg * 2,
    height: CARD_H,
    borderRadius: radius.xl,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageBorder: { borderRadius: radius.xl },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: { fontSize: 80, color: colors.textMuted, fontWeight: '700' },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: radius.xl,
    top: '40%',
  },
  overlay: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: spacing.xs,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '700', color: colors.white, flex: 1 },
  verifiedBadge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  premiumStar: { fontSize: 18 },
  college: { fontSize: 13, color: '#B0B0CC' },
  scorePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    marginTop: 2,
  },
  scoreText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  interestPill: {
    backgroundColor: 'rgba(42,42,69,0.85)',
    borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  interestText: { color: colors.white, fontSize: 12 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.sm,
  },
  friendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(26,26,46,0.9)',
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dateBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(26,26,46,0.9)',
    borderWidth: 1, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  rizzBtn: {
    flex: 1, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  rizzText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  actionIcon: { fontSize: 20 },
});
