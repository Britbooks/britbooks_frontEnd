import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions, FlatList, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useShelf } from '../../hooks/useShelf';
import { fetchCategories } from '../../services/books';
import BookShelf from '../../components/BookShelf';
import GlobalSearchBar from '../../components/GlobalSearchBar';
import { Category } from '../../types';
import { setFabVisible } from '../../utils/fabVisibility';

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDE_W = SCREEN_W - Spacing.base * 2;

const HERO_SLIDES = [
  {
    id: '1',
    badge: 'NEW ARRIVALS',
    title: 'Fresh Picks',
    subtitle: 'The latest titles just landed',
    cta: 'Shop Now',
    route: '/new-arrivals',
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
  },
  {
    id: '2',
    badge: 'BEST SELLERS',
    title: 'Top Reads',
    subtitle: 'Books everyone is talking about',
    cta: 'Browse',
    route: '/bestsellers',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
  },
  {
    id: '3',
    badge: 'SPECIAL OFFERS',
    title: 'Up to 50% Off',
    subtitle: 'Limited time clearance deals',
    cta: 'View Deals',
    route: '/special-offers',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
  },
  {
    id: '4',
    badge: "CHILDREN'S",
    title: "Kids' Corner",
    subtitle: 'Spark a love of reading early',
    cta: 'Explore',
    route: '/childrens',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
  },
  {
    id: '5',
    badge: 'READER PICKS',
    title: 'Community Favourites',
    subtitle: 'Loved by thousands of readers',
    cta: 'Discover',
    route: '/popular',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
  },
];

function HeroBanner() {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (active + 1) % HERO_SLIDES.length;
      scrollRef.current?.scrollToIndex({ index: next, animated: true });
      setActive(next);
    }, 4500);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <View style={styles.heroWrap}>
      <FlatList
        ref={scrollRef}
        data={HERO_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        onMomentumScrollEnd={(e) => {
          setActive(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W));
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.heroSlide}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.95}
          >
            <Image
              source={{ uri: item.image }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={400}
            />
            {/* dark gradient overlay for text readability */}
            <View style={styles.heroOverlay} />

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{item.badge}</Text>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
              <View style={styles.heroShopBtn}>
                <Text style={styles.heroShopText}>{item.cta}</Text>
                <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.heroDots}>
        {HERO_SLIDES.map((_, i) => (
          <View key={i} style={[styles.heroDotIndicator, i === active && styles.heroDotActive]} />
        ))}
      </View>
    </View>
  );
}

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

function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <View style={styles.catSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories.slice(0, 8)}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c._id}
        contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={styles.catItem}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: getCategoryImage(cat.name) }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <View style={styles.catOverlay} />
            <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function PromoStrip() {
  return (
    <View style={styles.promoStrip}>
      {[
        { icon: 'car-outline', text: 'Free delivery over £25' },
        { icon: 'refresh-outline', text: '30-day returns' },
        { icon: 'shield-checkmark-outline', text: 'Secure checkout' },
      ].map((p) => (
        <View key={p.text} style={styles.promoItem}>
          <Ionicons name={p.icon as any} size={16} color={Colors.accent} />
          <Text style={styles.promoText}>{p.text}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const newArrivals = useShelf({ shelf: 'newArrivals', limit: 12 });
  const popular = useShelf({ shelf: 'popularBooks', limit: 12 });
  const bestSellers = useShelf({ shelf: 'bestSellers', limit: 12 });
  const clearance = useShelf({ shelf: 'clearanceItems', limit: 12 });
  const fiction = useShelf({ category: 'Fiction', limit: 12 });
  const nonFiction = useShelf({ category: 'Non-Fiction', limit: 12 });
  const childrens = useShelf({ shelf: 'childrensBooks', limit: 12 });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    return () => setFabVisible(false);
  }, []);

  const firstName = user?.fullName?.split(' ')[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          {firstName ? (
            <>
              <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
              <Text style={styles.headerSub}>What would you like to read?</Text>
            </>
          ) : (
            <>
              <Text style={styles.greeting}>BritBooks</Text>
              <Text style={styles.headerSub}>Discover your next great read</Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
          <Ionicons name="bag-outline" size={22} color={Colors.white} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <GlobalSearchBar />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={(e) => setFabVisible(e.nativeEvent.contentOffset.y > 80)}
        scrollEventThrottle={100}
      >
        <HeroBanner />
        <PromoStrip />
        {categories.length > 0 && <CategoryGrid categories={categories} />}
        <BookShelf title="New Arrivals"   books={newArrivals.books}  loading={newArrivals.loading}  seeAllRoute="/new-arrivals" />
        <BookShelf title="Popular Books"  books={popular.books}      loading={popular.loading}      seeAllRoute="/popular" />
        <BookShelf title="Best Sellers"   books={bestSellers.books}  loading={bestSellers.loading}  seeAllRoute="/bestsellers" />
        {(fiction.loading || fiction.books.length > 0) && (
          <BookShelf title="Fiction"      books={fiction.books}      loading={fiction.loading}      seeAllRoute="/fiction" />
        )}
        {(nonFiction.loading || nonFiction.books.length > 0) && (
          <BookShelf title="Non-Fiction"  books={nonFiction.books}   loading={nonFiction.loading}   seeAllRoute="/non-fiction" />
        )}
        {(childrens.loading || childrens.books.length > 0) && (
          <BookShelf title="Children's Books" books={childrens.books} loading={childrens.loading}  seeAllRoute="/childrens" />
        )}
        <BookShelf title="Special Offers" books={clearance.books}   loading={clearance.loading}    seeAllRoute="/special-offers" />
        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  greeting: { ...Typography.title3, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  searchBar: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  scroll: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  heroWrap: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  heroSlide: {
    width: SLIDE_W,
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.primaryLight,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,22,40,0.48)',
  },
  heroBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 0.8 },
  heroContent: {
    padding: Spacing.base,
    gap: 6,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, lineHeight: 28 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  heroShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 2,
  },
  heroShopText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  heroDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: Spacing.sm },
  heroDotIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  heroDotActive: { width: 18, backgroundColor: Colors.accent },
  promoStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  promoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  promoText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  catSection: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.title3, color: Colors.text },
  seeAllText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  catItem: {
    width: 110,
    height: 110,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  catOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,22,40,0.55)',
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    padding: Spacing.sm,
    lineHeight: 15,
  },
});
