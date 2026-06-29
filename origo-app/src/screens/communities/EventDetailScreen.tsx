import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CommunitiesStackParams } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { colors, spacing, radius } from '../../theme';

type RouteT = RouteProp<CommunitiesStackParams, 'EventDetail'>;

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  ticketPrice?: number;
  maxAttendees?: number;
  attendeeCount: number;
  venue?: string;
  isOnline: boolean;
  scheduledAt: string;
  isRsvped?: boolean;
  attendees?: { id: string; name: string; avatarUrl?: string }[];
}

export default function EventDetailScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<{ goBack: () => void }>();
  const { eventId } = route.params;

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await apiClient.get<EventDetail>(`/events/${eventId}`);
      return res.data;
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/events/${eventId}/rsvp`);
    },
    onError: () => Alert.alert('Error', 'Could not RSVP. Please try again.'),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!event) return null;

  const isFree = !event.ticketPrice || event.ticketPrice === 0;
  const dateStr = format(new Date(event.scheduledAt), 'EEEE, MMMM d, yyyy');
  const timeStr = format(new Date(event.scheduledAt), 'h:mm a');

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.hero}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]}>
              <Text style={styles.heroFallbackIcon}>{event.isOnline ? '💻' : '🎉'}</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />
          <Text style={styles.heroTitle}>{event.title}</Text>
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          {/* Info rows */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <View>
              <Text style={styles.infoMain}>{dateStr}</Text>
              <Text style={styles.infoSub}>{timeStr}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>{event.isOnline ? '🌐' : '📍'}</Text>
            <Text style={styles.infoMain}>{event.isOnline ? 'Online Event' : (event.venue ?? 'Venue TBD')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎟️</Text>
            <Text style={styles.infoMain}>{isFree ? 'Free Event' : `₹${event.ticketPrice}`}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👥</Text>
            <Text style={styles.infoMain}>
              {event.attendeeCount} attending
              {event.maxAttendees ? ` · ${event.maxAttendees - event.attendeeCount} spots left` : ''}
            </Text>
          </View>

          {/* Description */}
          {event.description ? (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>About this event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          ) : null}

          {/* Attendees preview */}
          {event.attendees && event.attendees.length > 0 && (
            <View style={styles.attendeesSection}>
              <Text style={styles.sectionTitle}>Attendees</Text>
              <View style={styles.avatarStack}>
                {event.attendees.slice(0, 5).map((a, i) => (
                  <View key={a.id} style={[styles.stackAvatar, { marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i }]}>
                    {a.avatarUrl ? (
                      <Image source={{ uri: a.avatarUrl }} style={styles.stackAvatarImg} />
                    ) : (
                      <View style={[styles.stackAvatarImg, styles.stackAvatarFallback]}>
                        <Text style={styles.stackInitial}>{a.name.charAt(0)}</Text>
                      </View>
                    )}
                  </View>
                ))}
                {event.attendeeCount > 5 && (
                  <Text style={styles.moreText}>+{event.attendeeCount - 5} more</Text>
                )}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.rsvpBtn, event.isRsvped && styles.rsvpedBtn]}
          onPress={() => !event.isRsvped && rsvpMutation.mutate()}
          disabled={rsvpMutation.isPending || event.isRsvped}
        >
          {rsvpMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.rsvpText}>
              {event.isRsvped ? '✓ You\'re going!' : isFree ? 'RSVP for Free' : `Get Ticket — ₹${event.ticketPrice}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  backBtn: {
    position: 'absolute', top: 52, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(13,13,20,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.white, fontSize: 20 },
  hero: { height: 220, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { width: '100%', height: 220 },
  heroFallback: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  heroFallbackIcon: { fontSize: 64 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroTitle: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    fontSize: 22, fontWeight: '700', color: colors.white,
  },
  infoSection: { padding: spacing.lg },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginBottom: spacing.md,
  },
  infoIcon: { fontSize: 20, marginTop: 1 },
  infoMain: { fontSize: 15, color: colors.white, fontWeight: '500' },
  infoSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  descSection: { marginTop: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  attendeesSection: { marginTop: spacing.md },
  avatarStack: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  stackAvatar: { borderWidth: 2, borderColor: colors.background, borderRadius: 20 },
  stackAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  stackAvatarFallback: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  stackInitial: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  moreText: { color: colors.textMuted, fontSize: 13, marginLeft: 10 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.lg, paddingBottom: 34,
  },
  rsvpBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  rsvpedBtn: { backgroundColor: colors.green },
  rsvpText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
