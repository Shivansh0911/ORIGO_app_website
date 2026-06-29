import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Image, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { colors, spacing, radius } from '../../theme';

interface MatchedUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

function UserChip({
  user, selected, onPress,
}: { user: MatchedUser; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.chipAvatar}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.chipAvatarImg} />
        ) : (
          <Text style={styles.chipInitial}>{user.name.charAt(0)}</Text>
        )}
        {selected && <View style={styles.selectedTick}><Text style={styles.tickText}>✓</Text></View>}
      </View>
      <Text style={[styles.chipName, selected && styles.chipNameSelected]} numberOfLines={1}>
        {user.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}

export default function ShipAFriendScreen() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const [selected, setSelected] = useState<MatchedUser[]>([]);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['ship-eligible'],
    queryFn: async () => {
      const res = await apiClient.get<MatchedUser[]>('/ships/eligible-targets');
      return res.data;
    },
  });

  // First create a Razorpay order then ship
  const shipMutation = useMutation({
    mutationFn: async () => {
      if (selected.length !== 2) throw new Error('SELECT_TWO');
      // Create IAP order for ₹19
      const orderRes = await apiClient.post<{ orderId: string; amount: number; keyId: string }>('/payments/ship/order');
      const { orderId, amount, keyId } = orderRes.data;

      // In production: open Razorpay checkout here
      // For now, we simulate payment success and verify with a placeholder
      // RazorpayCheckout.open({ key: keyId, amount, order_id: orderId, ... })
      // Then POST /payments/ship/verify

      // After payment: create the ship
      const res = await apiClient.post('/ships', {
        targetOneId: selected[0].id,
        targetTwoId: selected[1].id,
        message: message.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      Alert.alert(
        '💕 Shipped!',
        `You anonymously shipped ${selected[0].name} and ${selected[1].name} together. Both will get a notification!`,
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to ship';
      Alert.alert('Error', msg);
    },
  });

  const toggle = (user: MatchedUser) => {
    setSelected((prev) => {
      if (prev.find((u) => u.id === user.id)) return prev.filter((u) => u.id !== user.id);
      if (prev.length >= 2) return prev;
      return [...prev, user];
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ship a Friend 💕</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* How it works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Pick two friends you think would vibe. We'll notify them anonymously that someone thinks they should meet.
            One ship = ₹19 (helps keep Origo running 🙌).
          </Text>
        </View>

        {/* Selection indicator */}
        <View style={styles.selectionRow}>
          <View style={[styles.selectionSlot, selected[0] && styles.selectionSlotFilled]}>
            {selected[0] ? (
              <>
                <Text style={styles.slotInitial}>{selected[0].name.charAt(0)}</Text>
                <Text style={styles.slotName} numberOfLines={1}>{selected[0].name.split(' ')[0]}</Text>
              </>
            ) : (
              <Text style={styles.slotPlaceholder}>Person 1</Text>
            )}
          </View>
          <Text style={styles.heartIcon}>💕</Text>
          <View style={[styles.selectionSlot, selected[1] && styles.selectionSlotFilled]}>
            {selected[1] ? (
              <>
                <Text style={styles.slotInitial}>{selected[1].name.charAt(0)}</Text>
                <Text style={styles.slotName} numberOfLines={1}>{selected[1].name.split(' ')[0]}</Text>
              </>
            ) : (
              <Text style={styles.slotPlaceholder}>Person 2</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          Select 2 friends ({selected.length}/2 selected)
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤝</Text>
            <Text style={styles.emptyText}>You need at least 2 matches to Ship!</Text>
            <Text style={styles.emptySubText}>Go Rizz more people first 😄</Text>
          </View>
        ) : (
          <View style={styles.chipsGrid}>
            {matches.map((user) => (
              <UserChip
                key={user.id}
                user={user}
                selected={!!selected.find((u) => u.id === user.id)}
                onPress={() => toggle(user)}
              />
            ))}
          </View>
        )}

        {/* Optional message */}
        {selected.length === 2 && (
          <View style={styles.messageSection}>
            <Text style={styles.sectionLabel}>Add a hint (optional)</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder='e.g. "You both love coding and coffee ☕"'
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{message.length}/200</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      {selected.length === 2 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.shipBtn, shipMutation.isPending && styles.shipBtnDisabled]}
            onPress={() => shipMutation.mutate()}
            disabled={shipMutation.isPending}
          >
            {shipMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.shipBtnText}>Ship {selected[0].name.split(' ')[0]} & {selected[1].name.split(' ')[0]}</Text>
                <Text style={styles.shipBtnPrice}> — ₹19</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.anonymousNote}>They won't know it was you 🤫</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.white, fontSize: 18 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  scroll: { padding: spacing.lg },
  infoCard: {
    backgroundColor: 'rgba(108,61,255,0.1)', borderWidth: 1, borderColor: 'rgba(108,61,255,0.3)',
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg,
  },
  infoTitle: { color: colors.white, fontWeight: '600', fontSize: 14, marginBottom: 6 },
  infoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  selectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginBottom: spacing.lg,
  },
  selectionSlot: {
    width: 100, height: 80, borderRadius: radius.lg,
    backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  selectionSlotFilled: { borderColor: colors.accent, borderStyle: 'solid', backgroundColor: 'rgba(255,107,157,0.1)' },
  slotInitial: { fontSize: 24, fontWeight: '700', color: colors.white },
  slotName: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  slotPlaceholder: { color: colors.textMuted, fontSize: 12 },
  heartIcon: { fontSize: 28 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md,
  },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    width: 80, alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: 'rgba(255,107,157,0.1)' },
  chipAvatar: { position: 'relative', marginBottom: 6 },
  chipAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  chipInitial: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.muted, textAlign: 'center', lineHeight: 48,
    fontSize: 20, color: colors.textSecondary, fontWeight: '600',
    overflow: 'hidden',
  },
  selectedTick: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  tickText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  chipName: { color: colors.textSecondary, fontSize: 11, textAlign: 'center' },
  chipNameSelected: { color: colors.accent, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600', marginBottom: spacing.sm },
  emptySubText: { color: colors.textMuted, fontSize: 13 },
  messageSection: { marginTop: spacing.lg },
  messageInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, color: colors.white,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top',
  },
  charCount: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 4 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.lg, paddingBottom: 34, alignItems: 'center',
  },
  shipBtn: {
    backgroundColor: colors.accent, borderRadius: radius.lg,
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%',
  },
  shipBtnDisabled: { opacity: 0.5 },
  shipBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  shipBtnPrice: { color: 'rgba(255,255,255,0.8)', fontWeight: '400', fontSize: 14 },
  anonymousNote: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
});
