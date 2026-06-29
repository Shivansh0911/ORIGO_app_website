import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, radius } from '../../theme';

export interface Community {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount: number;
  isPublic: boolean;
  isJoined?: boolean;
  interest?: { name: string; emoji: string };
  collegeName?: string;
}

interface Props {
  community: Community;
  onPress: () => void;
  onJoin: () => void;
  joining?: boolean;
}

export default function CommunityCard({ community, onPress, onJoin, joining }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      {community.imageUrl ? (
        <Image source={{ uri: community.imageUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarEmoji}>{community.interest?.emoji ?? '🏘️'}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{community.name}</Text>
        {community.description ? (
          <Text style={styles.desc} numberOfLines={1}>{community.description}</Text>
        ) : null}
        <View style={styles.meta}>
          <Text style={styles.metaText}>👥 {community.memberCount.toLocaleString()}</Text>
          {community.interest && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{community.interest.emoji} {community.interest.name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Join button */}
      <TouchableOpacity
        style={[styles.joinBtn, community.isJoined && styles.joinedBtn]}
        onPress={onJoin}
        disabled={joining}
      >
        <Text style={[styles.joinText, community.isJoined && styles.joinedText]}>
          {community.isJoined ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: 12, gap: 12,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(108,61,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 26 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.white, marginBottom: 2 },
  desc: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: colors.textMuted, fontSize: 11 },
  tag: {
    backgroundColor: 'rgba(108,61,255,0.15)',
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2,
  },
  tagText: { color: colors.primaryLight, fontSize: 11, fontWeight: '500' },
  joinBtn: {
    borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 6,
  },
  joinedBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  joinText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  joinedText: { color: colors.white },
});
