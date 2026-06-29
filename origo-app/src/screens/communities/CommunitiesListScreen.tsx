import React, { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommunitiesStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';

type Nav = StackNavigationProp<CommunitiesStackParams, 'CommunitiesList'>;

interface Community {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount: number;
  interest?: { name: string; emoji: string; category: string };
  members: { userId: string; role: string }[];
}

const FILTERS = ['All', 'TECH', 'ARTS', 'SPORTS', 'MUSIC', 'GAMING', 'FOOD', 'TRAVEL', 'ACADEMIA', 'SOCIAL'];

export default function CommunitiesListScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const queryClient = useQueryClient();

  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['communities', activeFilter],
    queryFn: async () => {
      const res = await apiClient.get<Community[]>('/communities', {
        params: activeFilter !== 'All' ? { filter: activeFilter } : {},
      });
      return res.data;
    },
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/communities/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });

  const leaveMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/communities/${id}/leave`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });

  const filtered = communities.filter((c: Community) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const joined = filtered.filter((c: Community) => c.members.length > 0);
  const discover = filtered.filter((c: Community) => c.members.length === 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search communities..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={[...joined, ...discover]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            joined.length > 0 ? (
              <View>
                <Text style={styles.sectionTitle}>Your Communities</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.joinedRow}>
                  {joined.map((c: Community) => (
                    <TouchableOpacity key={c.id} style={styles.joinedCard}>
                      <View style={styles.joinedAvatar}>
                        <Text style={styles.joinedEmoji}>{c.interest?.emoji ?? '🏘️'}</Text>
                      </View>
                      <Text style={styles.joinedName} numberOfLines={1}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.sectionTitle}>Discover</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isMember = item.members.length > 0;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
                activeOpacity={0.8}
              >
                <View style={styles.cardAvatar}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cardAvatarImg} />
                  ) : (
                    <Text style={styles.cardEmoji}>{item.interest?.emoji ?? '🏘️'}</Text>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardCount}>👥 {item.memberCount}</Text>
                    {item.interest && (
                      <View style={styles.interestTag}>
                        <Text style={styles.interestTagText}>{item.interest.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.joinBtn, isMember && styles.joinBtnJoined]}
                  onPress={() => isMember ? leaveMutation.mutate(item.id) : joinMutation.mutate(item.id)}
                >
                  <Text style={[styles.joinBtnText, isMember && styles.joinBtnTextJoined]}>
                    {isMember ? 'Joined' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏘️</Text>
              <Text style={styles.emptyText}>No communities found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: colors.white },
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  search: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 10, color: colors.white, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  filterRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.white, marginTop: spacing.sm, marginBottom: spacing.sm },
  joinedRow: { gap: 12, paddingBottom: spacing.md },
  joinedCard: { width: 72, alignItems: 'center' },
  joinedAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  joinedEmoji: { fontSize: 22 },
  joinedName: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  cardAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { color: colors.white, fontWeight: '600', fontSize: 14 },
  cardDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cardCount: { color: colors.textMuted, fontSize: 11 },
  interestTag: { backgroundColor: colors.muted, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  interestTagText: { color: colors.textMuted, fontSize: 10 },
  joinBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  joinBtnJoined: { backgroundColor: colors.primary, borderColor: colors.primary },
  joinBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  joinBtnTextJoined: { color: colors.white },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
