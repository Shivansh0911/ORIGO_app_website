import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { CommunitiesStackParams } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import PostCard, { Post } from '../../components/community/PostCard';
import EventCard, { CommunityEvent } from '../../components/community/EventCard';
import { colors, spacing, radius } from '../../theme';

type RouteT = RouteProp<CommunitiesStackParams, 'CommunityDetail'>;

interface CommunityDetail {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount: number;
  isPublic: boolean;
  userRole?: 'ADMIN' | 'MODERATOR' | 'MEMBER' | null;
  isJoined: boolean;
  interest?: { name: string; emoji: string };
  collegeName?: string;
}

interface Member {
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  user: { id: string; name: string; username: string; avatarUrl?: string; isOnline: boolean };
}

type Tab = 'feed' | 'members' | 'events';

export default function CommunityDetailScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<{ navigate: (s: string, p?: object) => void; goBack: () => void }>();
  const { communityId } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  const { data: community, isLoading: loadingDetail } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const res = await apiClient.get<CommunityDetail>(`/communities/${communityId}`);
      return res.data;
    },
  });

  const { data: membersData } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async () => {
      const res = await apiClient.get<Member[]>(`/communities/${communityId}/members`);
      return res.data;
    },
    enabled: activeTab === 'members',
  });

  const { data: eventsData } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: async () => {
      const res = await apiClient.get<CommunityEvent[]>(`/communities/${communityId}/events`);
      return res.data;
    },
    enabled: activeTab === 'events',
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ['community-posts', communityId],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      const res = await apiClient.get<{ posts: Post[]; nextCursor?: string }>(
        `/communities/${communityId}/posts${params}`
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled: activeTab === 'feed',
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (community?.isJoined) {
        await apiClient.delete(`/communities/${communityId}/members`);
      } else {
        await apiClient.post(`/communities/${communityId}/members`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => apiClient.post(`/communities/${communityId}/posts/${postId}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] }),
  });

  const allPosts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? [];

  if (loadingDetail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!community) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{community.name}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreText}>•••</Text>
        </TouchableOpacity>
      </View>

      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View>
          <View style={styles.heroBanner}>
            {community.imageUrl ? (
              <Image source={{ uri: community.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
            ) : (
              <View style={[styles.bannerImg, styles.bannerFallback]}>
                <Text style={styles.bannerFallbackIcon}>{community.interest?.emoji ?? '🏘️'}</Text>
              </View>
            )}
            <View style={styles.bannerOverlay} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.memberCount}>👥 {community.memberCount.toLocaleString()} members</Text>
            {community.description ? (
              <Text style={styles.description} numberOfLines={3}>{community.description}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.joinBtn, community.isJoined && styles.joinedBtn]}
              onPress={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              <Text style={[styles.joinText, community.isJoined && styles.joinedText]}>
                {community.isJoined ? 'Joined ✓' : 'Join Community'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab bar (sticky) */}
        <View style={styles.tabBar}>
          {(['feed', 'members', 'events'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feed tab */}
        {activeTab === 'feed' && (
          <View>
            {community.isJoined && (
              <TouchableOpacity
                style={styles.createPostBar}
                onPress={() => navigation.navigate('PostComposer', { communityId })}
              >
                <View style={styles.createPostAvatar}>
                  <Text style={styles.createPostInitial}>{user?.name.charAt(0) ?? '?'}</Text>
                </View>
                <Text style={styles.createPostPlaceholder}>What's happening on campus?</Text>
              </TouchableOpacity>
            )}
            {postsQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : allPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
              </View>
            ) : (
              allPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => likeMutation.mutate(post.id)}
                  onComment={() => {}}
                />
              ))
            )}
          </View>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
          <View style={styles.membersGrid}>
            {(membersData ?? []).map((m) => (
              <View key={m.userId} style={styles.memberCell}>
                <View style={styles.memberAvatarWrap}>
                  {m.user.avatarUrl ? (
                    <Image source={{ uri: m.user.avatarUrl }} style={styles.memberAvatar} />
                  ) : (
                    <View style={[styles.memberAvatar, styles.memberAvatarFallback]}>
                      <Text style={styles.memberInitial}>{m.user.name.charAt(0)}</Text>
                    </View>
                  )}
                  {m.role !== 'MEMBER' && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{m.role === 'ADMIN' ? 'A' : 'M'}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberName} numberOfLines={1}>{m.user.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Events tab */}
        {activeTab === 'events' && (
          <View style={styles.eventsList}>
            {(eventsData ?? []).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>No upcoming events</Text>
              </View>
            ) : (
              (eventsData ?? []).map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Admin FAB */}
      {community.userRole === 'ADMIN' && (
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backBtnText: { color: colors.white, fontSize: 18 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.white },
  moreBtn: { padding: 4 },
  moreText: { color: colors.textMuted, fontSize: 16, letterSpacing: 2 },

  heroBanner: { height: 180, position: 'relative' },
  bannerImg: { width: '100%', height: 180 },
  bannerFallback: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  bannerFallbackIcon: { fontSize: 64 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },

  heroInfo: { padding: spacing.lg },
  communityName: { fontSize: 22, fontWeight: '700', color: colors.white, marginBottom: 4 },
  memberCount: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  joinBtn: {
    borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.full, paddingVertical: 10,
    alignItems: 'center',
  },
  joinedBtn: { backgroundColor: colors.primary },
  joinText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  joinedText: { color: colors.white },

  tabBar: {
    flexDirection: 'row', backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '600' },

  createPostBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: 2,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: 12,
  },
  createPostAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  createPostInitial: { color: colors.white, fontWeight: '700', fontSize: 16 },
  createPostPlaceholder: { color: colors.textMuted, fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: 15 },

  membersGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: spacing.md, gap: 16,
  },
  memberCell: { width: '28%', alignItems: 'center' },
  memberAvatarWrap: { position: 'relative', marginBottom: 6 },
  memberAvatar: { width: 70, height: 70, borderRadius: 35 },
  memberAvatarFallback: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 28, color: colors.textSecondary, fontWeight: '600' },
  roleBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  roleBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  memberName: { color: colors.textSecondary, fontSize: 11, textAlign: 'center' },

  eventsList: { padding: spacing.md },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
  },
  fabText: { color: colors.white, fontSize: 28, fontWeight: '700', lineHeight: 32 },
});
