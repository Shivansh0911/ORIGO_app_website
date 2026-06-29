import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation } from '@tanstack/react-query';
import { OnboardingStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';

type Nav = StackNavigationProp<OnboardingStackParams, 'InterestPicker'>;

const ALL_INTERESTS = [
  { id: '1', name: 'Coding', emoji: '💻' },
  { id: '2', name: 'UI/UX', emoji: '🎨' },
  { id: '3', name: 'AI/ML', emoji: '🤖' },
  { id: '4', name: 'Photography', emoji: '📷' },
  { id: '5', name: 'Filmmaking', emoji: '🎬' },
  { id: '6', name: 'Dance', emoji: '💃' },
  { id: '7', name: 'Music', emoji: '🎵' },
  { id: '8', name: 'Guitar', emoji: '🎸' },
  { id: '9', name: 'Singing', emoji: '🎤' },
  { id: '10', name: 'Cricket', emoji: '🏏' },
  { id: '11', name: 'Football', emoji: '⚽' },
  { id: '12', name: 'Badminton', emoji: '🏸' },
  { id: '13', name: 'Basketball', emoji: '🏀' },
  { id: '14', name: 'Chess', emoji: '♟️' },
  { id: '15', name: 'Gaming', emoji: '🎮' },
  { id: '16', name: 'Esports', emoji: '🕹️' },
  { id: '17', name: 'Anime', emoji: '🌸' },
  { id: '18', name: 'Books', emoji: '📚' },
  { id: '19', name: 'Writing', emoji: '✍️' },
  { id: '20', name: 'Poetry', emoji: '📝' },
  { id: '21', name: 'Traveling', emoji: '✈️' },
  { id: '22', name: 'Trekking', emoji: '🥾' },
  { id: '23', name: 'Cooking', emoji: '🍳' },
  { id: '24', name: 'Baking', emoji: '🧁' },
  { id: '25', name: 'Fitness', emoji: '💪' },
  { id: '26', name: 'Yoga', emoji: '🧘' },
  { id: '27', name: 'Comedy', emoji: '😂' },
  { id: '28', name: 'Theatre', emoji: '🎭' },
  { id: '29', name: 'Painting', emoji: '🖌️' },
  { id: '30', name: 'Astronomy', emoji: '🔭' },
  { id: '31', name: 'Finance', emoji: '💰' },
  { id: '32', name: 'Entrepreneurship', emoji: '🚀' },
  { id: '33', name: 'Debate', emoji: '🎙️' },
  { id: '34', name: 'MUNs', emoji: '🌐' },
  { id: '35', name: 'Volunteering', emoji: '🤝' },
  { id: '36', name: 'Fashion', emoji: '👗' },
  { id: '37', name: 'Memes', emoji: '😆' },
  { id: '38', name: 'K-Pop', emoji: '🎵' },
  { id: '39', name: 'Hip-Hop', emoji: '🎧' },
  { id: '40', name: 'EDM', emoji: '🎶' },
  { id: '41', name: 'Café-hopping', emoji: '☕' },
  { id: '42', name: 'Road Trips', emoji: '🚗' },
  { id: '43', name: 'Study Groups', emoji: '📖' },
  { id: '44', name: 'Research', emoji: '🔬' },
];

export default function InterestPickerScreen() {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const btnOpacity = React.useRef(new Animated.Value(0)).current;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 10) { next.add(id); }
      if (next.size >= 3) {
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      } else {
        Animated.timing(btnOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () => apiClient.put('/users/me/interests', { interestIds: Array.from(selected) }),
    onSuccess: () => navigation.navigate('LookingFor'),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>What are you into?</Text>
          <Text style={styles.sub}>Pick at least 3 interests</Text>
        </View>
        <Text style={styles.counter}>{selected.size}/10</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.pillGrid} showsVerticalScrollIndicator={false}>
        {ALL_INTERESTS.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[styles.pill, selected.has(interest.id) && styles.pillSelected]}
            onPress={() => toggle(interest.id)}
          >
            <Text style={styles.pillEmoji}>{interest.emoji}</Text>
            <Text style={[styles.pillText, selected.has(interest.id) && styles.pillTextSelected]}>{interest.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Animated.View style={[styles.btnContainer, { opacity: btnOpacity }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Continue</Text>}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.xl, paddingTop: 60 },
  heading: { fontSize: 22, fontWeight: '600', color: colors.white },
  sub: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  counter: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 10, paddingBottom: 100 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillEmoji: { fontSize: 16 },
  pillText: { color: colors.white, fontSize: 13, fontWeight: '500' },
  pillTextSelected: { color: colors.white },
  btnContainer: { position: 'absolute', bottom: 30, left: spacing.xl, right: spacing.xl },
  primaryBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
