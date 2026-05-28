import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { forgotPasswordApi, resetPasswordApi } from '../../services/auth';
import OtpInput from '../../components/OtpInput';

type Step = 'email' | 'reset';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendCode() {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await forgotPasswordApi(email.trim().toLowerCase());
      setUserId(data.userId);
      setStep('reset');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Could not send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (code.length < 6) { setError('Enter the 6-digit code from your email.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await resetPasswordApi(userId, code, newPassword);
      Alert.alert('Password reset', 'Your password has been updated. Please sign in.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={40} color={Colors.accent} />
          </View>

          <Text style={styles.title}>
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? "Enter the email address linked to your account. We'll send you a reset code."
              : 'Enter the 6-digit code we sent to your email and your new password.'}
          </Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 'email' ? (
            <>
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
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendCode} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.primaryBtnText}>Send Reset Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Verification Code</Text>
                <OtpInput value={code} onChange={setCode} length={6} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
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
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat your new password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.backToEmail} onPress={() => { setStep('email'); setError(''); setCode(''); }}>
                <Text style={styles.backToEmailText}>Didn't get the code? Go back</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.lg },
  back: { marginBottom: Spacing.xl },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    alignSelf: 'center',
  },
  title: { ...Typography.title2, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Colors.error}15`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
    marginBottom: Spacing.base,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  field: { gap: Spacing.xs, marginBottom: Spacing.md },
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
  backToEmail: { alignSelf: 'center', marginTop: Spacing.xl },
  backToEmailText: { ...Typography.callout, color: Colors.accent, fontWeight: '600' },
});
