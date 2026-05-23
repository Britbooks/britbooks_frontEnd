import React, { useState } from 'react';
import {
  ActivityIndicator, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import OtpInput from '../../components/OtpInput';

export default function OtpScreen() {
  const { verifyOtp, loading, error, clearError } = useAuth();
  const [code, setCode] = useState('');

  async function handleVerify() {
    if (code.length < 6) return;
    clearError();
    try {
      await verifyOtp(code);
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="mail-unread-outline" size={40} color={Colors.accent} />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to your email address. Enter it below to continue.
        </Text>

        <View style={styles.otpWrap}>
          <OtpInput value={code} onChange={setCode} length={6} />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.verifyBtn, code.length < 6 && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading || code.length < 6}
        >
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.verifyBtnText}>Verify Code</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.resendLink}> Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  back: { alignSelf: 'flex-start', marginBottom: Spacing.xl },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: { ...Typography.title2, color: Colors.text, marginBottom: Spacing.sm },
  subtitle: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
  },
  otpWrap: { width: '100%', marginBottom: Spacing.xl },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Colors.error}15`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
    width: '100%',
    marginBottom: Spacing.base,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    width: '100%',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { ...Typography.headline, color: Colors.primary },
  resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl },
  resendText: { ...Typography.callout, color: Colors.textSecondary },
  resendLink: { ...Typography.callout, color: Colors.accent, fontWeight: '700' },
});
