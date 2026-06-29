import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { format } from 'date-fns';
import { colors, spacing, radius } from '../../theme';

export interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  ticketPrice?: number;
  attendeeCount: number;
  maxAttendees?: number;
  venue?: string;
  isOnline: boolean;
  scheduledAt: string;
}

interface Props {
  event: CommunityEvent;
  onPress: () => void;
  onRsvp?: () => void;
}

export default function EventCard({ event, onPress, onRsvp }: Props) {
  const dateStr = format(new Date(event.scheduledAt), 'EEE, MMM d · h:mm a');
  const isFree = !event.ticketPrice || event.ticketPrice === 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Banner image */}
      <View style={styles.banner}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
        ) : (
          <View style={[styles.bannerImg, styles.bannerFallback]}>
            <Text style={styles.bannerFallbackIcon}>{event.isOnline ? '💻' : '🎉'}</Text>
          </View>
        )}
        {/* Date pill */}
        <View style={styles.datePill}>
          <Text style={styles.datePillText}>{format(new Date(event.scheduledAt), 'MMM d')}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {event.isOnline ? '🌐 Online' : `📍 ${event.venue ?? 'TBD'}`}
          </Text>
          <Text style={styles.metaText}>👥 {event.attendeeCount} going</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{isFree ? '🎟️ Free' : `🎟️ ₹${event.ticketPrice}`}</Text>
          {onRsvp && (
            <TouchableOpacity style={styles.rsvpBtn} onPress={onRsvp}>
              <Text style={styles.rsvpText}>{isFree ? 'RSVP' : 'Get Ticket'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12, overflow: 'hidden',
  },
  banner: { position: 'relative', height: 140 },
  bannerImg: { width: '100%', height: 140 },
  bannerFallback: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  bannerFallbackIcon: { fontSize: 48 },
  datePill: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  datePillText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  content: { padding: spacing.md },
  title: { fontSize: 16, fontWeight: '600', color: colors.white, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metaText: { color: colors.textMuted, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  rsvpBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 18, paddingVertical: 7,
  },
  rsvpText: { color: colors.white, fontSize: 13, fontWeight: '600' },
});
