import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions, Easing,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_H * 0.4);

const COL_GAP = 8;
const CARD_W = (SCREEN_W - COL_GAP * 3) / 2;
const CARD_H = 180;
const ITEM_H = CARD_H + COL_GAP;

const SIG = '?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D';
const CDN = 'http://choicetextileimages.blob.core.windows.net/img-1/';

const LEFT_CARDS = [
  { uri: `${CDN}stand_1547728_jpg.jpg${SIG}`, label: 'Fiction' },
  { uri: `${CDN}stand_595562_jpg.jpg${SIG}`, label: 'History' },
  { uri: 'https://books.google.com/books/content?id=levT0AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', label: 'Mystery & Thriller' },
  { uri: `${CDN}stand_355902_jpg.jpg${SIG}`, label: 'Travel' },
  { uri: `${CDN}stand_1092933_jpg.jpg${SIG}`, label: 'Science' },
  { uri: `${CDN}stand_423514_jpg.jpg${SIG}`, label: 'Biography' },
];

const RIGHT_CARDS = [
  { uri: `${CDN}stand_1042181_jpg.jpg${SIG}`, label: 'Romance' },
  { uri: `${CDN}stand_94593_jpg.jpg${SIG}`, label: 'Fantasy' },
  { uri: 'https://books.google.com/books/content?id=EUz7pwAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', label: 'Health & Wellness' },
  { uri: `${CDN}stand_837421_jpg.jpg${SIG}`, label: 'Education' },
  { uri: `${CDN}stand_1004118_jpg.jpg${SIG}`, label: "Children's" },
  { uri: `${CDN}stand_1105643_jpg.jpg${SIG}`, label: 'Philosophy' },
];

const LOOP_H = LEFT_CARDS.length * ITEM_H;
const COL_LEFT = [...LEFT_CARDS, ...LEFT_CARDS];
const COL_RIGHT = [...RIGHT_CARDS, ...RIGHT_CARDS];

function ScrollColumn({ cards, scrollUp, startOffset = 0 }: {
  cards: typeof COL_LEFT;
  scrollUp: boolean;
  startOffset?: number;
}) {
  const anim = useRef(new Animated.Value(startOffset)).current;

  useEffect(() => {
    const toValue = scrollUp ? startOffset - LOOP_H : startOffset + LOOP_H;
    Animated.loop(
      Animated.timing(anim, {
        toValue,
        duration: 18000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: anim }] }}>
      {cards.map((card, i) => (
        <View key={i} style={styles.adCard}>
          <Image
            source={{ uri: card.uri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.adCardOverlay} />
          <Text style={styles.adCardLabel}>{card.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

export default function SignupScreen() {
  const { register, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  function update(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSignup() {
    if (!form.fullName || !form.email || !form.phoneNumber || !form.password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    clearError();
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Animated hero ── */}
          <View style={styles.hero}>
            <View style={styles.columns}>
              <View style={styles.col}>
                <ScrollColumn cards={COL_LEFT} scrollUp startOffset={0} />
              </View>
              <View style={styles.col}>
                <ScrollColumn cards={COL_RIGHT} scrollUp={false} startOffset={-LOOP_H} />
              </View>
            </View>

            <View style={[StyleSheet.absoluteFillObject, styles.overlayBase]} />
            <View style={[StyleSheet.absoluteFillObject, styles.overlayBottom]} />

            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </TouchableOpacity>

            {/* Logo + tagline */}
            <View style={styles.heroContent}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={styles.tagline}>Join thousands of book lovers</Text>
            </View>
          </View>

          {/* ── Form card ── */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSub}>Fill in your details to get started</Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {[
              { key: 'fullName',    label: 'Full Name',     icon: 'person-outline',      placeholder: 'John Smith',        keyboard: 'default' as const },
              { key: 'email',       label: 'Email Address', icon: 'mail-outline',         placeholder: 'you@example.com',   keyboard: 'email-address' as const },
              { key: 'phoneNumber', label: 'Phone Number',  icon: 'call-outline',         placeholder: '+44 7700 900000',   keyboard: 'phone-pad' as const },
            ].map(({ key, label, icon, placeholder, keyboard }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name={icon as any} size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={form[key as keyof typeof form]}
                    onChangeText={(v) => update(key as keyof typeof form, v)}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={keyboard}
                    autoCapitalize={key === 'email' ? 'none' : 'words'}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={form.password}
                  onChangeText={(v) => update('password', v)}
                  placeholder="Create a strong password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={8}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={form.confirmPassword}
                  onChangeText={(v) => update('confirmPassword', v)}
                  placeholder="Repeat your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.footerLink}> Sign in</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    height: HERO_H,
    overflow: 'hidden',
    backgroundColor: Colors.primaryLight,
  },
  columns: {
    flexDirection: 'row',
    gap: COL_GAP,
    paddingHorizontal: COL_GAP,
    paddingTop: COL_GAP,
  },
  col: { flex: 1, overflow: 'hidden' },
  adCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: COL_GAP,
    justifyContent: 'flex-end',
  },
  adCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,22,40,0.42)',
  },
  adCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    padding: Spacing.sm,
    letterSpacing: 0.3,
  },
  overlayBase: { backgroundColor: 'rgba(10,22,40,0.35)' },
  overlayBottom: { top: '50%', backgroundColor: 'rgba(10,22,40,0.82)' },

  backBtn: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logo: { width: 160, height: 64 },
  tagline: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },

  // Form
  form: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: Spacing.xl,
    gap: Spacing.base,
  },
  formTitle: { ...Typography.title2, color: Colors.text, fontWeight: '800' },
  formSub: { ...Typography.callout, color: Colors.textSecondary, marginBottom: Spacing.xs },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Colors.error}15`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },

  field: { gap: Spacing.xs },
  label: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, padding: 0 },

  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { ...Typography.headline, color: Colors.primary, fontWeight: '800' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...Typography.callout, color: Colors.textSecondary },
  footerLink: { ...Typography.callout, color: Colors.accent, fontWeight: '700' },
  terms: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.accent },
});
