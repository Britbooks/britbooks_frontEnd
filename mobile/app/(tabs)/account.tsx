import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { Image } from 'expo-image';
import { useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { fetchUserProfile, setup2FAApi, enable2FAApi, disable2FAApi } from '../../services/auth';
import { apiClient } from '../../services/api';
import { ENDPOINTS } from '../../constants/Api';
import OtpInput from '../../components/OtpInput';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  value?: string;
}

function MenuRow({ icon, label, onPress, color = Colors.text, value }: MenuItem) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value !== undefined && <Text style={styles.menuValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

type TwoFaStep = 'idle' | 'setup' | 'enable' | 'disable';

export default function AccountScreen() {
  const { user, token, logout, updateLocalUser } = useAuth();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState<TwoFaStep>('idle');
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  function openEditProfile() {
    setEditName(user?.fullName ?? '');
    setEditEmail(user?.email ?? '');
    setEditError('');
    setEditVisible(true);
  }

  async function saveProfile() {
    if (!user || !token) return;
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    if (!trimmedName) { setEditError('Name cannot be empty.'); return; }
    if (!trimmedEmail) { setEditError('Email cannot be empty.'); return; }
    setEditLoading(true);
    setEditError('');
    try {
      await apiClient.put(ENDPOINTS.users.profile(user.userId), {
        fullName: trimmedName,
        email: trimmedEmail,
      });
      await updateLocalUser({ ...user, fullName: trimmedName, email: trimmedEmail });
      setEditVisible(false);
    } catch (e: any) {
      setEditError(e.response?.data?.message ?? 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  }

  // Load profile to get totpEnabled state
  useEffect(() => {
    if (!user?.userId || !token) return;
    fetchUserProfile(user.userId, token)
      .then((d) => setTotpEnabled(d?.totpEnabled ?? false))
      .catch(() => {});
  }, [user?.userId, token]);

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  async function handle2FASetup() {
    if (!token) return;
    setTotpLoading(true);
    setTotpError('');
    try {
      const data = await setup2FAApi(token);
      setQrCode(data.qrCode);
      setTotpSecret(data.secret);
      setTotpCode('');
      setTwoFaStep('setup');
    } catch (e: any) {
      setTotpError(e.response?.data?.message ?? 'Failed to start 2FA setup.');
    } finally {
      setTotpLoading(false);
    }
  }

  async function handle2FAEnable() {
    if (!token || totpCode.length < 6) return;
    setTotpLoading(true);
    setTotpError('');
    try {
      await enable2FAApi(totpCode, token);
      setTotpEnabled(true);
      setTwoFaStep('idle');
      setTotpCode('');
      Alert.alert('2FA Enabled', 'Two-factor authentication is now active on your account.');
    } catch (e: any) {
      setTotpError(e.response?.data?.message ?? 'Incorrect code. Try again.');
    } finally {
      setTotpLoading(false);
    }
  }

  async function handle2FADisable() {
    if (!token || totpCode.length < 6) return;
    setTotpLoading(true);
    setTotpError('');
    try {
      await disable2FAApi(totpCode, token);
      setTotpEnabled(false);
      setTwoFaStep('idle');
      setTotpCode('');
      Alert.alert('2FA Disabled', 'Two-factor authentication has been removed from your account.');
    } catch (e: any) {
      setTotpError(e.response?.data?.message ?? 'Incorrect code. Try again.');
    } finally {
      setTotpLoading(false);
    }
  }

  function closeTwoFaModal() {
    setTwoFaStep('idle');
    setTotpCode('');
    setTotpError('');
    setQrCode('');
    setTotpSecret('');
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-outline" size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.guestTitle}>Join BritBooks</Text>
          <Text style={styles.guestSub}>Sign in to access your orders, wishlist, and more</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signUpLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            {user.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.accent} />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
        </View>

        <MenuSection title="My Orders">
          <MenuRow icon="receipt-outline"  label="Order History" onPress={() => router.push('/orders/')} />
          <MenuRow icon="location-outline" label="Track Order"   onPress={() => router.push('/orders/')} />
        </MenuSection>

        <MenuSection title="My Account">
          <MenuRow icon="person-circle-outline" label="Edit Profile"    onPress={openEditProfile} />
          <MenuRow icon="home-outline"          label="Saved Addresses" onPress={() => router.push('/addresses/')} />
          <MenuRow icon="heart-outline"         label="Wishlist"        onPress={() => router.push('/(tabs)/wishlist')} />
          <MenuRow icon="star-outline"          label="My Reviews"      onPress={() => router.push('/reviews/')} />
        </MenuSection>

        <MenuSection title="Security">
          <MenuRow
            icon="shield-checkmark-outline"
            label="Two-Factor Authentication"
            value={totpEnabled ? 'On' : 'Off'}
            color={totpEnabled ? Colors.success : Colors.text}
            onPress={() => {
              setTotpError('');
              setTotpCode('');
              if (totpEnabled) {
                setTwoFaStep('disable');
              } else {
                handle2FASetup();
              }
            }}
          />
          <MenuRow
            icon="key-outline"
            label="Change Password"
            onPress={() => router.push('/(auth)/forgot-password')}
          />
        </MenuSection>

        <MenuSection title="Support">
          <MenuRow icon="help-circle-outline"        label="Help & FAQ"       onPress={() => router.push('/support')} />
          <MenuRow icon="chatbubble-ellipses-outline" label="Contact Support" onPress={() => router.push('/support')} />
          <MenuRow icon="document-text-outline"      label="Privacy Policy"  onPress={() => router.push('/privacy-policy')} />
        </MenuSection>

        <MenuSection>
          <MenuRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} color={Colors.error} />
        </MenuSection>

        <Text style={styles.version}>BritBooks v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Full Name</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={[styles.modalFieldLabel, { marginTop: Spacing.md }]}>Email</Text>
            <TextInput
              style={styles.editInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {!!editError && <Text style={styles.modalError}>{editError}</Text>}

            <TouchableOpacity
              style={[styles.modalBtn, editLoading && styles.modalBtnDisabled]}
              onPress={saveProfile}
              disabled={editLoading}
            >
              {editLoading
                ? <ActivityIndicator color={Colors.primary} />
                : <Text style={styles.modalBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 2FA Modal ── */}
      <Modal visible={twoFaStep !== 'idle'} transparent animationType="slide" onRequestClose={closeTwoFaModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {twoFaStep === 'setup' ? 'Set Up Authenticator' : 'Disable 2FA'}
              </Text>
              <TouchableOpacity onPress={closeTwoFaModal} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {totpLoading && twoFaStep === 'idle' ? (
              <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
            ) : twoFaStep === 'setup' ? (
              <>
                <Text style={styles.modalSub}>
                  Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code to activate.
                </Text>
                {!!qrCode && (
                  <Image
                    source={{ uri: qrCode }}
                    style={styles.qrCode}
                    contentFit="contain"
                  />
                )}
                {!!totpSecret && (
                  <View style={styles.secretBox}>
                    <Text style={styles.secretLabel}>Manual key</Text>
                    <Text style={styles.secretText} selectable>{totpSecret}</Text>
                  </View>
                )}
                <Text style={styles.modalFieldLabel}>Verification Code</Text>
                <OtpInput value={totpCode} onChange={setTotpCode} length={6} />
                {!!totpError && <Text style={styles.modalError}>{totpError}</Text>}
                <TouchableOpacity
                  style={[styles.modalBtn, totpCode.length < 6 && styles.modalBtnDisabled]}
                  onPress={handle2FAEnable}
                  disabled={totpLoading || totpCode.length < 6}
                >
                  {totpLoading
                    ? <ActivityIndicator color={Colors.primary} />
                    : <Text style={styles.modalBtnText}>Verify &amp; Enable</Text>}
                </TouchableOpacity>
              </>
            ) : twoFaStep === 'disable' ? (
              <>
                <Text style={styles.modalSub}>
                  Enter the current code from your authenticator app to turn off 2FA.
                </Text>
                <Text style={styles.modalFieldLabel}>Authenticator Code</Text>
                <OtpInput value={totpCode} onChange={setTotpCode} length={6} />
                {!!totpError && <Text style={styles.modalError}>{totpError}</Text>}
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnDanger, totpCode.length < 6 && styles.modalBtnDisabled]}
                  onPress={handle2FADisable}
                  disabled={totpLoading || totpCode.length < 6}
                >
                  {totpLoading
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={[styles.modalBtnText, { color: Colors.white }]}>Disable 2FA</Text>}
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.title2, color: Colors.text },
  scroll: { paddingBottom: Spacing['3xl'] },

  guestContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing['2xl'], gap: Spacing.md,
  },
  guestAvatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  guestTitle: { ...Typography.title2, color: Colors.text },
  guestSub: { ...Typography.callout, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  signInBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing['3xl'], marginTop: Spacing.md,
  },
  signInBtnText: { ...Typography.headline, color: Colors.white },
  signUpLink: { ...Typography.callout, color: Colors.accent, fontWeight: '700', marginTop: Spacing.sm },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.base,
    backgroundColor: Colors.primary, margin: Spacing.base,
    borderRadius: Radius.xl, padding: Spacing.xl,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { ...Typography.title3, color: Colors.white },
  profileEmail: { ...Typography.callout, color: 'rgba(255,255,255,0.6)' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: `${Colors.accent}25`, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  adminText: { fontSize: 11, fontWeight: '700', color: Colors.accent },

  section: { marginBottom: Spacing.sm, paddingHorizontal: Spacing.base },
  sectionTitle: {
    ...Typography.captionBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: Spacing.sm, paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { ...Typography.callout, color: Colors.textMuted },

  version: { textAlign: 'center', ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.base },

  /* ── 2FA Modal ── */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.base,
  },
  modalTitle: { ...Typography.title3, color: Colors.text },
  modalSub: {
    ...Typography.callout, color: Colors.textSecondary,
    lineHeight: 22, marginBottom: Spacing.xl,
  },
  qrCode: { width: 200, height: 200, alignSelf: 'center', marginBottom: Spacing.base },
  secretBox: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  secretLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  secretText: { fontFamily: 'monospace', fontSize: 13, color: Colors.text, letterSpacing: 1 },
  modalFieldLabel: {
    ...Typography.captionBold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  modalError: { ...Typography.callout, color: Colors.error, marginTop: Spacing.sm },
  modalBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    paddingVertical: Spacing.base, alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalBtnDanger: { backgroundColor: Colors.error, shadowColor: Colors.error },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { ...Typography.headline, color: Colors.primary, fontWeight: '800' },
  editInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.text,
    marginTop: 4,
  },
});
