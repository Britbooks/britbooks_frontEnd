import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, FlatList,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { fetchBookById, fetchBooks, getDisplayPrice, getImageUrl } from '../../services/books';
import { deleteReview, getReviewerName, getReviews, getReviewSummary, submitReview } from '../../services/reviews';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { showAuthPrompt } from '../../utils/authPrompt';
import StarRating from '../../components/StarRating';
import BookCard from '../../components/BookCard';
import { Book, Review, ReviewSummary } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');
const IMAGE_H = SCREEN_W * 0.9;
const CARD_W = 130;

// ── Skeleton ─────────────────────────────────────────────────────
function SkeletonBlock({ w, h, radius = 6 }: { w: number | string; h: number; radius?: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ width: w as any, height: h, borderRadius: radius, backgroundColor: Colors.skeleton, opacity: anim }}
    />
  );
}

function DetailSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ height: IMAGE_H, backgroundColor: Colors.skeleton }} />
      <View style={{ padding: Spacing.base, gap: Spacing.md }}>
        <SkeletonBlock w="75%" h={26} />
        <SkeletonBlock w="45%" h={16} />
        <SkeletonBlock w="30%" h={30} />
        <SkeletonBlock w="100%" h={14} />
        <SkeletonBlock w="90%" h={14} />
        <SkeletonBlock w="80%" h={14} />
      </View>
    </View>
  );
}

