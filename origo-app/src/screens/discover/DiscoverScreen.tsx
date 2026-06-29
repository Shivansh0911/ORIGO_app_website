import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DiscoverStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { PublicUser } from '../../types/user.types';

type Nav = StackNavigationProp<DiscoverStackParams, 'DiscoverHome'>;
const { width: _width, height: _height } = Dimensions.get('window');

function SwipeCard({ user, onSkip, onConnect, onRizz }: { user: PublicUser; onSkip: () => void; onConnect: () => void; onRizz: () => void }) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.imagePlaceholder}>
        {user.avatarUrl ? null : <Text style={cardStyles.avatarInitial}>{user.name.charAt(0)}</Text>}
      </View>
      <View style={cardStyles.overlay}>
        <View style={cardStyles.headerRow}>
          <Text style={cardStyles.name}>{user.name}</Text>
          {user.isVerified && <Text style={cardStyles.verified}>✓</Text>}
          {user.isPremium && <Text style={cardStyles.premium}>✨</Text>}
        </View>
        <Text style={cardStyles.college}>{user.collegeName ?? 'College Student'}</Text>
        {user.compatibilityScore != null && (
          <View style={cardStyles.scorePill}>
            <Text style={cardStyles.scoreText}>{Math.round(user.compatibilityScore)}% vibe match</Text>
          </View>
        )}
        <View style={cardStyles.interestRow}>
          {(user.interests ?? []).slice(0, 3).map((ui, i) => (
            <View key={i} style={cardStyles.interestPill}>
              <Text style={cardStyles.interestText}>{ui.interest.emoji} {ui.interest.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.skipBtn} onPress={onSkip}><Text style={cardStyles.skipIcon}>✕</Text></TouchableOpacity>
        <TouchableOpacity style={cardStyles.rizzBtn} onPress={onRizz}><Text style={cardStyles.rizzIcon}>⚡</Text></TouchableOpacity>
        <TouchableOpacity style={cardStyles.connectBtn} onPress={onConnect}><Text style={cardStyles.connectIcon}>♥</Text></TouchableOpacity>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const [index, setIndex] = useState(0);

  const { data: users, isLoading } = useQuery({
    queryKey: ['discover'],
    queryFn: async () => {
      const res = await apiClient.get<PublicUser[]>('/discover/people');
      return res.data;
    },
  });

  const skip = () => setIndex((i) => i + 1);
  const connect = async (userId: string) => {
    try { await apiClient.post('/matches', { receiverId: userId, matchType: 'FRIEND' }); } catch {}
    setIndex((i) => i + 1);
  };
  const rizz = (user: PublicUser) => {
    navigation.navigate('UserProfile', { user });
  };

  const currentUser = users?.[index];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity><Text style={styles.filterIcon}>⚙️</Text></TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : !currentUser ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🧭</Text>
          <Text style={styles.emptyTitle}>You've seen everyone nearby!</Text>
          <Text style={styles.emptyText}>Enable cross-campus to meet more people</Text>
          <TouchableOpacity style={styles.premiumBtn}>
            <Text style={styles.premiumBtnText}>Go Premium ✨</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SwipeCard
          user={currentUser}
          onSkip={skip}
          onConnect={() => connect(currentUser.id)}
          onRizz={() => rizz(currentUser)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 56 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.white },
  filterIcon: { fontSize: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.white, textAlign: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  premiumBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: 24, paddingVertical: 12, marginTop: spacing.lg },
  premiumBtnText: { color: colors.white, fontWeight: '600' },
});

const cardStyles = StyleSheet.create({
  card: { margin: spacing.lg, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.card, flex: 1 },
  imagePlaceholder: { flex: 1, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 80, color: colors.textMuted },
  overlay: { position: 'absolute', bottom: 80, left: 0, right: 0, padding: spacing.lg, backgroundColor: 'rgba(13,13,20,0.7)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '700', color: colors.white },
  verified: { color: colors.primary, fontSize: 18 },
  premium: { fontSize: 16 },
  college: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm },
  scorePill: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: spacing.sm },
  scoreText: { color: colors.white, fontSize: 12, fontWeight: '500' },
  interestRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  interestPill: { backgroundColor: 'rgba(42,42,69,0.85)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  interestText: { color: colors.white, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: spacing.md, backgroundColor: colors.card },
  skipBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  rizzBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  connectBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  skipIcon: { fontSize: 20, color: colors.error },
  rizzIcon: { fontSize: 24 },
  connectIcon: { fontSize: 20, color: colors.accent },
});
