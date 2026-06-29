import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation } from '@tanstack/react-query';
import { OnboardingStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { apiClient } from '../../api/client';

type Nav = StackNavigationProp<OnboardingStackParams, 'CollegeVerify'>;

export default function CollegeVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const [collegeEmail, setCollegeEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const sendOtpMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/verify-college-email', { collegeEmail }),
    onSuccess: () => {
      setOtpSent(true);
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((c) => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
      }, 1000);
    },
    onError: () => Alert.alert('Error', 'Failed to send OTP'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/confirm-college-otp', { otp: otp.join('') }),
    onSuccess: () => navigation.navigate('InterestPicker'),
    onError: () => Alert.alert('Error', 'Invalid OTP'),
  });

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d) && newOtp.join('').length === 6) {
      verifyOtpMutation.mutate();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((s) => <View key={s} style={[styles.progressStep, s <= 2 && styles.progressActive]} />)}
      </View>

      <Text style={styles.heading}>Verify Your College</Text>
      <Text style={styles.sub}>Get the ✓ Verified badge</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>College Email</Text>
        <TextInput
          style={styles.input}
          value={collegeEmail}
          onChangeText={setCollegeEmail}
          placeholder="you@college.edu.in"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!otpSent}
        />
        {!otpSent && (
          <TouchableOpacity
            style={[styles.sendBtn, !collegeEmail.includes('@') && styles.sendBtnDisabled]}
            onPress={() => collegeEmail.includes('@') && sendOtpMutation.mutate()}
            disabled={!collegeEmail.includes('@') || sendOtpMutation.isPending}
          >
            {sendOtpMutation.isPending ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.sendBtnText}>Send OTP</Text>}
          </TouchableOpacity>
        )}
      </View>

      {otpSent && (
        <View style={styles.otpSection}>
          <Text style={styles.label}>Enter 6-digit OTP</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={styles.otpBox}
                value={digit}
                onChangeText={(t) => handleOtpChange(t.slice(-1), i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>
          {verifyOtpMutation.isPending && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
          <TouchableOpacity disabled={countdown > 0} onPress={() => sendOtpMutation.mutate()}>
            <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('InterestPicker')} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: 60 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.xl },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressActive: { backgroundColor: colors.primary },
  heading: { fontSize: 22, fontWeight: '600', color: colors.white },
  sub: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xl },
  fieldContainer: { marginBottom: spacing.lg },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.white, fontSize: 15 },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 12, alignItems: 'center', marginTop: 8 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: colors.white, fontWeight: '600' },
  otpSection: { marginTop: spacing.lg },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: spacing.md },
  otpBox: { width: 46, height: 54, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, color: colors.white, fontSize: 22, fontWeight: '700' },
  resendText: { color: colors.primary, textAlign: 'center', fontSize: 14 },
  resendDisabled: { color: colors.textMuted },
  skipBtn: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  skipText: { color: colors.textMuted, fontSize: 14, textDecorationLine: 'underline' },
});
