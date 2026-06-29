import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius } from '../../theme';

const LOOKING_FOR_LABELS: Record<string, string> = {
  FRIENDS: '🤝 Friends',
  DATING: '💕 Dating',
  STUDY_BUDDY: '📚 Study Buddy',
  NETWORKING: '🚀 Networking',
};

export default function MyProfileScreen() {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const { user, clearAuth } = useAuthStore();

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarRing}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            {user.isVerified && <Text style={styles.verifiedBadge}>✓</Text>}
            {user.isPremium && <Text style={styles.premiumBadge}>✨ Premium</Text>}
          </View>

          <Text style={styles.username}>@{user.username}</Text>

          {user.collegeName ? (
            <Text style={styles.college}>🎓 {user.collegeName}</Text>
          ) : null}

          {user.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile' as never)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.premiumBtn} onPress={() => navigation.navigate('Premium' as never)}>
            <Text style={styles.premiumBtnText}>✨ Premium</Text>
          </TouchableOpacity>
        </View>

        {/* Looking For */}
        {user.lookingFor?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <View style={styles.pillRow}>
              {user.lookingFor.map((lf) => (
                <View key={lf} style={styles.lfPill}>
                  <Text style={styles.lfPillText}>{LOOKING_FOR_LABELS[lf] ?? lf}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interests */}
        {user.interests?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.pillRow}>
              {user.interests.map((ui) => (
                <View key={ui.interest.id} style={styles.interestPill}>
                  <Text style={styles.interestPillText}>{ui.interest.emoji} {ui.interest.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={clearAuth}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: colors.white },
  settingsIcon: { fontSize: 22 },
  scroll: { paddingBottom: 40 },
  heroSection: { alignItems: 'center', paddingTop: spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  avatarRing: { width: 126, height: 126, borderRadius: 63, padding: 3, backgroundColor: colors.primary, marginBottom: spacing.md },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarFallback: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 48, color: colors.white, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '700', color: colors.white },
  verifiedBadge: { color: colors.primary, fontSize: 18 },
  premiumBadge: { backgroundColor: 'rgba(108,61,255,0.2)', color: colors.primary, fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  username: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  college: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  bio: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  actionRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 12, marginBottom: spacing.lg },
  editBtn: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  premiumBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 10, alignItems: 'center' },
  premiumBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lfPill: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  lfPillText: { color: colors.textSecondary, fontSize: 13 },
  interestPill: { backgroundColor: 'rgba(108,61,255,0.15)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  interestPillText: { color: colors.primaryLight, fontSize: 13 },
  signOutBtn: { marginHorizontal: spacing.lg, marginTop: spacing.xl, borderWidth: 1, borderColor: colors.error, borderRadius: radius.full, paddingVertical: 12, alignItems: 'center' },
  signOutText: { color: colors.error, fontWeight: '600', fontSize: 14 },
});
