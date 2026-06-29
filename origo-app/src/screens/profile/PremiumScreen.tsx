import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { colors, spacing, radius } from '../../theme';

const PLANS = [
  {
    id: 'PREMIUM_MONTHLY',
    label: 'Monthly',
    price: '₹99',
    per: '/month',
    tag: null,
  },
  {
    id: 'PREMIUM_QUARTERLY',
    label: 'Quarterly',
    price: '₹249',
    per: '/3 months',
    tag: '🔥 Save 16%',
  },
  {
    id: 'PREMIUM_ANNUAL',
    label: 'Annual',
    price: '₹799',
    per: '/year',
    tag: '⚡ Best Value',
  },
] as const;

const PERKS = [
  { icon: '🌎', title: 'Cross-campus Discovery', desc: 'Meet students from any college in India' },
  { icon: '⚡', title: 'Unlimited Rizz Sessions', desc: 'Break the 5/day limit — Rizz anyone, anytime' },
  { icon: '🚀', title: 'Profile Boosts', desc: 'Jump to the top of discover for 30 min/day' },
  { icon: '❤️', title: 'See Who Liked You', desc: 'Know before you swipe — no more guessing' },
  { icon: '📊', title: 'Advanced Compatibility', desc: 'Full ML-powered vibe breakdown per person' },
  { icon: '🎁', title: 'Sticker Packs', desc: 'Exclusive animated sticker packs every month' },
];

export default function PremiumScreen() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const { user, refreshUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[number]['id']>('PREMIUM_QUARTERLY');

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ orderId: string; amount: number }>('/payments/subscription', {
        plan: selectedPlan,
      });
      return res.data;
    },
    onSuccess: async (data) => {
      // In a real build: open Razorpay checkout with orderId/amount
      // For now we simulate success
      Alert.alert(
        'Premium Activated!',
        'Your Origo Premium subscription is now active. Enjoy all features!',
        [{
          text: 'Let\'s Go', onPress: async () => {
            await refreshUser();
            navigation.goBack();
          },
        }]
      );
    },
    onError: () => Alert.alert('Error', 'Payment failed. Please try again.'),
  });

  if (user?.isPremium) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.alreadyPremium}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.premiumTitle}>You're Premium!</Text>
          <Text style={styles.premiumSub}>Enjoy all Origo Premium features.</Text>
          <Text style={styles.expiryText}>Enjoy all premium features.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Origo Premium</Text>
          <Text style={styles.heroSub}>The full campus social experience</Text>
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles.planLeft}>
                {selectedPlan === plan.id ? (
                  <View style={styles.radioFilled} />
                ) : (
                  <View style={styles.radioEmpty} />
                )}
                <Text style={[styles.planLabel, selectedPlan === plan.id && styles.planLabelActive]}>
                  {plan.label}
                </Text>
              </View>
              <View style={styles.planRight}>
                {plan.tag && (
                  <View style={styles.planTag}>
                    <Text style={styles.planTagText}>{plan.tag}</Text>
                  </View>
                )}
                <Text style={[styles.planPrice, selectedPlan === plan.id && styles.planPriceActive]}>
                  {plan.price}
                </Text>
                <Text style={styles.planPer}>{plan.per}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Perks */}
        <View style={styles.perksSection}>
          <Text style={styles.perksTitle}>Everything included</Text>
          {PERKS.map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <Text style={styles.perkIcon}>{perk.icon}</Text>
              <View style={styles.perkInfo}>
                <Text style={styles.perkTitle}>{perk.title}</Text>
                <Text style={styles.perkDesc}>{perk.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Subscription renews automatically. Cancel anytime in Settings.
          Prices inclusive of all taxes.
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => subscribeMutation.mutate()}
          disabled={subscribeMutation.isPending}
        >
          {subscribeMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaBtnText}>
              Get Premium — {PLANS.find((p) => p.id === selectedPlan)?.price}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backBtn: {
    position: 'absolute', top: 52, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.white, fontSize: 20 },
  scroll: { paddingTop: 100, paddingHorizontal: spacing.lg },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroEmoji: { fontSize: 56, marginBottom: spacing.sm },
  heroTitle: { fontSize: 28, fontWeight: '700', color: colors.white, marginBottom: 6 },
  heroSub: { color: colors.textSecondary, fontSize: 15 },

  plansSection: { gap: 10, marginBottom: spacing.xl },
  planCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
  },
  planCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(108,61,255,0.08)' },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioEmpty: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
  },
  radioFilled: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primary,
  },
  planLabel: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  planLabelActive: { color: colors.white, fontWeight: '600' },
  planRight: { alignItems: 'flex-end' },
  planTag: {
    backgroundColor: 'rgba(108,61,255,0.2)', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 2, marginBottom: 3,
  },
  planTagText: { color: colors.primaryLight, fontSize: 11, fontWeight: '600' },
  planPrice: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  planPriceActive: { color: colors.white },
  planPer: { fontSize: 11, color: colors.textMuted },

  perksSection: { marginBottom: spacing.xl },
  perksTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md,
  },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: spacing.md },
  perkIcon: { fontSize: 22, marginTop: 1 },
  perkInfo: { flex: 1 },
  perkTitle: { fontSize: 15, fontWeight: '600', color: colors.white, marginBottom: 2 },
  perkDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  disclaimer: { color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.lg, paddingBottom: 34,
  },
  ctaBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },

  alreadyPremium: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  crownEmoji: { fontSize: 72, marginBottom: spacing.md },
  premiumTitle: { fontSize: 26, fontWeight: '700', color: colors.white, marginBottom: spacing.sm },
  premiumSub: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  expiryText: { color: colors.textMuted, fontSize: 13, marginTop: spacing.md },
});
