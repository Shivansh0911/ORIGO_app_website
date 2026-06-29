import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { colors, spacing, radius } from '../../theme';

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
}

interface Props {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onLongPress?: () => void;
}

export default function PostCard({ post, onLike, onComment, onLongPress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 200;
  const displayText = !expanded && isLong ? post.content.slice(0, 200) + '...' : post.content;

  return (
    <View style={styles.card}>
      {/* Author header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {post.author.avatarUrl ? (
            <Image source={{ uri: post.author.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitial}>{post.author.name.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <Text style={styles.authorMeta}>
            @{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Text>
        </View>
        {onLongPress && (
          <TouchableOpacity onLongPress={onLongPress} style={styles.moreBtn}>
            <Text style={styles.moreIcon}>•••</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={styles.content}>{displayText}</Text>
      {isLong && !expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={styles.readMore}>Read more</Text>
        </TouchableOpacity>
      )}

      {/* Media grid */}
      {post.mediaUrls.length > 0 && (
        <View style={styles.mediaGrid}>
          {post.mediaUrls.length === 1 ? (
            <Image source={{ uri: post.mediaUrls[0] }} style={styles.mediaSingle} resizeMode="cover" />
          ) : post.mediaUrls.length === 2 ? (
            <View style={styles.mediaRow}>
              {post.mediaUrls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.mediaHalf} resizeMode="cover" />
              ))}
            </View>
          ) : (
            <View style={styles.mediaRow}>
              <Image source={{ uri: post.mediaUrls[0] }} style={styles.mediaHalf} resizeMode="cover" />
              <View style={styles.mediaHalf}>
                <Image source={{ uri: post.mediaUrls[1] }} style={styles.mediaHalf} resizeMode="cover" />
                {post.mediaUrls.length > 3 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreCount}>+{post.mediaUrls.length - 2}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Action row */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={onLike}>
          <Text style={styles.actionIcon}>{post.isLiked ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionCount}>{post.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={onComment}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Text style={styles.actionIcon}>↗️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm, gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarInitial: { color: colors.textSecondary, fontSize: 18, fontWeight: '600' },
  authorInfo: { flex: 1 },
  authorName: { color: colors.white, fontWeight: '600', fontSize: 14 },
  authorMeta: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  moreBtn: { padding: 4 },
  moreIcon: { color: colors.textMuted, fontSize: 14, letterSpacing: 2 },
  content: {
    color: colors.textSecondary, fontSize: 14, lineHeight: 22,
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  readMore: { color: colors.primary, fontSize: 13, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  mediaGrid: { marginBottom: spacing.sm },
  mediaSingle: { width: '100%', height: 220 },
  mediaRow: { flexDirection: 'row', gap: 2 },
  mediaHalf: { flex: 1, height: 180, position: 'relative' },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreCount: { color: colors.white, fontSize: 24, fontWeight: '700' },
  actions: {
    flexDirection: 'row', gap: spacing.lg,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon: { fontSize: 18 },
  actionCount: { color: colors.textMuted, fontSize: 13 },
});
