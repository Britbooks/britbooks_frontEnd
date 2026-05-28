import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { GOOGLE_WEB_CLIENT_ID, FACEBOOK_APP_ID } from '../../constants/Api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, socialLogin, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  const [googleRequest, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  const [fbRequest, fbResponse, fbPrompt] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params.id_token;
      if (idToken) {
        setSocialLoading('google');
        socialLogin('google', idToken).catch(() => {}).finally(() => setSocialLoading(null));
      }
    }
  }, [googleResponse]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const accessToken = fbResponse.params.access_token;
      if (accessToken) {
        setSocialLoading('facebook');
        socialLogin('facebook', accessToken).catch(() => {}).finally(() => setSocialLoading(null));
      }
    }
  }, [fbResponse]);

  async function handleGoogleSignIn() {
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Not configured', 'Google sign-in is not configured yet.');
      return;
    }
    clearError();
    await googlePrompt();
  }

  async function handleFacebookSignIn() {
    if (!FACEBOOK_APP_ID) {
      Alert.alert('Not configured', 'Facebook sign-in is not configured yet.');
      return;
    }
    clearError();
    await fbPrompt();
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    clearError();
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // error shown via state
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Top section ── */}
          <View style={styles.top}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.tagline}>Your favourite bookstore, in your pocket</Text>
          </View>

          {/* ── Form card ── */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSub}>Sign in to your account</Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={8}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGoogleSignIn}
                disabled={!googleRequest || loading || !!socialLoading}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color={Colors.text} size="small" />
                ) : (
                  <>
                    <FontAwesome name="google" size={18} color="#DB4437" />
                    <Text style={styles.socialBtnText}>Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleFacebookSignIn}
                disabled={!fbRequest || loading || !!socialLoading}
              >
                {socialLoading === 'facebook' ? (
                  <ActivityIndicator color={Colors.text} size="small" />
                ) : (
                  <>
                    <FontAwesome name="facebook" size={18} color="#1877F2" />
                    <Text style={styles.socialBtnText}>Facebook</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.footerLink}> Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1 },

  top: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logo: { width: 180, height: 72 },
  tagline: {
    ...Typography.callout,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  form: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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

  forgotLink: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { ...Typography.callout, color: Colors.accent, fontWeight: '600' },

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

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.caption, color: Colors.textMuted },

  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  socialBtnText: { ...Typography.callout, color: Colors.text, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...Typography.callout, color: Colors.textSecondary },
  footerLink: { ...Typography.callout, color: Colors.accent, fontWeight: '700' },
});
