import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { colors, spacing, radius } from '../../theme';

function SettingRow({
  icon, label, value, onPress, isSwitch, switchValue, onSwitchChange, danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={isSwitch || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        ) : onPress ? (
          <Text style={styles.rowChevron}>›</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const { user, clearAuth } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [discoverable, setDiscoverable] = useState(true);

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiClient.delete('/auth/account'),
    onSuccess: () => clearAuth(),
    onError: () => Alert.alert('Error', 'Could not delete account. Please contact support.'),
  });

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data and cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  };

  const confirmSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: clearAuth },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Account */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          <SettingRow icon="👤" label="Name" value={user?.name} />
          <SettingRow icon="📧" label="Email" value={user?.email} />
          <SettingRow
            icon="🎓"
            label="College"
            value={user?.collegeName ?? 'Not set'}
          />
          <SettingRow
            icon="✓"
            label="Verification Status"
            value={user?.isVerified ? 'Verified' : 'Not verified'}
          />
        </View>

        {/* Privacy */}
        <SectionHeader title="Privacy" />
        <View style={styles.section}>
          <SettingRow
            icon="👁️"
            label="Show Online Status"
            isSwitch
            switchValue={showOnline}
            onSwitchChange={setShowOnline}
          />
          <SettingRow
            icon="⏱️"
            label="Show Last Seen"
            isSwitch
            switchValue={showLastSeen}
            onSwitchChange={setShowLastSeen}
          />
          <SettingRow
            icon="🔍"
            label="Discoverable"
            isSwitch
            switchValue={discoverable}
            onSwitchChange={setDiscoverable}
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.section}>
          <SettingRow
            icon="🔔"
            label="Push Notifications"
            isSwitch
            switchValue={notifications}
            onSwitchChange={setNotifications}
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.section}>
          <SettingRow icon="📄" label="Terms of Service" onPress={() => {}} />
          <SettingRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="ℹ️" label="App Version" value="1.0.0" />
        </View>

        {/* Danger zone */}
        <SectionHeader title="Account Actions" />
        <View style={styles.section}>
          <SettingRow
            icon="🚪"
            label="Sign Out"
            onPress={confirmSignOut}
            danger
          />
          <SettingRow
            icon="🗑️"
            label="Delete Account"
            onPress={confirmDeleteAccount}
            danger
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.white, fontSize: 18 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  scroll: { paddingBottom: 40 },
  sectionHeader: {
    color: colors.textMuted, fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 8,
  },
  section: {
    backgroundColor: colors.card,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowIcon: { fontSize: 18, marginRight: 14, width: 26 },
  rowLabel: { flex: 1, fontSize: 15, color: colors.white },
  dangerText: { color: colors.error },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { color: colors.textMuted, fontSize: 14 },
  rowChevron: { color: colors.textMuted, fontSize: 20, lineHeight: 22 },
});
