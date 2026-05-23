import React, { useRef, useState } from 'react';
import {
  Animated, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ACTIONS = [
  { icon: 'search-outline' as const, label: 'Search', route: '/(tabs)/explore' },
  { icon: 'bag-outline' as const, label: 'Cart', route: '/(tabs)/cart' },
  { icon: 'heart-outline' as const, label: 'Wishlist', route: '/(tabs)/wishlist' },
  { icon: 'person-outline' as const, label: 'Account', route: '/(tabs)/account' },
];

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const { cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();

  function toggle() {
    const toValue = open ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
    setOpen(!open);
  }

  function handleAction(route: string) {
    toggle();
    setTimeout(() => router.push(route as any), 150);
  }

  const rotation = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const fabScale = animation.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });

  const badges: Record<string, number> = {
    '/(tabs)/cart': cartCount,
    '/(tabs)/wishlist': wishlistItems.length,
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {open && (
        <Animated.View
          style={[styles.backdrop, { opacity: animation }]}
          pointerEvents={open ? 'auto' : 'none'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={toggle} />
        </Animated.View>
      )}

      {ACTIONS.map((action, i) => {
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(64 + i * 60)],
        });
        const scale = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });
        const opacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });
        const badge = badges[action.route] ?? 0;

        return (
          <Animated.View
            key={action.route}
            style={[styles.actionWrap, { transform: [{ translateY }, { scale }], opacity }]}
            pointerEvents={open ? 'auto' : 'none'}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAction(action.route)}
              activeOpacity={0.85}
            >
              <Ionicons name={action.icon} size={22} color={Colors.primary} />
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <Animated.View style={{ transform: [{ scale: fabScale }] }}>
        <TouchableOpacity style={styles.fab} onPress={toggle} activeOpacity={0.85}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={28} color={Colors.primary} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    position: 'fixed' as any,
    backgroundColor: 'rgba(10,22,40,0.4)',
    zIndex: -1,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  actionWrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    right: 0,
  },
  actionLabel: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
});
