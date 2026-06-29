import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { colors, spacing, radius } from '../../theme';

interface Props {
  sessionId: string;
  onDismiss: () => void;
}

export default function IcebreakerPrompt({ sessionId, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { data } = useQuery({
    queryKey: ['icebreaker', sessionId],
    queryFn: async () => {
      const res = await apiClient.get<{ prompt: string }>(`/rizz/sessions/${sessionId}/icebreaker`);
      return res.data;
    },
  });

  useEffect(() => {
    if (data && !dismissed) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [data]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 60, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setDismissed(true);
      onDismiss();
    });
  };

  if (!data || dismissed) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <Text style={styles.bulb}>💡</Text>
      <Text style={styles.prompt} numberOfLines={3}>{data.prompt}</Text>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(108,61,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(108,61,255,0.3)',
    borderRadius: radius.md,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    padding: spacing.sm, gap: spacing.sm,
  },
  bulb: { fontSize: 20 },
  prompt: { flex: 1, color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  closeBtn: { padding: 4 },
  closeText: { color: colors.textMuted, fontSize: 14 },
});
