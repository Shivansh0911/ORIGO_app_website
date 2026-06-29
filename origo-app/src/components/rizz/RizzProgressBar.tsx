import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface Props {
  used: number;
  total?: number;
}

export default function RizzProgressBar({ used, total = 5 }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.segmentsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <Segment key={i} filled={i < used} index={i} used={used} total={total} />
        ))}
      </View>
      <Text style={styles.label}>Message {used} of {total}</Text>
    </View>
  );
}

function Segment({ filled, index, used, total }: { filled: boolean; index: number; used: number; total: number }) {
  const scaleAnim = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: filled ? 1 : 0,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();
  }, [filled]);

  const isAmber = index >= 3;
  const fillColor = isAmber ? colors.amber : colors.primary;
  const fillWidth = scaleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.segmentTrack}>
      <Animated.View style={[styles.segmentFill, { width: fillWidth, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  segmentsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  segmentTrack: {
    flex: 1, height: 6, backgroundColor: '#2A2A45',
    borderRadius: 3, overflow: 'hidden',
  },
  segmentFill: { height: '100%', borderRadius: 3 },
  label: { textAlign: 'center', color: colors.textMuted, fontSize: 11 },
});
