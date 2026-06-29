import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RizzStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { RizzSession, RizzMessage, RizzViewState, deriveViewState } from '../../types/rizz.types';
import { useAuthStore } from '../../store/authStore';

type RouteT = RouteProp<RizzStackParams, 'RizzChat'>;
type Nav = StackNavigationProp<RizzStackParams, 'RizzChat'>;

// Countdown hook
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

// Progress bar for initiator (5 segments)
function ProgressBar({ filled }: { filled: number }) {
  return (
    <View style={pbStyles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View
          key={n}
          style={[
            pbStyles.seg,
            n <= filled && { backgroundColor: n <= 3 ? colors.primary : colors.amber },
          ]}
        />
      ))}
    </View>
  );
}
const pbStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, flex: 1 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
});

// Status Banner
function StatusBanner({ viewState, otherName }: { viewState: RizzViewState; otherName: string }) {
  if (viewState.role === 'INITIATOR') {
    switch (viewState.phase) {
      case 'COMPOSING':
        return (
          <View style={bannerStyles.banner}>
            <Text style={bannerStyles.text}>
              💬 Send up to <Text style={bannerStyles.highlight}>5 messages</Text> to impress {otherName}
            </Text>
            <Text style={bannerStyles.sub}>{5 - viewState.msgSent} messages remaining</Text>
          </View>
        );
      case 'LAST_MESSAGE':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.amber }]}>
            <Text style={bannerStyles.text}>⚡ Last message! Make it count</Text>
            <Text style={bannerStyles.sub}>1 message remaining</Text>
          </View>
        );
      case 'WAITING':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.amber }]}>
            <Text style={bannerStyles.text}>⏳ Waiting for {otherName} to reply...</Text>
            <Text style={bannerStyles.sub}>They'll see your messages and decide</Text>
          </View>
        );
      case 'UNLOCKED':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.green }]}>
            <Text style={bannerStyles.text}>🎉 Match unlocked! You can now chat freely</Text>
          </View>
        );
      case 'DECLINED':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.error }]}>
            <Text style={bannerStyles.text}>💔 {otherName} didn't connect this time</Text>
          </View>
        );
      case 'EXPIRED':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.textMuted }]}>
            <Text style={bannerStyles.text}>⌛ This rizz session expired</Text>
          </View>
        );
    }
  }

  if (viewState.role === 'TARGET') {
    switch (viewState.phase) {
      case 'READING':
        return (
          <View style={bannerStyles.banner}>
            <Text style={bannerStyles.text}>👀 {viewState.msgCount} message{viewState.msgCount !== 1 ? 's' : ''} from {otherName}</Text>
            <Text style={bannerStyles.sub}>Reply to unlock the conversation</Text>
          </View>
        );
      case 'REPLYING':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.green }]}>
            <Text style={bannerStyles.text}>✍️ You replied! Waiting for match confirmation</Text>
          </View>
        );
      case 'UNLOCKED':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.green }]}>
            <Text style={bannerStyles.text}>🎉 Match unlocked! Conversation is now open</Text>
          </View>
        );
      case 'DECLINED':
        return (
          <View style={[bannerStyles.banner, { borderColor: colors.textMuted }]}>
            <Text style={bannerStyles.text}>You passed on this one. That's okay!</Text>
          </View>
        );
    }
  }

  return null;
}

const bannerStyles = StyleSheet.create({
  banner: {
    backgroundColor: colors.muted,
    borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  text: { color: colors.white, fontSize: 13, fontWeight: '500' },
  sub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  highlight: { color: colors.primary, fontWeight: '700' },
});

// Message bubble
function MessageBubble({ message, isMine }: { message: RizzMessage; isMine: boolean }) {
  return (
    <View style={[msgStyles.row, isMine && msgStyles.rowRight]}>
      <View style={[msgStyles.bubble, isMine ? msgStyles.bubbleMine : msgStyles.bubbleOther]}>
        <Text style={[msgStyles.text, isMine ? msgStyles.textMine : msgStyles.textOther]}>
          {message.content}
        </Text>
        <Text style={msgStyles.time}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const msgStyles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm, alignItems: 'flex-start' },
  rowRight: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, padding: spacing.md },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  text: { fontSize: 15, lineHeight: 21 },
  textMine: { color: colors.white },
  textOther: { color: colors.textPrimary },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 4, alignSelf: 'flex-end' },
});

