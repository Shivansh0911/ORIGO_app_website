import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export default function SplashScreen() {
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(wordmarkOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.wordmark, { opacity: wordmarkOpacity }]}>Origo</Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Smart Socialising for Campus Life
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 42, fontWeight: '700', color: colors.white, letterSpacing: 1 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
});
