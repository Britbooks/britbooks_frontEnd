import React, { useEffect, useRef, useState } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import {
  ActivityIndicator, Dimensions, FlatList,
  ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { fetchBooks, fetchCategories } from '../../services/books';
import { Book, Category } from '../../types';
import SearchBar from '../../components/SearchBar';
import BookCard from '../../components/BookCard';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

const { width: SCREEN_W } = Dimensions.get('window');
const BOOK_CARD_W = (SCREEN_W - Spacing.base * 2 - Spacing.sm) / 2;
const CAT_CARD_W = (SCREEN_W - Spacing.base * 2 - Spacing.sm) / 2;
const CAT_CARD_H = 140;

const SORT_OPTIONS = [
  { label: 'Newest', sort: 'listedAt', order: 'desc' as const },
  { label: 'Popular', sort: 'purchases', order: 'desc' as const },
  { label: 'Price ↑', sort: 'price', order: 'asc' as const },
  { label: 'Price ↓', sort: 'price', order: 'desc' as const },
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Acceptable'];

const CATEGORY_IMAGES: Record<string, string> = {
  "children's books": 'http://choicetextileimages.blob.core.windows.net/img-1/stand_1004118_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  fiction: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_1547728_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  'non-fiction': 'http://choicetextileimages.blob.core.windows.net/img-1/stand_1022627_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  'biography & memoir': 'http://choicetextileimages.blob.core.windows.net/img-1/stand_423514_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  education: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_837421_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  history: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_595562_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  'health & wellness': 'https://books.google.com/books/content?id=EUz7pwAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
  'mystery & thriller': 'https://books.google.com/books/content?id=levT0AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
  'religion & spirituality': 'https://books.google.com/books/content?id=PWKnpOvl7k0C&printsec=frontcover&img=1&zoom=1&source=gbs_api',
  travel: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_355902_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  'business & finance': 'https://books.google.com/books/content?id=zhzyswEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
  romance: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_1042181_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  science: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_1092933_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  fantasy: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_94593_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  philosophy: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_1105643_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
  horror: 'http://choicetextileimages.blob.core.windows.net/img-1/stand_261514_jpg.jpg?sv=2012-02-12&sr=c&si=policy&sig=UJGArnU2SSaCcGE3m8IeJaXsv77mtWiIDK%2F7XslOY0w%3D',
};

function getCategoryImage(name: string): string {
  return CATEGORY_IMAGES[name.toLowerCase()] ?? `https://picsum.photos/seed/${encodeURIComponent(name)}/300/400`;
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSort, setSelectedSort] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [selectedCondition, setSelectedCondition] = useState<string | undefined>();
  const [showCondition, setShowCondition] = useState(false);

  const isResultsMode = !!(query || selectedCategory || selectedCondition);
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!isResultsMode) return;
    setPage(1);
    loadBooks(1, true);
  }, [debouncedQuery, selectedSort, selectedCategory, selectedSubcategory, selectedCondition]);

  async function loadBooks(p: number, reset = false) {
    p === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const s = SORT_OPTIONS[selectedSort];
      const { books: b, meta } = await fetchBooks({
        search: debouncedQuery || undefined,
        sort: s.sort,
        order: s.order,
        category: selectedCategory?.name,
        subcategory: selectedSubcategory,
        condition: selectedCondition,
        page: p,
        limit: 20,
      });
      setBooks(reset || p === 1 ? b : (prev) => [...prev, ...b]);
      setTotalPages(meta.pages ?? 1);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleCategorySelect(cat: Category) {
    setSelectedCategory(cat);
    setSelectedSubcategory(undefined);
  }

  function clearAll() {
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setSelectedCondition(undefined);
    setQuery('');
  }

  function handleLoadMore() {
    if (page < totalPages && !loadingMore) {
      const next = page + 1;
      setPage(next);
      loadBooks(next);
    }
  }

  const subs = selectedCategory?.subcategories ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>BROWSE</Text>
          <Text style={styles.title}>
            {selectedCategory ? selectedCategory.name : 'Explore'}
          </Text>
        </View>
        {isResultsMode && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Ionicons name="grid-outline" size={16} color={Colors.white} />
            <Text style={styles.clearBtnText}>All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
      </View>

      {/* ── Subcategory chips (when category selected) ── */}
      {selectedCategory && subs.length > 0 && (
        <View style={styles.subBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subList}>
            <TouchableOpacity
              style={[styles.subChip, !selectedSubcategory && styles.subChipActive]}
              onPress={() => setSelectedSubcategory(undefined)}
            >
              <Text style={[styles.subChipText, !selectedSubcategory && styles.subChipTextActive]}>All</Text>
            </TouchableOpacity>
            {subs.map((sub) => (
              <TouchableOpacity
                key={sub._id}
                style={[styles.subChip, selectedSubcategory === sub.name && styles.subChipActive]}
                onPress={() => setSelectedSubcategory(selectedSubcategory === sub.name ? undefined : sub.name)}
              >
                <Text style={[styles.subChipText, selectedSubcategory === sub.name && styles.subChipTextActive]}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Sort + condition strip (results mode) ── */}
      {isResultsMode && (
        <View style={styles.sortStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortList}>
            {SORT_OPTIONS.map((o, i) => (
              <TouchableOpacity
                key={o.label}
                style={[styles.sortChip, selectedSort === i && styles.sortChipActive]}
                onPress={() => setSelectedSort(i)}
              >
                <Text style={[styles.sortChipText, selectedSort === i && styles.sortChipTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.sortChip, selectedCondition ? styles.sortChipActive : undefined]}
              onPress={() => setShowCondition(!showCondition)}
            >
              <Ionicons name="options-outline" size={13} color={selectedCondition ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.sortChipText, selectedCondition ? styles.sortChipTextActive : undefined]}>
                {selectedCondition ?? 'Condition'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── Condition picker ── */}
      {showCondition && (
        <View style={styles.conditionPanel}>
          <View style={styles.conditionChips}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.subChip, selectedCondition === c && styles.subChipActive]}
                onPress={() => { setSelectedCondition(selectedCondition === c ? undefined : c); setShowCondition(false); }}
              >
                <Text style={[styles.subChipText, selectedCondition === c && styles.subChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── BROWSE MODE — image grid ── */}
      {!isResultsMode && (
        <FlatList
          ref={scrollRef}
          data={categories}
          numColumns={2}
          keyExtractor={(c) => c._id}
          contentContainerStyle={styles.catGrid}
          columnWrapperStyle={styles.catRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>All Categories</Text>
          }
          ListFooterComponent={<View style={{ height: Spacing['4xl'] }} />}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={styles.catCard}
              onPress={() => handleCategorySelect(cat)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: getCategoryImage(cat.name) }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={300}
              />
              <View style={styles.catCardOverlay} />
              <View style={styles.catCardContent}>
                <Text style={styles.catCardName} numberOfLines={2}>{cat.name}</Text>
                <View style={styles.catCardMeta}>
                  <View style={styles.catCardArrow}>
                    <Ionicons name="arrow-forward" size={11} color={Colors.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── RESULTS MODE ── */}
      {isResultsMode && (
        loading ? (
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} width={BOOK_CARD_W} />)}
          </View>
        ) : books.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No books found"
            subtitle={query ? `No results for "${query}"` : 'No books in this category yet.'}
            actionLabel="Clear filters"
            onAction={clearAll}
          />
        ) : (
          <FlatList
            ref={scrollRef}
            data={books}
            numColumns={2}
            keyExtractor={(b) => b._id}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? <ActivityIndicator color={Colors.accent} style={{ margin: 16 }} /> : null
            }
            renderItem={({ item }) => <BookCard book={item} width={BOOK_CARD_W} />}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: { ...Typography.title2, color: Colors.white, fontWeight: '800' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: Colors.white },

  // Search
  searchWrap: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },

  // Subcategory bar
  subBar: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  subList: { paddingHorizontal: Spacing.base, gap: Spacing.xs },
  subChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    backgroundColor: Colors.surface,
  },
  subChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}18` },
  subChipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  subChipTextActive: { color: Colors.accent, fontWeight: '700' },

  // Sort strip
  sortStrip: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortList: { paddingHorizontal: Spacing.base, gap: Spacing.xs },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    backgroundColor: Colors.surface,
  },
  sortChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}15` },
  sortChipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.accent, fontWeight: '700' },

  // Condition panel
  conditionPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  conditionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },

  // Browse category grid
  sectionLabel: {
    ...Typography.captionBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  catGrid: {
    padding: Spacing.base,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  catRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
  catCard: {
    width: CAT_CARD_W,
    height: CAT_CARD_H,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: Colors.primaryLight,
  },
  catCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,22,40,0.58)',
  },
  catCardContent: {
    padding: Spacing.sm,
    gap: 4,
  },
  catCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 18,
  },
  catCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catCardCount: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  catCardArrow: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Results grid
  resultCount: {
    ...Typography.captionBold,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.base,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  grid: { padding: Spacing.base, backgroundColor: Colors.background, flexGrow: 1 },
  gridRow: { gap: Spacing.sm },
});
