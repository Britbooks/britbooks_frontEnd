import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, Pressable, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPromptPayload, subscribeAuthPrompt } from '../utils/authPrompt';
import { Colors, Radius, Spacing } from '../constants/Colors';

const NAVY = '#0A1628';
const GOLD = '#C9A84C';

export default function AuthPromptModal() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<AuthPromptPayload | null>(null);

  // Sheet animation
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;

  // Toast animation (slides from top)
  const toastY  = useRef(new Animated.Value(-100)).current;
  const toastOp = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSheet = useCallback((p: AuthPromptPayload) => {
    setPayload(p);
    setVisible(true);
    // Show toast first
    toastY.setValue(-100);
    toastOp.setValue(0);
    Animated.parallel([
      Animated.spring(toastY,  { toValue: 0, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.timing(toastOp, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastY,  { toValue: -100, duration: 260, useNativeDriver: true }),
        Animated.timing(toastOp, { toValue: 0,    duration: 260, useNativeDriver: true }),
      ]).start();
    }, 2200);

    // Slide sheet up
    translateY.setValue(400);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      Animated.timing(backdropOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [backdropOp, toastOp, toastY, translateY]);

  const closeSheet = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 400, duration: 300, useNativeDriver: true }),
      Animated.timing(backdropOp, { toValue: 0,   duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setPayload(null);
      cb?.();
    });
  }, [backdropOp, translateY]);

  useEffect(() => {
    const unsub = subscribeAuthPrompt(openSheet);
    return () => { unsub(); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [openSheet]);

  function goLogin() {
    closeSheet(() => router.push('/(auth)/login'));
  }
  function goSignup() {
    closeSheet(() => router.push('/(auth)/signup'));
  }

  return (
    <>
      {/* ── Toast (top banner) ── */}
      {visible && (
        <Animated.View
          style={[
            styles.toast,
            { top: insets.top + 8, transform: [{ translateY: toastY }], opacity: toastOp },
          ]}
          pointerEvents="none"
        >
          <View style={styles.toastIconWrap}>
            <Ionicons name="lock-closed" size={16} color={GOLD} />
          </View>
          <Text style={styles.toastText} numberOfLines={1}>
            {payload?.message ?? 'Sign in to continue'}
          </Text>
        </Animated.View>
      )}

      {/* ── Bottom sheet modal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSheet()}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOp }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet()} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="person-circle-outline" size={42} color={NAVY} />
          </View>

          {/* Copy */}
          <Text style={styles.title}>Sign in to BritBooks</Text>
          <Text style={styles.sub}>
            {payload?.action
              ? `Create a free account to ${payload.action} and enjoy a personalised reading experience.`
              : 'Create a free account and enjoy a personalised reading experience.'}
          </Text>

          {/* Perks */}
          {[
            { icon: 'heart-outline'    as const, text: 'Save books to your wishlist' },
            { icon: 'bag-check-outline'as const, text: 'Track & manage your orders' },
            { icon: 'star-outline'     as const, text: 'Leave reviews & ratings' },
            { icon: 'pricetag-outline' as const, text: 'Access exclusive deals' },
          ].map(p => (
            <View key={p.text} style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <Ionicons name={p.icon} size={15} color={GOLD} />
              </View>
              <Text style={styles.perkText}>{p.text}</Text>
            </View>
          ))}

          {/* CTA buttons */}
          <TouchableOpacity style={styles.signInBtn} onPress={goLogin} activeOpacity={0.85}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signUpBtn} onPress={goSignup} activeOpacity={0.85}>
            <Text style={styles.signUpBtnText}>Create Free Account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => closeSheet()} style={styles.dismissBtn} activeOpacity={0.7}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Toast
  toast: {
    position: 'absolute',
    left: 16, right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: NAVY,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  toastIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,22,40,0.55)',
  },

  // Sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: NAVY,
    textAlign: 'center', marginBottom: 6,
  },
  sub: {
    fontSize: 14, color: '#64748B', textAlign: 'center',
    lineHeight: 21, marginBottom: 20,
  },

  // Perks
  perkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  perkIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#FFFBEB',
    alignItems: 'center', justifyContent: 'center',
  },
  perkText: { fontSize: 14, color: '#334155', fontWeight: '500' },

  // Buttons
  signInBtn: {
    backgroundColor: NAVY, borderRadius: Radius.lg,
    paddingVertical: 15, alignItems: 'center',
    marginTop: 20,
  },
  signInBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  signUpBtn: {
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: NAVY,
    paddingVertical: 14, alignItems: 'center',
    marginTop: 10,
  },
  signUpBtnText: { fontSize: 15, fontWeight: '700', color: NAVY },

  dismissBtn: { alignItems: 'center', paddingVertical: 14 },
  dismissText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
});
