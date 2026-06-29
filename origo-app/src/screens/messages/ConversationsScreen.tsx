import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { MessagesStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { User } from '../../types/user.types';
import { formatDistanceToNow } from 'date-fns';

type Nav = StackNavigationProp<MessagesStackParams, 'Conversations'>;

interface Conversation {
  id: string;
  otherUser: User;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}

function ConversationRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const timeStr = conv.lastMessage
    ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })
    : '';

  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.75}>
      {/* Avatar + online dot */}
      <View style={rowStyles.avatarWrapper}>
        <View style={rowStyles.avatar}>
          <Text style={rowStyles.avatarInitial}>{conv.otherUser.name.charAt(0)}</Text>
        </View>
        {conv.otherUser.isOnline && <View style={rowStyles.onlineDot} />}
      </View>

      {/* Text content */}
      <View style={rowStyles.textContent}>
        <View style={rowStyles.topRow}>
          <Text style={[rowStyles.name, conv.unreadCount > 0 && rowStyles.nameUnread]}>
            {conv.otherUser.name}
          </Text>
          {timeStr ? <Text style={rowStyles.time}>{timeStr}</Text> : null}
        </View>
        <View style={rowStyles.bottomRow}>
          <Text
            style={[rowStyles.preview, conv.unreadCount > 0 && rowStyles.previewUnread]}
            numberOfLines={1}
          >
            {conv.lastMessage?.content ?? 'No messages yet'}
          </Text>
          {conv.unreadCount > 0 && (
            <View style={rowStyles.badge}>
              <Text style={rowStyles.badgeText}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  avatarWrapper: { position: 'relative', marginRight: spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 6.5,
    backgroundColor: colors.green, borderWidth: 2, borderColor: colors.background,
  },
  textContent: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  nameUnread: { color: colors.white, fontWeight: '700' },
  time: { fontSize: 11, color: colors.textMuted },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { flex: 1, fontSize: 13, color: colors.textMuted, marginRight: spacing.sm },
  previewUnread: { color: colors.textSecondary, fontWeight: '500' },
  badge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});

export default function ConversationsScreen() {
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await apiClient.get<Conversation[]>('/conversations');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const filtered = (conversations ?? [] as Conversation[]).filter((c: Conversation) =>
    c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.searchToggle}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchBarIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </Text>
          <Text style={styles.emptySub}>
            {searchQuery ? 'Try a different search' : 'Start by Rizzing someone! 😄'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ConversationRow
              conv={item}
              onPress={() => navigation.navigate('Chat', {
                conversationId: item.id,
                otherUser: item.otherUser,
              })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.white },
  searchToggle: { padding: 4 },
  searchIcon: { fontSize: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  searchBarIcon: { fontSize: 14, color: colors.textMuted },
  searchInput: { flex: 1, color: colors.white, fontSize: 14, paddingVertical: 10 },
  clearBtn: { color: colors.textMuted, fontSize: 14, padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.white, textAlign: 'center' },
  emptySub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: spacing.sm },
});
