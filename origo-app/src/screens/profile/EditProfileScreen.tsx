import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { colors, spacing, radius } from '../../theme';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

type Gender = typeof GENDER_OPTIONS[number]['value'];

export default function EditProfileScreen() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const { user, refreshUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [gender, setGender] = useState<Gender>((user?.gender as Gender) ?? 'PREFER_NOT_TO_SAY');
  const [collegeName, setCollegeName] = useState(user?.collegeName ?? '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUrl);
  const [avatarChanged, setAvatarChanged] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/users/me', { name, bio, gender, collegeName });
      if (avatarChanged && avatarUri) {
        const formData = new FormData();
        formData.append('avatar', { uri: avatarUri, type: 'image/jpeg', name: 'avatar.jpg' } as unknown as Blob);
        await apiClient.post('/users/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: async () => {
      await refreshUser();
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Could not save changes. Please try again.'),
  });

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const hasChanges =
    name !== user?.name ||
    bio !== (user?.bio ?? '') ||
    gender !== (user?.gender ?? 'PREFER_NOT_TO_SAY') ||
    collegeName !== (user?.collegeName ?? '') ||
    avatarChanged;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          onPress={() => hasChanges && !mutation.isPending && mutation.mutate()}
          disabled={!hasChanges || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar}>
          <View style={styles.avatarRing}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Bio</Text>
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell your campus who you are..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
        </View>

        {/* College */}
        <View style={styles.field}>
          <Text style={styles.label}>College</Text>
          <TextInput
            style={styles.input}
            value={collegeName}
            onChangeText={setCollegeName}
            placeholder="Your college or university"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderOptions}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.genderPill, gender === opt.value && styles.genderPillActive]}
                onPress={() => setGender(opt.value)}
              >
                <Text style={[styles.genderText, gender === opt.value && styles.genderTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 18, paddingVertical: 7,
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  scroll: { padding: spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarRing: {
    width: 102, height: 102, borderRadius: 51, padding: 3,
    backgroundColor: colors.primary, marginBottom: spacing.sm,
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, color: colors.white, fontWeight: '700' },
  changePhotoText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  field: { marginBottom: spacing.lg },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  charCount: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.white, fontSize: 15,
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  genderOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderPill: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  genderPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { color: colors.textSecondary, fontSize: 13 },
  genderTextActive: { color: colors.white, fontWeight: '600' },
});
