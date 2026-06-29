import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RizzViewState } from '../../types/rizz.types';
import { colors, spacing } from '../../theme';

interface Props {
  viewState: RizzViewState;
  targetName?: string;
  initiatorName?: string;
  expiresAt?: string;
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m left`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return <Text style={styles.countdownText}>{timeLeft}</Text>;
}

export default function RizzStatusBanner({ viewState, targetName, initiatorName, expiresAt }: Props) {
  let bg: string;
  let icon: string;
  let text: string;

  switch (viewState.phase) {
    case 'COMPOSING':
      bg = 'rgba(108,61,255,0.15)';
      icon = '✨';
      text = `Show your vibe ✨ — ${5 - viewState.msgSent} message${5 - viewState.msgSent === 1 ? '' : 's'} left`;
      break;
    case 'LAST_MESSAGE':
      bg = 'rgba(245,158,11,0.2)';
      icon = '⚡';
      text = 'Last message! Make it count.';
      break;
    case 'WAITING':
      bg = '#2A2A45';
      icon = '⏳';
      text = `Waiting for ${targetName ?? 'them'} to reply`;
      break;
    case 'UNLOCKED':
      bg = 'rgba(16,185,129,0.2)';
      icon = '🎉';
      text = "You're connected! Full chat unlocked.";
      break;
    case 'DECLINED':
      bg = '#1A1A2E';
      icon = '💔';
      text = `${viewState.role === 'INITIATOR' ? (targetName ?? 'They') : 'You'} didn't feel the vibe this time.`;
      break;
    case 'EXPIRED':
      bg = '#1A1A2E';
      icon = '⏰';
      text = 'This session expired.';
      break;
    case 'READING':
      bg = 'rgba(108,61,255,0.1)';
      icon = '💬';
      text = `${viewState.msgCount} message${viewState.msgCount === 1 ? '' : 's'} from ${initiatorName ?? 'them'}`;
      break;
    case 'REPLYING':
      bg = 'rgba(16,185,129,0.15)';
      icon = '💬';
      text = 'You replied — unlocking full chat!';
      break;
    default:
      return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text} numberOfLines={2}>{text}</Text>
      {viewState.phase === 'WAITING' && expiresAt && (
        <ExpiryCountdown expiresAt={expiresAt} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    gap: 8,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  countdownText: { color: colors.amber, fontSize: 12, fontWeight: '600' },
});
