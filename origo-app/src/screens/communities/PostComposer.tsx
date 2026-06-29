import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { CommunitiesStackParams } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius } from '../../theme';

type RouteT = RouteProp<CommunitiesStackParams, 'PostComposer'>;

export default function PostComposer() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<{ goBack: () => void }>();
  const { communityId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/communities/${communityId}/posts`, {
        content,
        mediaUrls: images,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      navigation.goBack();
    },
  });

  const pickImages = async () => {
    if (images.length >= 4) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 4));
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const canPost = content.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={() => canPost && !mutation.isPending && mutation.mutate()}
          disabled={!canPost || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{user?.name.charAt(0) ?? '?'}</Text>
          </View>
          <Text style={styles.authorName}>{user?.name}</Text>
        </View>

        {/* Input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
          textAlignVertical="top"
          maxLength={1000}
        />

        {/* Image previews */}
        {images.length > 0 && (
          <ScrollView horizontal style={styles.imagePreviews} showsHorizontalScrollIndicator={false}>
            {images.map((uri, i) => (
              <View key={i} style={styles.previewWrap}>
                <Image source={{ uri }} style={styles.preview} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* Bottom toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, images.length >= 4 && styles.toolBtnDisabled]}
          onPress={pickImages}
          disabled={images.length >= 4}
        >
          <Text style={styles.toolIcon}>📷</Text>
          <Text style={styles.toolLabel}>Photo{images.length > 0 ? ` (${images.length}/4)` : ''}</Text>
        </TouchableOpacity>
        <Text style={styles.charCount}>{content.length}/1000</Text>
      </View>
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
  cancelBtn: { padding: 4 },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
  postBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 18, paddingVertical: 7,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  body: { flex: 1, padding: spacing.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: colors.white, fontWeight: '700', fontSize: 18 },
  authorName: { color: colors.white, fontWeight: '600', fontSize: 14 },
  input: {
    color: colors.white, fontSize: 16, lineHeight: 24,
    minHeight: 120, textAlignVertical: 'top',
  },
  imagePreviews: { marginTop: spacing.md },
  previewWrap: { position: 'relative', marginRight: 10 },
  preview: { width: 120, height: 120, borderRadius: radius.md },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: colors.white, fontSize: 11 },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  toolBtnDisabled: { opacity: 0.4 },
  toolIcon: { fontSize: 20 },
  toolLabel: { color: colors.textSecondary, fontSize: 13 },
  charCount: { color: colors.textMuted, fontSize: 12 },
});
