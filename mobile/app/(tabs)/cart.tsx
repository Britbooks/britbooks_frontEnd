import React, { useRef } from 'react';
import {
  FlatList, Image, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import { showAuthPrompt } from '../../utils/authPrompt';
import { CartItem } from '../../types';

function CartItemRow({ item, onRemove, onUpdateQty }: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  return (
    <View style={styles.itemRow}>
      <Image source={{ uri: item.img }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.itemAuthor}>{item.author}</Text>
        <Text style={styles.itemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => item.quantity > 1 ? onUpdateQty(item.quantity - 1) : onRemove()}
          >
            <Ionicons name={item.quantity > 1 ? 'remove' : 'trash-outline'} size={16} color={item.quantity > 1 ? Colors.text : Colors.error} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQty(item.quantity + 1)}
            disabled={item.quantity >= item.stock}
          >
            <Ionicons name="add" size={16} color={item.quantity >= item.stock ? Colors.textMuted : Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
        <Ionicons name="close" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen() {
  const { items, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const delivery = items.length > 0 ? (cartTotal >= 25 ? 0 : 3.99) : 0;
  const total = cartTotal + delivery;

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bag</Text>
        </View>
        <EmptyState
          icon="bag-outline"
          title="Your bag is empty"
          subtitle="Add books from the home or explore screen to get started."
          actionLabel="Explore Books"
          onAction={() => router.push('/(tabs)/explore')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bag</Text>
        <TouchableOpacity onPress={clearCart} hitSlop={8}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={scrollRef}
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onRemove={() => removeFromCart(item.id)}
            onUpdateQty={(qty) => updateQuantity(item.id, qty)}
          />
        )}
        ListFooterComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</Text>
              <Text style={styles.summaryValue}>£{cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, delivery === 0 && { color: Colors.success }]}>
                {delivery === 0 ? 'FREE' : `£${delivery.toFixed(2)}`}
              </Text>
            </View>
            {delivery > 0 && (
              <Text style={styles.freeDeliveryHint}>
                Add £{(25 - cartTotal).toFixed(2)} more for free delivery
              </Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
            </View>
          </View>
        }
      />

      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutTotal}>£{total.toFixed(2)}</Text>
          <Text style={styles.checkoutSub}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => {
            if (user) {
              router.push('/checkout/');
            } else {
              showAuthPrompt({ message: 'Sign in to checkout', action: 'complete your purchase' });
            }
          }}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
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
  clearText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  list: { padding: Spacing.base, paddingBottom: 0, gap: Spacing.sm },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImage: {
    width: 72,
    height: 100,
    borderRadius: Radius.sm,
    backgroundColor: Colors.skeleton,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemTitle: { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  itemAuthor: { ...Typography.caption, color: Colors.textSecondary },
  itemPrice: { fontSize: 15, fontWeight: '700', color: Colors.accent, marginTop: 2 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  qtyText: { ...Typography.headline, color: Colors.text, minWidth: 20, textAlign: 'center' },
  removeBtn: { padding: 4 },
  summaryCard: {
    margin: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: { ...Typography.headline, color: Colors.text, marginBottom: Spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Typography.callout, color: Colors.textSecondary },
  summaryValue: { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  freeDeliveryHint: { fontSize: 12, color: Colors.warning, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.xs },
  totalLabel: { ...Typography.headline, color: Colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  checkoutBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.base,
  },
  checkoutTotal: { ...Typography.title3, color: Colors.white },
  checkoutSub: { ...Typography.caption, color: 'rgba(255,255,255,0.5)' },
  checkoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  checkoutBtnText: { ...Typography.headline, color: Colors.primary },
});
