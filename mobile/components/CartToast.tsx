import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartToastPayload, subscribeCartToast } from '../utils/cartToast';
import { Colors } from '../constants/Colors';

const TOAST_MS = 2800;

export default function CartToast() {
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState<CartToastPayload | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.9)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,    duration: 280, useNativeDriver: true }),
      Animated.timing(scale,      { toValue: 0.9,  duration: 280, useNativeDriver: true }),
    ]).start(() => setPayload(null));
  }, [opacity, scale, translateY]);

  const show = useCallback((p: CartToastPayload) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPayload(p);
    translateY.setValue(-100);
    opacity.setValue(0);
    scale.setValue(0.9);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale,      { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(dismiss, TOAST_MS);
  }, [dismiss, opacity, scale, translateY]);

  useEffect(() => {
    const unsub = subscribeCartToast(show);
    return () => { unsub(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [show]);

  if (!payload) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }, { scale }], opacity },
      ]}
      pointerEvents="none"
    >
      {/* left: book thumb or bag icon */}
      <View style={styles.iconWrap}>
        {payload.img ? (
          <Image source={{ uri: payload.img }} style={styles.thumb} contentFit="cover" />
        ) : (
          <Ionicons name="bag-add" size={20} color={Colors.primary} />
        )}
      </View>

      {/* text */}
      <View style={styles.textCol}>
        <Text style={styles.label} numberOfLines={1}>{payload.title}</Text>
        <View style={styles.subRow}>
          <View style={styles.dot} />
          <Text style={styles.sub}>Added to cart</Text>
          {payload.price !== undefined && (
            <Text style={styles.price}> · £{payload.price.toFixed(2)}</Text>
          )}
        </View>
      </View>

      {/* check badge */}
      <View style={styles.check}>
        <Ionicons name="checkmark" size={14} color="#fff" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  sub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  price: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '700',
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
