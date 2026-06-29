import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { RizzStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { RizzSession, RizzStatus } from '../../types/rizz.types';

type Nav = StackNavigationProp<RizzStackParams, 'RizzInbox'>;

type TabType = 'incoming' | 'outgoing';

const STATUS_META: Record<RizzStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: colors.primary },
  WAITING: { label: 'Waiting', color: colors.amber },
  ACCEPTED: { label: 'Matched! 🎉', color: colors.green },
  DECLINED: { label: 'Declined', color: colors.error },
  EXPIRED: { label: 'Expired', color: colors.textMuted },
  CANCELLED: { label: 'Cancelled', color: colors.textMuted },
};

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

function SessionCard({ session, isOutgoing, onPress }: { session: RizzSession; isOutgoing: boolean; onPress: () => void }) {
  const other = isOutgoing ? session.target : session.initiator;
  const statusMeta = STATUS_META[session.status];
  const lastMsg = session.messages[session.messages.length - 1];
  const countdown = useCountdown(session.expiresAt);
  const showCountdown = session.status === 'WAITING' || session.status === 'ACTIVE';

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={cardStyles.avatarContainer}>
        <View style={cardStyles.avatarCircle}>
          <Text style={cardStyles.avatarInitial}>{other.name.charAt(0)}</Text>
        </View>
        {other.isOnline && <View style={cardStyles.onlineDot} />}
      </View>

      <View style={cardStyles.content}>
        <View style={cardStyles.topRow}>
          <Text style={cardStyles.name}>{other.name}</Text>
          <View style={[cardStyles.statusPill, { backgroundColor: statusMeta.color + '22', borderColor: statusMeta.color }]}>
            <Text style={[cardStyles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        </View>

        {other.collegeName ? <Text style={cardStyles.college}>{other.collegeName}</Text> : null}

        {lastMsg ? (
          <Text style={cardStyles.preview} numberOfLines={1}>
            {lastMsg.content}
          </Text>
        ) : (
          <Text style={cardStyles.previewMuted}>No messages yet</Text>
        )}

        {showCountdown && (
          <View style={cardStyles.countdownRow}>
            <Text style={cardStyles.countdownIcon}>⏳</Text>
            <Text style={cardStyles.countdown}>{countdown}</Text>
          </View>
        )}

        {isOutgoing && (
          <View style={cardStyles.progressRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View
                key={n}
                style={[
                  cardStyles.progressDot,
                  n <= session.initiatorMsgCount && { backgroundColor: n <= 3 ? colors.primary : colors.amber },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  avatarContainer: { position: 'relative', marginRight: spacing.md },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary + '33',
    borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.green, borderWidth: 2, borderColor: colors.card,
  },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.white },
  statusPill: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  college: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  preview: { color: colors.textSecondary, fontSize: 13 },
  previewMuted: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  countdownIcon: { fontSize: 11 },
  countdown: { color: colors.amber, fontSize: 12, fontWeight: '500' },
  progressRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
});

function EmptyState({ tab }: { tab: TabType }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{tab === 'incoming' ? '📬' : '📤'}</Text>
      <Text style={emptyStyles.title}>
        {tab === 'incoming' ? 'No incoming rizz yet' : 'You haven\'t rizzed anyone yet'}
      </Text>
      <Text style={emptyStyles.sub}>
        {tab === 'incoming'
          ? 'When someone rizzes you, it shows up here'
          : 'Head to Discover and rizz someone you like!'}
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  icon: { fontSize: 56, marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '600', color: colors.white, textAlign: 'center' },
  sub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});

export default function RizzInboxScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const tabUnderline = useRef(new Animated.Value(0)).current;

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['rizz-sessions', activeTab],
    queryFn: async () => {
      const res = await apiClient.get<RizzSession[]>(`/rizz/sessions?type=${activeTab}`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    Animated.timing(tabUnderline, {
      toValue: tab === 'incoming' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const underlineLeft = tabUnderline.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rizz ⚡</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tab} onPress={() => switchTab('incoming')}>
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>Incoming</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => switchTab('outgoing')}>
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.tabTextActive]}>Outgoing</Text>
        </TouchableOpacity>
        <Animated.View style={[styles.tabUnderline, { left: underlineLeft }]} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !sessions || sessions.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              isOutgoing={activeTab === 'outgoing'}
              onPress={() => navigation.navigate('RizzChat', { sessionId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.white },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: colors.border,
    position: 'relative',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabText: { fontSize: 15, color: colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  tabUnderline: {
    position: 'absolute', bottom: 0, width: '50%', height: 2,
    backgroundColor: colors.primary, borderRadius: 1,
  },
  listContent: { paddingTop: spacing.sm, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
