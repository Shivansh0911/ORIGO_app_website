import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function ProfileSetupScreen() {
  const navigation = useNavigation<{ navigate: (screen: string) => void; reset: (state: object) => void }>();
  const { refreshUser } = useAuthStore();
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images' as ImagePicker.MediaTypeOptions, allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  const mutation = useMutation({
    mutationFn: () => apiClient.patch('/users/me', { bio, gender: gender || undefined }),
    onSuccess: async () => {
      await refreshUser();
      navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
    },
  });

  const GENDERS = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((s) => <View key={s} style={[styles.progressStep, styles.progressActive]} />)}
      </View>

      <Text style={styles.heading}>Set up your profile</Text>
      <Text style={styles.sub}>First impressions matter</Text>

      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        )}
        <View style={styles.avatarEdit}>
          <Text style={styles.avatarEditText}>✎</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about yourself..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{bio.length}/200</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity key={g} style={[styles.genderPill, gender === g && styles.genderPillSelected]} onPress={() => setGender(g)}>
              <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>
                {g.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Let's Go 🚀</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingTop: 60 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.xl },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressActive: { backgroundColor: colors.primary },
  heading: { fontSize: 22, fontWeight: '600', color: colors.white },
  sub: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xl },
  avatarContainer: { alignSelf: 'center', marginBottom: spacing.xl, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.primary },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  avatarIcon: { fontSize: 48 },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarEditText: { color: colors.white, fontSize: 14 },
  fieldContainer: { marginBottom: spacing.lg },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  bioInput: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.white, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
  charCount: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 4 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  genderPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { color: colors.textSecondary, fontSize: 13 },
  genderTextSelected: { color: colors.white, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
