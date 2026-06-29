import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  messageType: 'TEXT' | 'IMAGE' | 'STICKER' | 'SYSTEM';
  mediaUrl?: string;
  isRead?: boolean;
  isDeleted?: boolean;
}

interface Props {
  message: Message;
  isOwn: boolean;
  isLast?: boolean;
  onLongPress?: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function MessageBubble({ message, isOwn, isLast, onLongPress }: Props) {
  if (message.messageType === 'SYSTEM') {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={onLongPress}
      style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}
    >
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {message.isDeleted ? (
          <Text style={styles.deletedText}>This message was deleted</Text>
        ) : message.messageType === 'IMAGE' && message.mediaUrl ? (
          <Image source={{ uri: message.mediaUrl }} style={styles.imageMsg} resizeMode="cover" />
        ) : message.messageType === 'STICKER' && message.mediaUrl ? (
          <Image source={{ uri: message.mediaUrl }} style={styles.sticker} resizeMode="contain" />
        ) : (
          <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
            {message.content}
          </Text>
        )}
      </View>

      <View style={[styles.meta, isOwn ? styles.metaOwn : styles.metaOther]}>
        <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
        {isOwn && isLast && (
          <Text style={[styles.readReceipt, message.isRead ? styles.readBlue : undefined]}>
            {message.isRead ? '✓✓' : '✓'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 2, paddingHorizontal: spacing.md, maxWidth: '80%' },
  rowOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },

  text: { fontSize: 15, lineHeight: 22 },
  textOwn: { color: colors.white },
  textOther: { color: colors.white },
  deletedText: { color: colors.textMuted, fontSize: 14, fontStyle: 'italic' },

  imageMsg: { width: 220, height: 160, borderRadius: radius.md },
  sticker: { width: 100, height: 100 },

  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, paddingHorizontal: 2 },
  metaOwn: { justifyContent: 'flex-end' },
  metaOther: { justifyContent: 'flex-start' },
  time: { fontSize: 10, color: colors.textMuted },
  readReceipt: { fontSize: 11, color: colors.textMuted },
  readBlue: { color: '#60A5FA' },

  systemRow: { alignItems: 'center', marginVertical: spacing.sm },
  systemText: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
});
