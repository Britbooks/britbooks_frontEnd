import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  value?: string;
}

function MenuItem({ icon, label, onPress, color = Colors.text, value }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
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

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
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
          <MenuItem
            icon="receipt-outline"
            label="Order History"
            onPress={() => router.push('/orders/')}
          />
          <MenuItem
            icon="location-outline"
            label="Track Order"
            onPress={() => router.push('/orders/')}
          />
        </MenuSection>

        <MenuSection title="My Account">
          <MenuItem
            icon="home-outline"
            label="Saved Addresses"
            onPress={() => router.push('/addresses/')}
          />
          <MenuItem
            icon="heart-outline"
            label="Wishlist"
            onPress={() => router.push('/(tabs)/wishlist')}
          />
          <MenuItem
            icon="star-outline"
            label="My Reviews"
            onPress={() => router.push('/reviews/')}
          />
        </MenuSection>

        <MenuSection title="Support">
          <MenuItem
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => {}}
          />
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="Contact Support"
            onPress={() => router.push('/support')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => router.push('/privacy-policy')}
          />
          <MenuItem
            icon="shield-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
        </MenuSection>

        <MenuSection>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            color={Colors.error}
          />
        </MenuSection>

        <Text style={styles.version}>BritBooks v1.0.0</Text>
      </ScrollView>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  guestAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  guestTitle: { ...Typography.title2, color: Colors.text },
  guestSub: { ...Typography.callout, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  signInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['3xl'],
    marginTop: Spacing.md,
  },
  signInBtnText: { ...Typography.headline, color: Colors.white },
  signUpLink: { ...Typography.callout, color: Colors.accent, fontWeight: '700', marginTop: Spacing.sm },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.primary,
    margin: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { ...Typography.title3, color: Colors.white },
  profileEmail: { ...Typography.callout, color: 'rgba(255,255,255,0.6)' },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.accent}25`,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  adminText: { fontSize: 11, fontWeight: '700', color: Colors.accent },
  section: { marginBottom: Spacing.sm, paddingHorizontal: Spacing.base },
  sectionTitle: {
    ...Typography.captionBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { ...Typography.callout, color: Colors.textMuted },
  version: { textAlign: 'center', ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.base },
});
