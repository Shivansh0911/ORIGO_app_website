import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { MessagesStackParams } from '../../navigation/types';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius } from '../../theme';
import { format, isToday, isYesterday } from 'date-fns';

type Route = RouteProp<MessagesStackParams, 'Chat'>;

function formatTime(dateStr: string) {
  return format(new Date(dateStr), 'h:mm a');
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

function TypingIndicator() {
  const dot1 = useRef(0);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % 3), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.typingRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.typingDot, frame === i && styles.typingDotActive]} />
      ))}
    </View>
  );
}

export default function ChatScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { otherUser, conversationId } = route.params;
  const { user } = useAuthStore();
  const { messages, sendMessage, loadMore, hasMore, isLoading, typingUsers, isSending, onTypingStart, markRead } = useChat(conversationId);
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList>(null);

  useEffect(() => { markRead(); }, [markRead]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    await sendMessage(content);
  };

  const renderItem = ({ item, index }: { item: typeof messages[0]; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const prev = messages[index - 1];
    const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(item.createdAt);

    return (
      <>
        {showDay && (
          <View style={styles.dayRow}>
            <Text style={styles.dayText}>{dayLabel(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
          {!isOwn && (
            <View style={styles.avatarSmall}>
              {otherUser.avatarUrl ? (
                <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{otherUser.name.charAt(0)}</Text>
              )}
            </View>
          )}
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            {!item.isDeleted ? (
              <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{item.content}</Text>
            ) : (
              <Text style={styles.deletedText}>Message deleted</Text>
            )}
            <Text style={[styles.timestamp, isOwn && styles.timestampOwn]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.avatarMed}>
          {otherUser.avatarUrl ? (
            <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatarMedImg} />
          ) : (
            <Text style={styles.avatarMedInitial}>{otherUser.name.charAt(0)}</Text>
          )}
          {otherUser.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser.name}</Text>
          <Text style={styles.headerStatus}>{otherUser.isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onEndReached={() => hasMore && loadMore()}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              typingUsers.length > 0 ? (
                <View style={styles.typingContainer}>
                  <TypingIndicator />
                  <Text style={styles.typingText}>{otherUser.name} is typing...</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={(t) => { setText(t); onTypingStart(); }}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  backText: { color: colors.white, fontSize: 22 },
  avatarMed: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarMedImg: { width: 40, height: 40, borderRadius: 20 },
  avatarMedInitial: { color: colors.white, fontWeight: '700', fontSize: 16 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green, borderWidth: 1.5, borderColor: colors.background },
  headerInfo: { marginLeft: spacing.sm, flex: 1 },
  headerName: { color: colors.white, fontWeight: '600', fontSize: 15 },
  headerStatus: { color: colors.textMuted, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.sm },
  dayRow: { alignItems: 'center', marginVertical: spacing.sm },
  dayText: { color: colors.textMuted, fontSize: 11, backgroundColor: colors.muted, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6, maxWidth: '80%' },
  bubbleRowOwn: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  avatarImg: { width: 28, height: 28, borderRadius: 14 },
  avatarInitial: { color: colors.white, fontSize: 12, fontWeight: '700' },
  bubble: { padding: 10, borderRadius: 18, maxWidth: '100%' },
  bubbleOwn: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.textSecondary, fontSize: 14 },
  bubbleTextOwn: { color: colors.white },
  deletedText: { color: colors.textMuted, fontStyle: 'italic', fontSize: 13 },
  timestamp: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  timestampOwn: { color: 'rgba(255,255,255,0.6)' },
  typingContainer: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: 8 },
  typingRow: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  typingDotActive: { backgroundColor: colors.primary, transform: [{ scale: 1.3 }] },
  typingText: { color: colors.textMuted, fontSize: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.white, fontSize: 14, maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendIcon: { color: colors.white, fontSize: 16 },
});
