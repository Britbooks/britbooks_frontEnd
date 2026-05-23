import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants/Colors';
import { Book } from '../types';
import { getDisplayPrice, getImageUrl } from '../services/books';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showAuthPrompt } from '../utils/authPrompt';

interface Props {
  book: Book;
  width?: number;
}

export default function BookCard({ book, width = 150 }: Props) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const inWishlist = isInWishlist(book._id);
  const inCart = isInCart(book._id);
  const price = getDisplayPrice(book);
  const imageUrl = getImageUrl(book);
  const hasDiscount = book.discount?.isActive && book.discountedPrice;

  function handleWishlist() {
    if (!user) {
      showAuthPrompt({ message: 'Sign in to save to your wishlist', action: 'save books to your wishlist' });
      return;
    }
    if (inWishlist) {
      removeFromWishlist(book._id);
    } else {
      addToWishlist({ id: book._id, img: imageUrl, title: book.title, author: book.author, price });
    }
  }

  function handleAddToCart() {
    if (!user) {
      showAuthPrompt({ message: 'Sign in to add to your bag', action: 'add books to your bag' });
      return;
    }
    if (!inCart) {
      addToCart({ id: book._id, img: imageUrl, title: book.title, author: book.author, price, stock: book.stock });
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.92}
      onPress={() => router.push(`/book/${book._id}`)}
    >
      <View style={[styles.imageContainer, { height: width * 1.4 }]}>
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={200} />
        {hasDiscount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{book.discount!.value}%</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishlistBtn} onPress={handleWishlist} hitSlop={8}>
          <Ionicons
            name={inWishlist ? 'heart' : 'heart-outline'}
            size={18}
            color={inWishlist ? Colors.error : Colors.white}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>£{price.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>£{book.price.toFixed(2)}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, inCart && styles.addBtnActive]}
          onPress={handleAddToCart}
          disabled={inCart || book.stock === 0}
        >
          <Ionicons name={inCart ? 'checkmark' : 'bag-add-outline'} size={14} color={Colors.white} />
          <Text style={styles.addBtnText}>{inCart ? 'Added' : book.stock === 0 ? 'Sold Out' : 'Add to Cart'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    backgroundColor: Colors.skeleton,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: Radius.full,
    padding: 6,
  },
  info: {
    padding: Spacing.sm,
    gap: 3,
  },
  title: {
    ...Typography.captionBold,
    color: Colors.text,
    lineHeight: 17,
  },
  author: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 6,
    marginTop: Spacing.xs,
  },
  addBtnActive: {
    backgroundColor: Colors.success,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
