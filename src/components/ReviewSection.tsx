import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, Send, LogIn, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getListingReviews,
  getListingReviewSummary,
  submitReview,
  deleteReview,
  Review,
  ReviewSummary,
} from "../services/reviewService";
import { useAuth } from "../context/authContext";

/* ── helpers ──────────────────────────────────────────────────── */
const StarRow = ({
  value,
  size = 16,
  interactive = false,
  hovered,
  onHover,
  onClick,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  hovered?: number;
  onHover?: (n: number) => void;
  onClick?: (n: number) => void;
}) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => {
      const filled = hovered != null ? n <= hovered : n <= Math.round(value);
      return (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={filled ? "currentColor" : "none"}
          stroke={filled ? "#facc15" : "#d1d5db"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={filled ? "text-yellow-400" : "text-gray-300"}
          style={interactive ? { cursor: "pointer" } : undefined}
          onMouseEnter={interactive && onHover ? () => onHover(n) : undefined}
          onMouseLeave={interactive && onHover ? () => onHover(0) : undefined}
          onClick={interactive && onClick ? () => onClick(n) : undefined}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    })}
  </div>
);

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const getDisplayName = (r: Review) => {
  const u = r.user;
  if (!u) return "Customer";
  // Populated object: { name, firstName, lastName, email, _id }
  if (typeof u === "object") {
    if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    if (u.name) return u.name;
    if (u.email) return u.email.split("@")[0];
  }
  // String ID: just show "Customer" — we don't have the name
  return "Customer";
};

const getInitial = (r: Review) => {
  const name = getDisplayName(r);
  return name !== "Customer" ? name.charAt(0).toUpperCase() : "C";
};

/* ── Breakdown bar ─────────────────────────────────────────────── */
const BreakdownBar = ({ summary }: { summary: ReviewSummary }) => {
  const max = Math.max(...summary.breakdown.map((b) => b.count), 1);
  const stars = [5, 4, 3, 2, 1];
  return (
    <div className="space-y-1.5 w-full">
      {stars.map((star) => {
        const row = summary.breakdown.find((b) => b.star === star);
        const count = row?.count ?? 0;
        const pct = Math.round((count / max) * 100);
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 w-2">{star}</span>
            <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-yellow-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Review card ────────────────────────────────────────────────── */
const ReviewCard = ({
  review,
  currentUserId,
  onDelete,
}: {
  review: Review;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}) => {
  const reviewUserId = typeof review.user === "object" ? review.user._id : review.user;
  const isOwn = !!(currentUserId && reviewUserId && reviewUserId === currentUserId);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    onDelete(review._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-gray-50 rounded-2xl p-4 space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            {getInitial(review)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{getDisplayName(review)}</p>
            <p className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StarRow value={review.rating} size={13} />
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              title="Delete my review"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed pl-10">{review.comment}</p>
      )}
    </motion.div>
  );
};

/* ── Submit form ────────────────────────────────────────────────── */
const SubmitForm = ({
  listingId,
  token,
  userId,
  onSuccess,
}: {
  listingId: string;
  token: string;
  userId?: string | null;
  onSuccess: (r: Review) => void;
}) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating"); return; }
    if (comment.trim().length < 3) { toast.error("Please write a short review"); return; }
    setSubmitting(true);
    try {
      const newReview = await submitReview(listingId, rating, comment.trim(), token, userId);
      toast.success("Review submitted!");
      setRating(0);
      setComment("");
      onSuccess(newReview);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-black text-gray-700">Write a review</p>
      <div className="flex items-center gap-2">
        <StarRow
          value={rating}
          size={24}
          interactive
          hovered={hovered}
          onHover={setHovered}
          onClick={setRating}
        />
        <span className="text-xs text-gray-400">{rating > 0 ? ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating] : "Tap to rate"}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts about this book…"
        rows={3}
        maxLength={1000}
        className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 focus:border-[#0a1628] placeholder:text-gray-300"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-300">{comment.length}/1000</span>
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex items-center gap-2 bg-[#0a1628] text-black text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-[#1a2d4a] transition-colors"
        >
          <Send size={13} />
          {submitting ? "Submitting…" : "Post Review"}
        </button>
      </div>
    </form>
  );
};

/* ── Main ReviewSection ─────────────────────────────────────────── */
interface ReviewSectionProps {
  listingId: string;
  variant?: "mobile" | "desktop";
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ listingId, variant = "desktop" }) => {
  const { auth } = useAuth();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const LIMIT = 5;

  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const s = await getListingReviewSummary(listingId);
      setSummary(s);
    } catch {
      setSummary({ averageRating: 0, reviewCount: 0, breakdown: [] });
    } finally {
      setLoadingSummary(false);
    }
  }, [listingId]);

  const fetchReviews = useCallback(async (p: number) => {
    try {
      setLoadingReviews(true);
      const res = await getListingReviews(listingId, p, LIMIT);
      setReviews(res.reviews);
      setPage(res.page);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchSummary();
    fetchReviews(1);
  }, [fetchSummary, fetchReviews]);

  const handleDelete = async (reviewId: string) => {
    if (!auth.token) return;
    try {
      await deleteReview(reviewId, auth.token);
      toast.success("Review removed");
      fetchReviews(page);
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to delete review");
    }
  };

  const handleNewReview = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    fetchSummary();
  };

  const avgRating = summary?.averageRating ?? 0;
  const reviewCount = summary?.reviewCount ?? total;

  return (
    <div className={`space-y-5 ${variant === "mobile" ? "px-0" : ""}`}>
      {/* ── Summary header ── */}
      <div className={`flex ${variant === "mobile" ? "flex-col items-center text-center gap-3" : "items-start gap-6"}`}>
        {loadingSummary ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 text-center">
              <p className="text-4xl font-black text-[#0a1628]">
                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
              </p>
              <StarRow value={avgRating} size={16} />
              <p className="text-xs text-gray-400 mt-1">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</p>
            </div>
            {summary && summary.breakdown.length > 0 && (
              <div className={`${variant === "mobile" ? "w-full max-w-xs" : "flex-1"}`}>
                <BreakdownBar summary={summary} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Submit form ── */}
      {auth.token ? (
        <SubmitForm listingId={listingId} token={auth.token} userId={auth.userId} onSuccess={handleNewReview} />
      ) : (
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
          <LogIn size={16} className="text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-500">
            <Link to="/login" className="font-bold text-[#0a1628] underline hover:no-underline">Sign in</Link>
            {" "}to leave a review
          </p>
        </div>
      )}

      {/* ── Review list ── */}
      {loadingReviews ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="h-3 w-28 bg-gray-200 rounded" />
              </div>
              <div className="h-3 w-full bg-gray-200 rounded pl-10" />
              <div className="h-3 w-3/4 bg-gray-200 rounded pl-10" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare size={28} className="text-gray-200 mb-2" />
          <p className="text-sm font-semibold text-gray-400">No reviews yet</p>
          <p className="text-xs text-gray-300 mt-1">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                currentUserId={auth.userId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => fetchReviews(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-bold text-gray-400">{page} / {pages}</span>
          <button
            onClick={() => fetchReviews(page + 1)}
            disabled={page === pages}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
