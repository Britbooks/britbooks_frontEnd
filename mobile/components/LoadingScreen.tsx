import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');
const LOGO_W = width * 0.52;
const LOGO_H = width * 0.28;

const TAGLINES = [
  'Finding your next great read...',
  'Curating your perfect shelf...',
  'Books are on their way...',
  'Loading a world of stories...',
];

export default function LoadingScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(16)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;

  const floatY = useRef(new Animated.Value(0)).current;

  const [taglineIndex, setTaglineIndex] = useState(0);
  const taglineOpacity = useRef(new Animated.Value(1)).current;

  const makeDotBounce = (val: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: -10, duration: 320, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoY, { toValue: 0, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    // Gentle logo float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Bouncing dots (staggered)
    makeDotBounce(dot1Y, 0).start();
    makeDotBounce(dot2Y, 160).start();
    makeDotBounce(dot3Y, 320).start();

    // Cycle taglines every 2.2s
    const interval = setInterval(() => {
      Animated.timing(taglineOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTaglineIndex(i => (i + 1) % TAGLINES.length);
        Animated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Soft background blobs */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      {/* Logo with float */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ translateY: Animated.add(logoY, floatY) }, { scale: logoScale }],
        }}
      >
        <Animated.Image
          source={require('../assets/logobritr.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Bouncing dots */}
      <View style={styles.dotsRow}>
        {[dot1Y, dot2Y, dot3Y].map((val, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: val }] }]}
          />
        ))}
      </View>

      {/* Rotating tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        {TAGLINES[taglineIndex]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.accent,
    opacity: 0.08,
  },
  blobTop: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
  },
  blobBottom: {
    width: 220,
    height: 220,
    bottom: -60,
    left: -50,
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },
});
