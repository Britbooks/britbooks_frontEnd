import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingScreen from '../../components/LoadingScreen';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { getOrder, ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from '../../services/orders';
import { Order } from '../../types';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingScreen />;

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Order Status</Text>
          <Text style={styles.statusValue}>{ORDER_STATUS_LABELS[order.status]}</Text>
          <View style={styles.progressBar}>
            {ORDER_STATUS_STEPS.map((step, i) => (
              <View key={step} style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  i <= currentStep && styles.progressDotActive,
                  i === currentStep && styles.progressDotCurrent,
                ]}>
                  {i < currentStep && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                </View>
                {i < ORDER_STATUS_STEPS.length - 1 && (
                  <View style={[styles.progressLine, i < currentStep && styles.progressLineActive]} />
                )}
              </View>
            ))}
          </View>
          <View style={styles.stepLabels}>
            {ORDER_STATUS_STEPS.map((step, i) => (
              <Text key={step} style={[styles.stepLabel, i === currentStep && styles.stepLabelActive]} numberOfLines={1}>
                {ORDER_STATUS_LABELS[step]}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order #{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{new Date(order.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {order.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, i < order.items.length - 1 && styles.itemBorder]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.author && <Text style={styles.itemAuthor}>{item.author}</Text>}
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>£{(item.priceAtPurchase * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalValue}>£{order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addressLine}>{order.shippingAddress.name}</Text>
          <Text style={styles.addressLine}>{order.shippingAddress.street}</Text>
          <Text style={styles.addressLine}>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</Text>
          <Text style={styles.addressLine}>{order.shippingAddress.country}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Method</Text>
            <Text style={styles.payValue}>{order.paymentDetails.method}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Status</Text>
            <Text style={[styles.payValue, { color: Colors.success, fontWeight: '700' }]}>{order.paymentDetails.status}</Text>
          </View>
          {order.paymentDetails.transactionId && (
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Transaction ID</Text>
              <Text style={styles.payValue}>{order.paymentDetails.transactionId}</Text>
            </View>
          )}
        </View>

        {order.tracking && order.tracking.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tracking Updates</Text>
            {order.tracking.map((t, i) => (
              <View key={i} style={styles.trackItem}>
                <View style={[styles.trackDot, t.completed && styles.trackDotComplete]} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackStatus}>{t.status}</Text>
                  <Text style={styles.trackLocation}>{t.location}</Text>
                  <Text style={styles.trackDate}>{new Date(t.date).toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, backgroundColor: Colors.background },
  errorText: { ...Typography.callout, color: Colors.textSecondary },
  scroll: { padding: Spacing.base, gap: Spacing.md },
  statusCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  statusLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusValue: { ...Typography.title2, color: Colors.accent },
  progressBar: { flexDirection: 'row', alignItems: 'center' },
  progressStep: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: Colors.accent },
  progressDotCurrent: { backgroundColor: Colors.success, shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 },
  progressLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressLineActive: { backgroundColor: Colors.accent },
  stepLabels: { flexDirection: 'row' },
  stepLabel: { flex: 1, fontSize: 8, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  stepLabelActive: { color: Colors.accent, fontWeight: '700' },
  section: { gap: 4 },
  sectionTitle: { ...Typography.title3, color: Colors.text },
  orderDate: { ...Typography.callout, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardTitle: { ...Typography.headline, color: Colors.text, marginBottom: Spacing.xs },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, gap: Spacing.md },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemInfo: { flex: 1, gap: 2 },
  itemTitle: { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  itemAuthor: { ...Typography.caption, color: Colors.textMuted },
  itemQty: { ...Typography.caption, color: Colors.textSecondary },
  itemPrice: { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { ...Typography.headline, color: Colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  addressLine: { ...Typography.callout, color: Colors.textSecondary, lineHeight: 22 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between' },
  payLabel: { ...Typography.callout, color: Colors.textMuted },
  payValue: { ...Typography.callout, color: Colors.text },
  trackItem: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm },
  trackDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border, marginTop: 4 },
  trackDotComplete: { backgroundColor: Colors.success },
  trackInfo: { flex: 1, gap: 2 },
  trackStatus: { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  trackLocation: { ...Typography.caption, color: Colors.textSecondary },
  trackDate: { ...Typography.caption, color: Colors.textMuted },
});
