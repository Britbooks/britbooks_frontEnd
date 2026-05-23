import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/Colors';

export default function SkeletonCard({ width = 148 }: { width?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { width, opacity }]}>
      <View style={[styles.image, { height: width * 1.4 }]} />
      <View style={styles.info}>
        <View style={[styles.line, { width: '90%' }]} />
        <View style={[styles.line, { width: '70%' }]} />
        <View style={[styles.line, { width: '50%', backgroundColor: Colors.accentLight }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  image: {
    backgroundColor: Colors.skeleton,
    width: '100%',
  },
  info: {
    padding: Spacing.sm,
    gap: 6,
  },
  line: {
    height: 10,
    backgroundColor: Colors.skeleton,
    borderRadius: Radius.sm,
  },
});
