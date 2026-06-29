import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation } from '@tanstack/react-query';
import { OnboardingStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { LookingFor } from '../../types/user.types';

type Nav = StackNavigationProp<OnboardingStackParams, 'LookingFor'>;

const OPTIONS: { value: LookingFor; emoji: string; title: string; subtitle: string }[] = [
  { value: 'FRIENDS', emoji: '🤝', title: 'Friends', subtitle: 'Find your campus squad' },
  { value: 'DATING', emoji: '💕', title: 'Dating', subtitle: 'Meet someone special' },
  { value: 'STUDY_BUDDY', emoji: '📚', title: 'Study Buddy', subtitle: 'Ace it together' },
  { value: 'NETWORKING', emoji: '🚀', title: 'Networking', subtitle: 'Build your circle' },
];

export default function LookingForScreen() {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<Set<LookingFor>>(new Set());

  const toggle = (v: LookingFor) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () => apiClient.patch('/users/me', { lookingFor: Array.from(selected) }),
    onSuccess: () => navigation.navigate('ProfileSetup'),
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((s) => <View key={s} style={[styles.progressStep, s <= 4 && styles.progressActive]} />)}
      </View>

      <Text style={styles.heading}>What are you looking for?</Text>
      <Text style={styles.sub}>Pick all that apply — we'll find the right connections</Text>

      <View style={styles.grid}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.card, selected.has(opt.value) && styles.cardSelected]}
            onPress={() => toggle(opt.value)}
          >
            {selected.has(opt.value) && <Text style={styles.checkmark}>✓</Text>}
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <Text style={styles.cardTitle}>{opt.title}</Text>
            <Text style={styles.cardSub}>{opt.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, selected.size === 0 && styles.primaryBtnDisabled]}
        onPress={() => selected.size > 0 && mutation.mutate()}
        disabled={selected.size === 0 || mutation.isPending}
      >
        {mutation.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Continue</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: 60 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.xl },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressActive: { backgroundColor: colors.primary },
  heading: { fontSize: 22, fontWeight: '600', color: colors.white },
  sub: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, flex: 1 },
  card: { width: '47%', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, position: 'relative' },
  cardSelected: { borderColor: colors.primary, backgroundColor: 'rgba(108,61,255,0.1)' },
  checkmark: { position: 'absolute', top: 10, right: 10, color: colors.primary, fontSize: 16, fontWeight: '700' },
  emoji: { fontSize: 36, marginBottom: spacing.sm },
  cardTitle: { color: colors.white, fontSize: 16, fontWeight: '600' },
  cardSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  primaryBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
