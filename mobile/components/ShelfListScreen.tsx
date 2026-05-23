import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, FlatList,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../constants/Colors';
import { fetchBooks, fetchCategories, getCached } from '../services/books';
import { Book, Category, ListingsRequest } from '../types';
import BookCard from './BookCard';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.base * 2 - Spacing.sm) / 2;

const SORT_OPTIONS = [
  { label: 'Newest',  sort: 'listedAt',  order: 'desc' as const },
  { label: 'Popular', sort: 'purchases', order: 'desc' as const },
  { label: 'Price ↑', sort: 'price',     order: 'asc'  as const },
  { label: 'Price ↓', sort: 'price',     order: 'desc' as const },
];

interface Props {
  title: string;
  subtitle: string;
  headerColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  fetchParams: ListingsRequest;
  /** Pass the category name to load + show subcategory chips */
  categoryName?: string;
}

// ── Decorative animated blobs in hero ────────────────────────────
function HeroBlobs({ color }: { color: string }) {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, dur: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: dur, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: dur, useNativeDriver: true }),
        ])
      ).start();
    loop(a1, 3200, 0);
    loop(a2, 2800, 600);
    loop(a3, 3600, 1200);
  }, []);

  const s1 = a1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const s2 = a2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const s3 = a3.interpolate({ inputRange: [0, 1], outputRange: [1.08, 0.9] });

  return (
    <>
      <Animated.View style={[styles.blob, {
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: color, opacity: 0.18,
        top: -60, right: -50, transform: [{ scale: s1 }],
      }]} />
      <Animated.View style={[styles.blob, {
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: color, opacity: 0.13,
        top: 30, right: 60, transform: [{ scale: s2 }],
      }]} />
      <Animated.View style={[styles.blob, {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: color, opacity: 0.22,
        bottom: 30, left: -20, transform: [{ scale: s3 }],
      }]} />
    </>
  );
}

