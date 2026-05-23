import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders, ORDER_STATUS_LABELS } from '../../services/orders';
import EmptyState from '../../components/EmptyState';
import { showAuthPrompt } from '../../utils/authPrompt';
import { Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  ordered:          Colors.warning,
  processing:       Colors.accent,
  dispatched:       Colors.primaryLight,
  in_transit:       Colors.primaryLight,
  out_for_delivery: Colors.success,
  delivered:        Colors.success,
  cancelled:        Colors.error,
};

const FILTERS = [
  { label: 'All',       value: undefined },
  { label: 'Active',    value: 'active' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const load = useCallback(async (p: number, reset = false, status?: string) => {
    if (!user) return;
    p === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await getUserOrders(user.userId, { page: p, limit: 20, status });
      setOrders(reset || p === 1 ? res.orders : (prev) => [...prev, ...res.orders]);
      setPages(res.pages);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load(1, true, filter);
  }, [filter, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, true, filter);
  };

  const onLoadMore = () => {
    if (!loadingMore && page < pages) load(page + 1, false, filter);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          icon="receipt-outline"
          title="Sign in to view orders"
          subtitle="Access your order history and tracking details."
          actionLabel="Sign In"
          onAction={() => showAuthPrompt({ message: 'Sign in to view your orders', action: 'track and manage your orders' })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterList}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.value)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No orders found"
          subtitle={filter ? `No ${filter} orders yet.` : "You haven't placed any orders yet."}
          actionLabel="Explore Books"
          onAction={() => router.push('/(tabs)/explore')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={Colors.accent} style={{ margin: 16 }} /> : null
          }
          renderItem={({ item: order }) => {
            const statusColor = STATUS_COLORS[order.status] ?? Colors.accent;
            const label = ORDER_STATUS_LABELS[order.status] ?? order.status;
            const preview = order.items.slice(0, 2);
            const extra = order.items.length - 2;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/orders/${order.id}` as any)}
                activeOpacity={0.88}
              >
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{label}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Item preview */}
                <View style={styles.itemsPreview}>
                  {preview.map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Ionicons name="book-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                      </Text>
                    </View>
                  ))}
                  {extra > 0 && (
                    <Text style={styles.extraItems}>+{extra} more item{extra > 1 ? 's' : ''}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Bottom row */}
                <View style={styles.cardBottom}>
                  <Text style={styles.itemCount}>
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </Text>
                  <Text style={styles.total}>£{order.total.toFixed(2)}</Text>
                  <View style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  filterBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexGrow: 0,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.background,
  },
  filterChipActive: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}15`,
  },
  filterChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.accent, fontWeight: '700' },
  list: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.base,
  },
  cardTopLeft: { gap: 3 },
  orderId: { ...Typography.headline, color: Colors.text, fontFamily: 'monospace' },
  orderDate: { ...Typography.caption, color: Colors.textMuted },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  itemsPreview: { padding: Spacing.md, paddingHorizontal: Spacing.base, gap: 5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  extraItems: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, paddingHorizontal: Spacing.base, gap: Spacing.sm,
  },
  itemCount: { flex: 1, ...Typography.caption, color: Colors.textMuted },
  total: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  detailsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: `${Colors.accent}12`,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.accent}30`,
  },
  detailsBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
});
