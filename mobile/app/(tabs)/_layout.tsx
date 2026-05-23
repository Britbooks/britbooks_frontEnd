import React, { useEffect, useRef, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated, Dimensions, Modal, PanResponder,
  Pressable, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { subscribeFabVisible } from '../../utils/fabVisibility';

const { width: SW, height: SH } = Dimensions.get('window');
const FAB_SIZE = 34;
const ITEM_H   = 56;
const ITEM_GAP = 8;
const EDGE     = 18;

const ACTIONS = [
  { icon: 'chatbubble-ellipses' as const, label: 'Live Chat',         sub: 'Talk to Alex now',       color: '#EF4444', route: '/chat'    },
  { icon: 'cube-outline'        as const, label: 'Track my Order',    sub: 'Check order status',     color: '#3B82F6', route: '/chat'    },
  { icon: 'refresh-outline'     as const, label: 'Returns & Refunds', sub: 'Start a return easily',  color: '#F97316', route: '/chat'    },
  { icon: 'help-circle-outline' as const, label: 'Help & Support',    sub: 'Browse FAQs',            color: '#8B5CF6', route: '/support' },
];

/* ─────────────────────────────────────────────────
   TAB ICONS
───────────────────────────────────────────────── */
function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { cartCount } = useCart();
  return (
    <View>
      <Ionicons name={focused ? 'bag' : 'bag-outline'} size={24} color={color} />
      {cartCount > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text></View>
      )}
    </View>
  );
}

function WishlistTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { items } = useWishlist();
  return (
    <View>
      <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
      {items.length > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{items.length > 9 ? '9+' : items.length}</Text></View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────
   DRAGGABLE FAB + PILL LIST POPUP
───────────────────────────────────────────────── */
function SupportFAB() {
  const initX = SW - FAB_SIZE - EDGE;
  const initY = SH - 160;

  const position   = useRef(new Animated.ValueXY({ x: initX, y: initY })).current;
  const lastPos    = useRef({ x: initX, y: initY });
  const [fabPos, setFabPos] = useState({ x: initX, y: initY });
  const isDragging = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const itemAnims  = useRef(ACTIONS.map(() => new Animated.Value(0))).current;
  const fabRotate  = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const pulse      = useRef(new Animated.Value(1)).current;
  const pulseOp    = useRef(new Animated.Value(0.5)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(0)).current;  // hidden by default
  const [fabVisible, setFabVisibleState] = useState(false);

  useEffect(() => {
    return subscribeFabVisible((visible) => {
      setFabVisibleState(visible);
      // useNativeDriver: false because position.x/y on same Animated.View also use false
      Animated.timing(fabOpacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse,   { toValue: 1.75, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseOp, { toValue: 0,    duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse,   { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOp, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(700),
      ])
    ).start();
  }, []);

  function openMenu() {
    setIsOpen(true);
    Animated.spring(fabRotate, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    Animated.timing(backdropOp, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    Animated.stagger(55, itemAnims.map((a) =>
      Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 90, friction: 8 })
    )).start();
  }

  function closeMenu(cb?: () => void) {
    Animated.spring(fabRotate, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }).start();
    Animated.timing(backdropOp, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    Animated.stagger(35, [...itemAnims].reverse().map((a) =>
      Animated.timing(a, { toValue: 0, duration: 140, useNativeDriver: true })
    )).start(() => { setIsOpen(false); cb?.(); });
  }

  function handleFabTap() { isOpen ? closeMenu() : openMenu(); }
  function handleAction(route: string) { closeMenu(() => router.push(route as any)); }

  function onPressIn()  { Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true, tension: 200 }).start(); }
  function onPressOut() { Animated.spring(pressScale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start(); }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, gs) => Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        isDragging.current = false;
        position.setOffset(lastPos.current);
        position.setValue({ x: 0, y: 0 });
        onPressIn();
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6) isDragging.current = true;
        position.setValue({ x: gs.dx, y: gs.dy });
      },
      onPanResponderRelease: (_, gs) => {
        position.flattenOffset();
        onPressOut();
        if (!isDragging.current) {
          position.setValue(lastPos.current);
          handleFabTap();
          return;
        }
        if (isOpen) closeMenu();
        const rawX = lastPos.current.x + gs.dx;
        const rawY = lastPos.current.y + gs.dy;
        const snapX = rawX + FAB_SIZE / 2 < SW / 2 ? EDGE : SW - FAB_SIZE - EDGE;
        const snapY = Math.max(100, Math.min(rawY, SH - 160));
        lastPos.current = { x: snapX, y: snapY };
        setFabPos({ x: snapX, y: snapY });
        Animated.spring(position, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false, tension: 100, friction: 11,
        }).start();
      },
      onPanResponderTerminate: () => {
        position.flattenOffset();
        onPressOut();
        position.setValue(lastPos.current);
      },
    })
  ).current;

  const rotateInterp = fabRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] });
  const fabOnRight   = fabPos.x + FAB_SIZE / 2 > SW / 2;

  function itemStyle(index: number) {
    const anim      = itemAnims[index];
    const fabBottom = SH - (fabPos.y + FAB_SIZE);
    const bottom    = fabBottom + FAB_SIZE + ITEM_GAP + index * (ITEM_H + ITEM_GAP);
    return {
      position: 'absolute' as const,
      bottom,
      ...(fabOnRight ? { right: SW - fabPos.x - FAB_SIZE } : { left: fabPos.x }),
      opacity: anim,
      transform: [
        { scale:      anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0]  }) },
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [fabOnRight ? 24 : -24, 0] }) },
      ],
    };
  }

  return (
    <>
      {/* ── Pill list popup modal ── */}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={() => closeMenu()}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOp }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />
        </Animated.View>

        {ACTIONS.map((action, i) => (
          <Animated.View key={action.label} style={itemStyle(i)} pointerEvents="box-none">
            <TouchableOpacity style={styles.pill} onPress={() => handleAction(action.route)} activeOpacity={0.85}>
              <View style={[styles.pillIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <View style={styles.pillText}>
                <Text style={styles.pillLabel}>{action.label}</Text>
                <Text style={styles.pillSub}>{action.sub}</Text>
              </View>
              <View style={[styles.pillArrow, { backgroundColor: `${action.color}12` }]}>
                <Ionicons name="chevron-forward" size={14} color={action.color} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Modal>

      {/* ── Draggable FAB ── */}
      <Animated.View
        style={[styles.fabWrap, { left: position.x, top: position.y, opacity: fabOpacity }]}
        {...panResponder.panHandlers}
        pointerEvents={fabVisible || isOpen ? 'auto' : 'none'}
      >
        {!isOpen && (
          <Animated.View
            style={[styles.fabPulse, { transform: [{ scale: pulse }], opacity: pulseOp }]}
            pointerEvents="none"
          />
        )}

        <Animated.View style={{ transform: [{ scale: pressScale }] }}>
          <View style={[styles.fabInner, isOpen && styles.fabInnerOpen]}>
            <Animated.View style={{ transform: [{ rotate: rotateInterp }] }}>
              <Ionicons
                name={isOpen ? 'add' : 'headset'}
                size={15}
                color={isOpen ? Colors.error : Colors.primary}
              />
            </Animated.View>
          </View>
          {!isOpen && <View style={styles.fabPip} />}
        </Animated.View>
      </Animated.View>
    </>
  );
}

/* ─────────────────────────────────────────────────
   TAB LAYOUT
───────────────────────────────────────────────── */
export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.tabBarActive,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home'   : 'home-outline'}   size={24} color={color} /> }} />
        <Tabs.Screen name="explore"  options={{ title: 'Explore',  tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} /> }} />
        <Tabs.Screen name="cart"     options={{ title: 'Cart',     tabBarIcon: ({ color, focused }) => <CartTabIcon     color={color as string} focused={focused} /> }} />
        <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: ({ color, focused }) => <WishlistTabIcon color={color as string} focused={focused} /> }} />
        <Tabs.Screen name="account"  options={{ title: 'Account',  tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} /> }} />
      </Tabs>

      <SupportFAB />
    </View>
  );
}

/* ─────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopWidth: 0, height: 60,
    paddingBottom: 8, paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: Colors.error, borderRadius: 10,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },

  backdrop: { backgroundColor: 'rgba(10,22,40,0.5)' },

  /* Pill items */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  pillIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  pillText: { flex: 1 },
  pillLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  pillSub:   { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  pillArrow: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  /* FAB */
  fabWrap: {
    position: 'absolute',
    width: FAB_SIZE,
    alignItems: 'center',
    zIndex: 999,
  },
  fabPulse: {
    position: 'absolute',
    top: 0, left: 0,
    width: FAB_SIZE, height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.accent,
  },
  fabInner: {
    width: FAB_SIZE, height: FAB_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  fabInnerOpen: {},
  fabPip: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: '#fff',
  },
});
