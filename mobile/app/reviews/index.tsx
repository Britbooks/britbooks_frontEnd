import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, FlatList,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { apiClient } from '../../services/api';
import { ENDPOINTS } from '../../constants/Api';
import { useAuth } from '../../context/AuthContext';
import { Review } from '../../types';

// ── Skeleton ─────────────────────────────────────────────────────
function SkeletonLine({ w, h = 12 }: { w: string | number; h?: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: w as any, height: h, borderRadius: 6, backgroundColor: Colors.skeleton, opacity: anim }} />;
}

function ReviewSkeleton() {
  return (
    <View style={s.card}>
      <View style={{ gap: 8 }}>
        <SkeletonLine w="60%" h={14} />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1,2,3,4,5].map(i => <SkeletonLine key={i} w={14} h={14} />)}
        </View>
        <SkeletonLine w="100%" h={12} />
        <SkeletonLine w="80%"  h={12} />
      </View>
    </View>
  );
}

// ── Star row ─────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? 'star' : 'star-outline'}
          size={13}
          color={n <= rating ? '#FBBF24' : '#D1D5DB'}
        />
      ))}
    </View>
  );
}

// ── Review card ──────────────────────────────────────────────────
function ReviewCard({ review, onDelete, deleting }: {
  review: Review & { listing: any };
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const listingId  = typeof review.listing === 'object' ? review.listing._id  : review.listing;
  const bookTitle  = typeof review.listing === 'object' ? (review.listing.title ?? null) : null;

  const date = (() => {
    if (!review.createdAt) return '';
    const d = new Date(review.createdAt);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  })();

  function confirmDelete() {
    Alert.alert('Delete Review', 'Remove this review permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(review._id) },
    ]);
  }

  return (
    <View style={s.card}>
      {/* Top row: book title + delete */}
      <View style={s.cardHead}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => listingId && router.push(`/book/${listingId}`)}
          activeOpacity={0.7}
        >
          <Text style={s.bookTitle} numberOfLines={1}>
            {bookTitle ?? 'View book →'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} disabled={deleting} hitSlop={8} style={s.deleteBtn}>
          {deleting
            ? <ActivityIndicator size="small" color={Colors.error} />
            : <Ionicons name="trash-outline" size={16} color={Colors.error} />
          }
        </TouchableOpacity>
      </View>

      {/* Stars + date + badges */}
      <View style={s.metaRow}>
        <Stars rating={review.rating} />
        {date ? <Text style={s.date}>{date}</Text> : null}
        {review.isVerifiedPurchase && (
          <View style={[s.badge, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[s.badgeText, { color: '#059669' }]}>Verified</Text>
          </View>
        )}
        {!review.isApproved && (
          <View style={[s.badge, { backgroundColor: '#FFFBEB' }]}>
            <Text style={[s.badgeText, { color: '#D97706' }]}>Pending</Text>
          </View>
        )}
      </View>

      {/* Title + body */}
      {review.title ? <Text style={s.reviewTitle}>{review.title}</Text> : null}
      {review.body  ? <Text style={s.reviewBody}>{review.body}</Text>   : null}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────
export default function MyReviewsScreen() {
  const { user } = useAuth();
  const [reviews,    setReviews]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [total,      setTotal]      = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (p: number, append = false) => {
    if (!user?.userId) return;
    p === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await apiClient.get(ENDPOINTS.reviews.byUser(user.userId), {
        params: { page: p, limit: 10 },
      });
      const d = res.data;
      const list = d.reviews ?? d.data ?? [];
      setReviews(prev => append ? [...prev, ...list] : list);
      setPage(d.page ?? p);
      setTotal(d.total ?? d.count ?? list.length);
      setPages(d.pages ?? d.totalPages ?? 1);
    } catch {
      if (!append) setReviews([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.userId]);

  useEffect(() => { load(1); }, [load]);

  async function handleDelete(reviewId: string) {
    setDeletingId(reviewId);
    try {
      await apiClient.delete(ENDPOINTS.reviews.delete(reviewId));
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      setTotal(t => Math.max(0, t - 1));
    } catch {
      Alert.alert('Error', 'Could not delete review. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleLoadMore() {
    if (!loadingMore && page < pages) load(page + 1, true);
  }

  const displayTotal = total > 0 ? total : reviews.length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Reviews</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={s.list}>
          {[1, 2, 3].map(i => <ReviewSkeleton key={i} />)}
        </View>
      ) : reviews.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="star-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>No reviews yet</Text>
          <Text style={s.emptySub}>Start reading and share your thoughts!</Text>
          <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={s.browseBtnText}>Browse Books</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={r => r._id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <Text style={s.countLabel}>
              {displayTotal} review{displayTotal !== 1 ? 's' : ''}
            </Text>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={Colors.accent} style={{ margin: 16 }} />
              : null
          }
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onDelete={handleDelete}
              deleting={deletingId === item._id}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.title3, color: Colors.text },

  list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 40 },
  countLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  deleteBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: `${Colors.error}10`,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  date: { ...Typography.caption, color: Colors.textMuted },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  reviewTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  reviewBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { ...Typography.title3, color: Colors.text },
  emptySub: { ...Typography.callout, color: Colors.textSecondary, textAlign: 'center' },
  browseBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  browseBtnText: { ...Typography.headline, color: Colors.white },
});