export default function ShelfListScreen({
  title, subtitle, headerColor, icon, fetchParams, categoryName,
}: Props) {
  // Lazy-init from cache so navigating back shows data instantly with no skeleton
  const [books, setBooks]           = useState<Book[]>(() => {
    const hit = getCached({ ...fetchParams, sort: 'listedAt', order: 'desc', page: 1, limit: 20 });
    return hit?.data.books ?? [];
  });
  const [loading, setLoading]       = useState(() => {
    return !getCached({ ...fetchParams, sort: 'listedAt', order: 'desc', page: 1, limit: 20 });
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [selectedSort, setSelectedSort] = useState(0);

  const [query, setQuery]           = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedSub, setSelectedSub]     = useState<string | undefined>();

  const heroAnim = useRef(new Animated.Value(0)).current;
  const totalPagesRef = useRef(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 380);
    return () => clearTimeout(t);
  }, [query]);

  // Load subcategories — categories cache already has them nested
  useEffect(() => {
    if (!categoryName) return;
    fetchCategories().then(cats => {
      const match = cats.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (match?.subcategories?.length) setSubcategories(match.subcategories);
    }).catch(() => {});
  }, [categoryName]);

  // Animate hero in
  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
  }, []);

  const buildParams = useCallback((p: number) => {
    const s = SORT_OPTIONS[selectedSort];
    return {
      ...fetchParams,
      ...(selectedSub    && { subcategory: selectedSub }),
      ...(debouncedQuery && { search: debouncedQuery }),
      sort: s.sort,
      order: s.order,
      page: p,
      limit: 20,
    };
  }, [selectedSort, selectedSub, debouncedQuery, JSON.stringify(fetchParams)]);

  const loadBooks = useCallback(async (p: number, reset = false) => {
    const params = buildParams(p);
    const hasCached = !!getCached(params);
    if (p === 1 && !hasCached) setLoading(true);
    if (p > 1) setLoadingMore(true);
    try {
      const { books: b, meta } = await fetchBooks(buildParams(p));
      setBooks(prev => reset || p === 1 ? b : [...prev, ...b]);

      // meta.pages / meta.count are null on page 2+ (skipCount=true) —
      // only update them when the API actually returns them
      const apiTotal = meta.count ?? meta.total ?? null;
      const apiPages = meta.pages ?? null;

      // pages is always computed from count in fetchBooks, never null
      setTotalPages(meta.pages ?? 1);
      totalPagesRef.current = meta.pages ?? 1;
      if (meta.count != null) setTotal(meta.count);

      // Prefetch next page via ref (state not yet updated at this point)
      if (p < totalPagesRef.current) {
        fetchBooks(buildParams(p + 1)).catch(() => {});
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams]);

  useEffect(() => {
    setPage(1);
    totalPagesRef.current = 1;
    loadBooks(1, true);
  }, [loadBooks]);

  function handleLoadMore() {
    if (page < totalPages && !loadingMore) {
      const next = page + 1;
      setPage(next);
      loadBooks(next);
    }
  }

  const heroScale = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const heroOpacity = heroAnim;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { backgroundColor: headerColor }]}>

        {/* ── HERO ── */}
        <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
          <HeroBlobs color="#ffffff" />

          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>

            {/* Icon + title */}
            <View style={styles.heroBody}>
              <View style={styles.iconCircle}>
                <Ionicons name={icon} size={28} color={headerColor} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.heroSubtitle}>{subtitle}</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>2m+</Text>
                <Text style={styles.countBadgeLabel}>books</Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.6)" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${title.toLowerCase()}…`}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>

          {/* Subcategory chips */}
          {subcategories.length > 0 && (
            <View style={styles.chipStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                alwaysBounceHorizontal={false}
              >
                <TouchableOpacity
                  style={[styles.subChip, !selectedSub && styles.subChipActive]}
                  onPress={() => setSelectedSub(undefined)}
                >
                  <Text style={[styles.subChipText, !selectedSub && styles.subChipTextActive]}>All</Text>
                </TouchableOpacity>
                {subcategories.map((s, i) => (
                  <TouchableOpacity
                    key={`${s.slug ?? s.name}-${i}`}
                    style={[styles.subChip, selectedSub === s.name && styles.subChipActive]}
                    onPress={() => setSelectedSub(selectedSub === s.name ? undefined : s.name)}
                  >
                    <Text style={[styles.subChipText, selectedSub === s.name && styles.subChipTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Sort chips */}
          <View style={styles.sortStrip}>
            {SORT_OPTIONS.map((o, i) => (
              <TouchableOpacity
                key={o.label}
                style={[styles.sortChip, selectedSort === i && styles.sortChipActive]}
                onPress={() => setSelectedSort(i)}
              >
                {selectedSort === i && (
                  <Ionicons name="checkmark" size={12} color={Colors.accent} />
                )}
                <Text style={[styles.sortChipText, selectedSort === i && styles.sortChipTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Books */}
          {loading ? (
            <View style={styles.skeletonGrid}>
              {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} width={CARD_W} />)}
            </View>
          ) : books.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No books found"
              subtitle={query ? `No results for "${query}"` : 'Check back soon for new stock.'}
              actionLabel={query ? 'Clear search' : 'Go back'}
              onAction={query ? () => setQuery('') : () => router.back()}
            />
          ) : (
            <FlatList
              data={books}
              numColumns={2}
              keyExtractor={b => b._id}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
                ) : page < totalPages ? (
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                    <Text style={styles.loadMoreText}>Load more</Text>
                    <Ionicons name="chevron-down" size={14} color={Colors.accent} />
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => <BookCard book={item} width={CARD_W} />}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: { overflow: 'hidden' },
  heroSafe: { paddingBottom: Spacing.base },
  blob: { position: 'absolute' },
  backBtn: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  heroText: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },
  countBadge: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 52,
  },
  countBadgeText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  countBadgeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  searchInput: {
    flex: 1, fontSize: 14, color: Colors.white,
    padding: 0, fontWeight: '500',
  },

  // Content
  content: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },

  // Subcategory chips
  chipStrip: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    height: 56,
    justifyContent: 'center',
  },
  chipRow: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    flexDirection: 'row',
  },
  subChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    backgroundColor: Colors.background,
  },
  subChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}12` },
  subChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  subChipTextActive: { color: Colors.accent },
  subChipCount: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },

  // Sort chips
  sortStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sortChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    backgroundColor: Colors.background,
  },
  sortChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}12` },
  sortChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.accent },

  // Grid
  skeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.base, gap: Spacing.sm,
  },
  grid: { padding: Spacing.base, flexGrow: 1 },
  row: { gap: Spacing.sm },
  resultCount: {
    ...Typography.captionBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md,
  },
  loadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, marginVertical: Spacing.xl,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderWidth: 1.5, borderColor: Colors.accent,
    borderRadius: Radius.full, alignSelf: 'center',
  },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  endText: {
    ...Typography.caption, color: Colors.textMuted, textAlign: 'center',
    marginVertical: Spacing.xl,
  },
});
