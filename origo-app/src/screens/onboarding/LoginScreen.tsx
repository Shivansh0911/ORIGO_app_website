import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation } from '@tanstack/react-query';
import { OnboardingStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { Storage } from '../../utils/storage';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types/user.types';

type Nav = StackNavigationProp<OnboardingStackParams, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ accessToken: string; refreshToken: string; userId: string }>('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: async (data) => {
      Storage.setAccessToken(data.accessToken);
      Storage.setRefreshToken(data.refreshToken);
      Storage.setUserId(data.userId);
      const userRes = await apiClient.get<User>('/users/me');
      setUser(userRes.data);
    },
    onError: () => Alert.alert('Error', 'Invalid email or password'),
  });

  const isValid = email.includes('@') && password.length >= 6;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.sub}>Sign in to continue</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
              <Text>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
          onPress={() => isValid && mutation.mutate()}
          disabled={!isValid || mutation.isPending}
        >
          {mutation.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchLink}>Join Origo</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, paddingTop: 80 },
  back: { marginBottom: spacing.xl },
  backText: { color: colors.textSecondary, fontSize: 16 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.white },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xl },
  fieldContainer: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.white, fontSize: 15, flex: 1 },
  eyeBtn: { padding: 12 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.xl },
  forgotText: { color: colors.primary, fontSize: 13 },
  primaryBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  switchText: { color: colors.textMuted, textAlign: 'center', fontSize: 14 },
  switchLink: { color: colors.primary },
});