// Can the current user send a message?
function canSend(viewState: RizzViewState): boolean {
  if (viewState.role === 'INITIATOR') {
    return viewState.phase === 'COMPOSING' || viewState.phase === 'LAST_MESSAGE' || viewState.phase === 'UNLOCKED';
  }
  if (viewState.role === 'TARGET') {
    return viewState.phase === 'READING' || viewState.phase === 'REPLYING' || viewState.phase === 'UNLOCKED';
  }
  return false;
}

export default function RizzChatScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const { sessionId } = route.params;
  const myId = useAuthStore((s) => s.user?.id ?? '');
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList<RizzMessage>>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['rizz-session', sessionId],
    queryFn: async () => {
      const res = await apiClient.get<RizzSession>(`/rizz/sessions/${sessionId}`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const countdown = useCountdown(session?.expiresAt ?? new Date(Date.now() + 86400000).toISOString());

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post<RizzMessage>(`/rizz/sessions/${sessionId}/messages`, { content });
      return res.data;
    },
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['rizz-session', sessionId] });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }, [text, sendMutation]);

  const viewState: RizzViewState | null = session ? deriveViewState(session, myId) : null;
  const otherUser = session ? (session.initiatorId === myId ? session.target : session.initiator) : null;
  const messages: RizzMessage[] = session?.messages ?? [];
  const sendEnabled = viewState ? canSend(viewState) : false;

  const msgCount = viewState?.role === 'INITIATOR' ? session?.initiatorMsgCount ?? 0 : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{otherUser?.name.charAt(0) ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{otherUser?.name ?? 'Loading...'}</Text>
            {otherUser?.isOnline && <Text style={styles.headerOnline}>Online</Text>}
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.countdownText}>⏳ {countdown}</Text>
        </View>
      </View>

      {/* Progress bar (initiator only) */}
      {viewState?.role === 'INITIATOR' && viewState.phase !== 'UNLOCKED' && (
        <View style={styles.progressContainer}>
          <ProgressBar filled={msgCount} />
          <Text style={styles.progressLabel}>{msgCount}/5</Text>
        </View>
      )}

      {/* Status Banner */}
      {viewState && otherUser && (
        <StatusBanner viewState={viewState} otherName={otherUser.name} />
      )}

      {/* Messages */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMine={item.senderId === myId} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>No messages yet. Say something!</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        {sendEnabled ? (
          <>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.sendBtnText}>↑</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.disabledBar}>
            <Text style={styles.disabledText}>
              {viewState?.phase === 'WAITING' ? 'Waiting for reply...' :
               viewState?.phase === 'DECLINED' ? 'This session was declined' :
               viewState?.phase === 'EXPIRED' ? 'Session expired' :
               'Chat locked'}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: colors.white, fontSize: 18 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary + '44', borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  headerName: { color: colors.white, fontWeight: '600', fontSize: 15 },
  headerOnline: { color: colors.green, fontSize: 11 },
  headerRight: {},
  countdownText: { color: colors.amber, fontSize: 12, fontWeight: '500' },

  progressContainer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  progressLabel: { color: colors.textMuted, fontSize: 12, minWidth: 24 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  messageList: { paddingVertical: spacing.md },

  emptyMessages: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 14 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: spacing.md, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, paddingHorizontal: spacing.md,
    paddingVertical: 10, color: colors.white, fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: colors.white, fontSize: 22, fontWeight: '700', marginTop: -2 },

  disabledBar: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md,
  },
  disabledText: { color: colors.textMuted, fontSize: 14 },
});