// ── Rating summary ────────────────────────────────────────────────
function RatingSummary({ summary }: { summary: ReviewSummary }) {
  const maxCount = Math.max(...summary.breakdown.map(b => b.count), 1);
  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingLeft}>
        <Text style={styles.ratingBig}>{summary.averageRating.toFixed(1)}</Text>
        <StarRating rating={summary.averageRating} size={16} />
        <Text style={styles.ratingCount}>{summary.reviewCount} {summary.reviewCount === 1 ? 'review' : 'reviews'}</Text>
      </View>
      <View style={styles.ratingBars}>
        {[5, 4, 3, 2, 1].map((star) => {
          const row = summary.breakdown.find(b => b.star === star);
          const count = row?.count ?? 0;
          const pct = (count / maxCount) * 100;
          return (
            <View key={star} style={styles.ratingBarRow}>
              <Text style={styles.ratingBarLabel}>{star}</Text>
              <Ionicons name="star" size={9} color={Colors.accent} />
              <View style={styles.ratingBarBg}>
                <View style={[styles.ratingBarFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.ratingBarCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Review card ───────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onDelete }: {
  review: Review;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}) {
  const name = getReviewerName(review);
  const reviewUserId = typeof review.user === 'object' ? review.user._id : review.user;
  const isOwn = !!(currentUserId && reviewUserId && reviewUserId === currentUserId);
  const [deleting, setDeleting] = useState(false);

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewName}>{name}</Text>
          <StarRating rating={review.rating} size={12} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          {isOwn && (
            <TouchableOpacity
              hitSlop={8}
              disabled={deleting}
              onPress={async () => {
                setDeleting(true);
                onDelete(review._id);
              }}
            >
              <Ionicons name="trash-outline" size={14} color={deleting ? Colors.textMuted : Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
      {review.body ? (
        <Text style={styles.reviewBody}>{review.body}</Text>
      ) : (
        <Text style={styles.reviewBodyEmpty}>No comment left</Text>
      )}
      {review.isVerifiedPurchase && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
          <Text style={styles.verifiedText}>Verified Purchase</Text>
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<Book[]>([]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myTitle, setMyTitle] = useState('');
  const [myBody, setMyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'info' | 'reviews'>('info');

  const { addToCart, isInCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();

  const REVIEW_LIMIT = 5;

  async function loadReviews(page: number) {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await getReviews(id, page, REVIEW_LIMIT);
      setReviews(res.reviews);
      setReviewPage(res.meta.page ?? page);
      setReviewPages(res.meta.pages ?? 1);
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchBookById(id),
      getReviewSummary(id).catch(() => null),
    ]).then(([fetchedBook, summaryResult]) => {
      setBook(fetchedBook);
      setSummary(summaryResult);
      // load similar after we know the category
      fetchBooks({ category: fetchedBook.category, limit: 10 })
        .then(({ books }) => setSimilar(books.filter(b => b._id !== fetchedBook._id)))
        .catch(() => {});
    }).catch(() => {
      setBook(null);
    }).finally(() => setLoading(false));

    loadReviews(1);
  }, [id]);

  async function handleSubmitReview() {
    if (!id || myRating === 0) return;
    setSubmitting(true);
    try {
      const review = await submitReview({ listing: id, rating: myRating, title: myTitle.trim(), body: myBody.trim() });
      setReviews(prev => [review, ...prev]);
      setShowReviewForm(false);
      setMyRating(5);
      setMyTitle('');
      setMyBody('');
      const updated = await getReviewSummary(id).catch(() => null);
      if (updated) setSummary(updated);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId: string) {
    await deleteReview(reviewId).catch(() => {});
    setReviews(prev => prev.filter(r => r._id !== reviewId));
    if (id) {
      const updated = await getReviewSummary(id).catch(() => null);
      if (updated) setSummary(updated);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (!book) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={{ color: Colors.textSecondary, marginTop: 40 }}>Book not found</Text>
      </SafeAreaView>
    );
  }

  const price = getDisplayPrice(book);
  const imageUrl = getImageUrl(book);
  const inCart = isInCart(book._id);
  const inWishlist = isInWishlist(book._id);

  return (
    <View style={styles.screen}>
      {/* Fixed hero image — stays put as content scrolls over it */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <View style={styles.imageOverlay} />
      </View>

      {/* Back / wishlist buttons — always above content */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topBarBtn}
          onPress={() => {
            if (!user) {
              showAuthPrompt({ message: 'Sign in to save to your wishlist', action: 'save books to your wishlist' });
              return;
            }
            if (inWishlist) removeFromWishlist(book._id);
            else addToWishlist({ id: book._id, img: imageUrl, title: book.title, author: book.author, price });
          }}
        >
          <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={20} color={inWishlist ? '#FF6B6B' : Colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: IMAGE_H - 28 }}
        >
          {/* Detail card slides up over the fixed image */}
          <View style={styles.detailContainer}>

            {/* Book meta */}
            <View style={styles.bookMeta}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>by {book.author}</Text>

              <View style={styles.metaRow}>
                {summary && summary.reviewCount > 0 && (
                  <StarRating rating={summary.averageRating} size={15} showCount count={summary.reviewCount} />
                )}
                <View style={[styles.conditionBadge, { backgroundColor: book.condition === 'New' ? `${Colors.success}18` : `${Colors.accent}18` }]}>
                  <Text style={[styles.conditionText, { color: book.condition === 'New' ? Colors.success : Colors.accentDark }]}>
                    {book.condition}
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>£{price.toFixed(2)}</Text>
                {book.discount?.isActive && book.discountedPrice && (
                  <>
                    <Text style={styles.originalPrice}>£{book.price.toFixed(2)}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{book.discount.value}%</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.stockRow}>
                <Ionicons
                  name={book.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={book.stock > 0 ? Colors.success : Colors.error}
                />
                <Text style={[styles.stockText, { color: book.stock > 0 ? Colors.success : Colors.error }]}>
                  {book.stock > 5 ? 'In stock' : book.stock > 0 ? `Only ${book.stock} left!` : 'Out of stock'}
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(['info', 'reviews'] as const).map(t => (
                <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'info' ? 'Details' : `Reviews${summary && summary.reviewCount > 0 ? ` (${summary.reviewCount})` : ''}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Details tab */}
            {tab === 'info' && (
              <View style={styles.infoTab}>
                {book.description ? (
                  <Text style={styles.description}>
                    {book.description
                      .replace(/<[^>]*>/g, ' ')
                      .replace(/&nbsp;/g, ' ')
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/\s{2,}/g, ' ')
                      .trim()}
                  </Text>
                ) : (
                  <Text style={styles.noDescription}>No description available.</Text>
                )}
                <View style={styles.infoGrid}>
                  {[
                    { label: 'Category', value: book.category },
                    { label: 'Condition', value: book.condition },
                    ...(book.subcategory ? [{ label: 'Subcategory', value: book.subcategory }] : []),
                    ...(book.isbn ? [{ label: 'ISBN', value: book.isbn }] : []),
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{label}</Text>
                      <Text style={styles.infoValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Reviews tab */}
            {tab === 'reviews' && (
              <View style={styles.reviewsTab}>

                {/* Summary */}
                {summary && summary.reviewCount > 0 && <RatingSummary summary={summary} />}

                {/* Write review button */}
                {user && !showReviewForm && (
                  <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setShowReviewForm(true)}>
                    <Ionicons name="create-outline" size={17} color={Colors.accent} />
                    <Text style={styles.writeReviewText}>Write a Review</Text>
                  </TouchableOpacity>
                )}

                {/* Review form */}
                {showReviewForm && (
                  <View style={styles.reviewForm}>
                    <View style={styles.reviewFormHeader}>
                      <Text style={styles.reviewFormTitle}>Your Review</Text>
                      <TouchableOpacity onPress={() => setShowReviewForm(false)}>
                        <Ionicons name="close" size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.ratingPickerRow}>
                      <StarRating rating={myRating} size={30} interactive onRate={setMyRating} />
                      <Text style={styles.ratingLabel}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][myRating] ?? ''}
                      </Text>
                    </View>

                    <TextInput
                      style={styles.textInput}
                      placeholder="Review title (e.g. Great book!)"
                      placeholderTextColor={Colors.textMuted}
                      value={myTitle}
                      onChangeText={setMyTitle}
                      maxLength={120}
                      returnKeyType="next"
                    />

                    <View>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        placeholder="Share your thoughts about this book…"
                        placeholderTextColor={Colors.textMuted}
                        value={myBody}
                        onChangeText={setMyBody}
                        maxLength={2000}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                      <Text style={styles.charCount}>{myBody.length}/2000</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.reviewSubmitBtn, (submitting || myRating === 0) && styles.reviewSubmitBtnDisabled]}
                      onPress={handleSubmitReview}
                      disabled={submitting || myRating === 0}
                    >
                      {submitting
                        ? <ActivityIndicator size="small" color={Colors.primary} />
                        : <>
                            <Ionicons name="send-outline" size={15} color={Colors.primary} />
                            <Text style={styles.reviewSubmitText}>Post Review</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                )}

                {/* Not logged in */}
                {!user && (
                  <TouchableOpacity
                    style={styles.loginPrompt}
                    onPress={() => showAuthPrompt({ message: 'Sign in to leave a review', action: 'leave a review' })}
                  >
                    <Ionicons name="log-in-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.loginPromptText}>
                      <Text style={styles.loginLink}>Sign in</Text> to leave a review
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Review list */}
                {reviewsLoading ? (
                  <View style={{ gap: Spacing.sm }}>
                    {[1, 2, 3].map(i => (
                      <View key={i} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          <SkeletonBlock w={36} h={36} radius={18} />
                          <View style={{ flex: 1, gap: 6 }}>
                            <SkeletonBlock w="50%" h={12} />
                            <SkeletonBlock w="30%" h={10} />
                          </View>
                        </View>
                        <SkeletonBlock w="100%" h={12} />
                        <SkeletonBlock w="80%" h={12} />
                      </View>
                    ))}
                  </View>
                ) : reviews.length === 0 ? (
                  <View style={styles.noReviewsWrap}>
                    <Ionicons name="chatbubble-ellipses-outline" size={36} color={Colors.border} />
                    <Text style={styles.noReviews}>No reviews yet</Text>
                    <Text style={styles.noReviewsSub}>Be the first to share your thoughts!</Text>
                  </View>
                ) : (
                  <>
                    {reviews.map(r => (
                      <ReviewCard
                        key={r._id}
                        review={r}
                        currentUserId={user?.userId ?? null}
                        onDelete={handleDeleteReview}
                      />
                    ))}

                    {/* Pagination */}
                    {reviewPages > 1 && (
                      <View style={styles.pagination}>
                        <TouchableOpacity
                          style={[styles.pageBtn, reviewPage === 1 && styles.pageBtnDisabled]}
                          disabled={reviewPage === 1}
                          onPress={() => loadReviews(reviewPage - 1)}
                        >
                          <Ionicons name="chevron-back" size={16} color={reviewPage === 1 ? Colors.textMuted : Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.pageText}>{reviewPage} / {reviewPages}</Text>
                        <TouchableOpacity
                          style={[styles.pageBtn, reviewPage === reviewPages && styles.pageBtnDisabled]}
                          disabled={reviewPage === reviewPages}
                          onPress={() => loadReviews(reviewPage + 1)}
                        >
                          <Ionicons name="chevron-forward" size={16} color={reviewPage === reviewPages ? Colors.textMuted : Colors.text} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* You May Also Like */}
            {similar.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.similarTitle}>You May Also Like</Text>
                <FlatList
                  data={similar}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={b => b._id}
                  contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.base }}
                  renderItem={({ item }) => <BookCard book={item} width={CARD_W} />}
                />
              </View>
            )}

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomPrice}>£{price.toFixed(2)}</Text>
            <Text style={styles.bottomPriceSub}>incl. VAT</Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, book.stock === 0 && styles.addBtnDisabled]}
            onPress={() => {
              if (inCart) {
                router.push('/(tabs)/cart');
              } else if (!user) {
                showAuthPrompt({ message: 'Sign in to add to your bag', action: 'add books to your bag' });
              } else if (book.stock > 0) {
                addToCart({ id: book._id, img: imageUrl, title: book.title, author: book.author, price, stock: book.stock });
              }
            }}
            disabled={book.stock === 0}
          >
            <Ionicons
              name={inCart ? 'bag-check-outline' : 'bag-add-outline'}
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.addBtnText}>
              {inCart ? 'View in Cart' : book.stock === 0 ? 'Out of Stock' : 'Add to Bag'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  errorScreen: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', paddingHorizontal: Spacing.base },

  // Hero — fixed behind the scrollable content
  imageWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: IMAGE_H, backgroundColor: Colors.skeleton,
  },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  topBarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Detail card — rounded top, slides over the fixed image
  detailContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.base,
  },
  bookMeta: { gap: Spacing.sm, marginBottom: Spacing.base },
  bookTitle: { ...Typography.title1, color: Colors.text, lineHeight: 32 },
  bookAuthor: { ...Typography.callout, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
  conditionBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  conditionText: { fontSize: 12, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  price: { fontSize: 28, fontWeight: '800', color: Colors.accent },
  originalPrice: { fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: `${Colors.error}15`, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { fontSize: 12, fontWeight: '700', color: Colors.error },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockText: { fontSize: 13, fontWeight: '600' },

  // Tabs
  tabs: {
    flexDirection: 'row', borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSecondary, padding: 4, marginBottom: Spacing.base,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.md },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { fontWeight: '700', color: Colors.text },

  // Info tab
  infoTab: { gap: Spacing.base, marginBottom: Spacing.xl },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },
  noDescription: { ...Typography.callout, color: Colors.textMuted, fontStyle: 'italic' },
  infoGrid: { gap: 0 },
  infoItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  infoLabel: { ...Typography.callout, color: Colors.textMuted },
  infoValue: { ...Typography.callout, color: Colors.text, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  // Reviews tab
  reviewsTab: { gap: Spacing.md, marginBottom: Spacing.xl },
  ratingCard: {
    flexDirection: 'row', gap: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  ratingLeft: { alignItems: 'center', gap: Spacing.xs, minWidth: 72 },
  ratingBig: { fontSize: 38, fontWeight: '800', color: Colors.text, lineHeight: 44 },
  ratingCount: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  ratingBars: { flex: 1, gap: 5, justifyContent: 'center' },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingBarLabel: { fontSize: 11, color: Colors.textMuted, width: 8 },
  ratingBarBg: { flex: 1, height: 6, backgroundColor: Colors.skeleton, borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: 6, backgroundColor: Colors.accent, borderRadius: 3 },
  ratingBarCount: { fontSize: 11, color: Colors.textMuted, width: 20, textAlign: 'right' },

  writeReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: `${Colors.accent}12`,
    borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
    borderWidth: 1, borderColor: `${Colors.accent}35`,
  },
  writeReviewText: { ...Typography.callout, color: Colors.accent, fontWeight: '700' },

  // Review form
  reviewForm: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.base, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  reviewFormHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewFormTitle: { ...Typography.headline, color: Colors.text },
  ratingPickerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ratingLabel: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic' },
  textInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: 14, color: Colors.text, backgroundColor: Colors.background,
  },
  textArea: { height: 90, paddingTop: Spacing.sm },
  charCount: { ...Typography.caption, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  reviewSubmitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.accent,
    borderRadius: Radius.md, paddingVertical: Spacing.md,
  },
  reviewSubmitBtnDisabled: { opacity: 0.5 },
  reviewSubmitText: { ...Typography.headline, color: Colors.primary },

  loginPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
  },
  loginPromptText: { ...Typography.callout, color: Colors.textSecondary },
  loginLink: { fontWeight: '700', color: Colors.text },

  noReviewsWrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  noReviews: { ...Typography.callout, color: Colors.textMuted, fontWeight: '600' },
  noReviewsSub: { ...Typography.caption, color: Colors.textMuted },

  // Review card
  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  reviewName: { ...Typography.captionBold, color: Colors.text },
  reviewDate: { ...Typography.caption, color: Colors.textMuted },
  reviewTitle: { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  reviewBody: { ...Typography.callout, color: Colors.textSecondary, lineHeight: 20 },
  reviewBodyEmpty: { ...Typography.callout, color: Colors.textMuted, fontStyle: 'italic' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 11, color: Colors.success, fontWeight: '600' },

  // Pagination
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  pageBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageText: { ...Typography.callout, color: Colors.textMuted, fontWeight: '600' },

  // Similar
  similarSection: { marginTop: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.lg },
  similarTitle: { ...Typography.title3, color: Colors.text },

  // Bottom bar
  bottomBar: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  bottomBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.base,
  },
  bottomPrice: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  bottomPriceSub: { ...Typography.caption, color: Colors.textMuted },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.accent,
    borderRadius: Radius.lg, paddingVertical: Spacing.md,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { ...Typography.headline, color: Colors.primary },
});
