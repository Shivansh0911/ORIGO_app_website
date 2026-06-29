import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParams } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';

const { height } = Dimensions.get('window');
type Nav = StackNavigationProp<OnboardingStackParams, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <LinearGradient colors={['#1A0533', '#4F46E5']} style={styles.container}>
      <View style={styles.illustrationContainer}>
        <View style={styles.avatarGroup}>
          <View style={[styles.avatar, { backgroundColor: '#6C3DFF', marginTop: 30 }]} />
          <View style={[styles.avatar, { backgroundColor: '#FF6B9D', width: 70, height: 70, borderRadius: 35 }]} />
          <View style={[styles.avatar, { backgroundColor: '#8B5CF6', marginTop: 20 }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.headline}>Meet. Belong. Connect.</Text>
        <Text style={styles.sub}>
          Campus connections built on real interests, not algorithms.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.primaryBtnText}>Join Origo</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signInText}>Already have an account? <Text style={styles.underline}>Sign In</Text></Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  illustrationContainer: { height: height * 0.42, alignItems: 'center', justifyContent: 'center' },
  avatarGroup: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  content: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  headline: { fontSize: 32, fontWeight: '700', color: colors.white, textAlign: 'center' },
  sub: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  primaryBtn: { backgroundColor: colors.primary, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  signInText: { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
  underline: { textDecorationLine: 'underline', color: colors.textSecondary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, marginHorizontal: spacing.sm, fontSize: 12 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 12, height: 48, gap: 8 },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 14, fontWeight: '600', color: '#333' },
});
