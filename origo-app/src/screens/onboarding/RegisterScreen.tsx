import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation } from '@tanstack/react-query';
import { OnboardingStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';
import { Storage } from '../../utils/storage';
import { useAuthStore } from '../../store/authStore';

type Nav = StackNavigationProp<OnboardingStackParams, 'Register'>;

interface FormState {
  name: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const strengthColors = ['#EF4444', '#F97316', '#F59E0B', '#10B981'];
  return (
    <View style={pwStyles.container}>
      {checks.map((_, i) => (
        <View key={i} style={[pwStyles.segment, { backgroundColor: i < strength ? strengthColors[strength - 1] : '#2A2A45' }]} />
      ))}
    </View>
  );
}

const pwStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4, marginTop: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
});

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { setUser: _setUser } = useAuthStore();
  const [form, setForm] = useState<FormState>({ name: '', username: '', email: '', password: '', dateOfBirth: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const update = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const isValid = form.name.length >= 2 && form.username.length >= 3 && form.email.includes('@') &&
    form.password.length >= 8 && form.dateOfBirth.length > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ accessToken: string; refreshToken: string; userId?: string }>('/auth/register', form);
      return res.data;
    },
    onSuccess: async (data) => {
      Storage.setAccessToken(data.accessToken);
      Storage.setRefreshToken(data.refreshToken);
      if (data.userId) Storage.setUserId(data.userId);
      navigation.navigate('CollegeVerify');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Registration failed';
      Alert.alert('Error', msg);
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={[styles.progressStep, s === 1 && styles.progressActive]} />
          ))}
        </View>

        <Text style={styles.heading}>Create Account</Text>

        {(['name', 'username', 'email'] as const).map((field) => (
          <View key={field} style={styles.fieldContainer}>
            <Text style={styles.label}>{field === 'name' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}</Text>
            <View style={styles.inputRow}>
              {field === 'username' && <Text style={styles.prefix}>@</Text>}
              <TextInput
                style={[styles.input, field === 'username' ? styles.inputWithPrefix : undefined, errors[field] ? styles.inputError : undefined]}
                value={form[field]}
                onChangeText={(v) => update(field, v)}
                placeholder={field === 'name' ? 'Your full name' : field}
                placeholderTextColor={colors.textMuted}
                keyboardType={field === 'email' ? 'email-address' : 'default'}
                autoCapitalize={field === 'email' || field === 'username' ? 'none' : 'words'}
              />
            </View>
            {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
          </View>
        ))}

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.password ? styles.inputError : undefined]}
              value={form.password}
              onChangeText={(v) => update('password', v)}
              secureTextEntry={!showPassword}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {form.password.length > 0 && <PasswordStrengthBar password={form.password} />}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={form.dateOfBirth}
            onChangeText={(v) => update('dateOfBirth', v)}
            placeholder="YYYY-MM-DD (must be 18+)"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <Text style={styles.termsText}>
          By creating an account you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
          onPress={() => !mutation.isPending && isValid && mutation.mutate()}
          disabled={!isValid || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingTop: 60 },
  back: { marginBottom: spacing.lg },
  backText: { color: colors.textSecondary, fontSize: 16 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.xl },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressActive: { backgroundColor: colors.primary },
  heading: { fontSize: 24, fontWeight: '600', color: colors.white, marginBottom: spacing.xl },
  fieldContainer: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  prefix: { color: colors.textMuted, fontSize: 16, marginRight: 4, paddingLeft: 12 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.white, fontSize: 15, flex: 1 },
  inputWithPrefix: { borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 12, marginTop: 4 },
  eyeBtn: { padding: 12 },
  eyeText: { fontSize: 18 },
  termsText: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: spacing.xl },
  termsLink: { color: colors.primary, textDecorationLine: 'underline' },
  primaryBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
