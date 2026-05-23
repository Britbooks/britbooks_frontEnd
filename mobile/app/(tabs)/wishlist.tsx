import React, { useRef } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import EmptyState from '../../components/EmptyState';
import { WishlistItem } from '../../types';

export default function WishlistScreen() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
        </View>
        <EmptyState
          icon="heart-outline"
          title="Your wishlist is empty"
          subtitle="Tap the heart icon on any book to save it for later."
          actionLabel="Discover Books"
          onAction={() => router.push('/(tabs)/explore')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <View style={styles.headerRight}>
          <Text style={styles.count}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
          <TouchableOpacity onPress={clearWishlist} hitSlop={8}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={scrollRef}
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const inCart = isInCart(item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/book/${item.id}`)}
            >
              <Image source={{ uri: item.img }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.price}>£{item.price.toFixed(2)}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.cartBtn, inCart && styles.cartBtnAdded]}
                    onPress={() => {
                      if (!inCart) addToCart({ id: item.id, img: item.img, title: item.title, author: item.author, price: item.price, stock: 99 });
                    }}
                    disabled={inCart}
                  >
                    <Ionicons name={inCart ? 'checkmark' : 'bag-add-outline'} size={14} color={Colors.white} />
                    <Text style={styles.cartBtnText}>{inCart ? 'In Cart' : 'Add to Cart'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromWishlist(item.id)}>
                    <Ionicons name="heart-dislike-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.title2, color: Colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  count: { ...Typography.caption, color: Colors.textMuted },
  clearText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  list: { padding: Spacing.base, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { width: 96, height: 128, backgroundColor: Colors.skeleton },
  info: { flex: 1, padding: Spacing.md, gap: 4 },
  title: { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  author: { ...Typography.caption, color: Colors.textSecondary },
  price: { fontSize: 16, fontWeight: '700', color: Colors.accent, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  cartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 8,
  },
  cartBtnAdded: { backgroundColor: Colors.success },
  cartBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: `${Colors.error}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
