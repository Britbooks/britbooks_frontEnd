import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ShoppingCart, BookOpen } from "lucide-react";

import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import SEOHead, { buildBookSchema, buildBreadcrumbSchema } from "../components/SEOHead";
import { useCart } from "../context/cartContext";

const API_BASE = "https://britbooks-api-production-8ebd.up.railway.app/api";
const FALLBACK_COVER = "https://placehold.co/300x450?text=Book+Cover";

interface Offer {
  listingId: string;
  slug: string;
  sku: string | null;
  condition: string | null;
  price: number;
  currency: string;
  stock: number;
  coverImageUrl: string | null;
}

interface BookMeta {
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  publicationDate: string | null;
  language: string;
  format: string | null;
  coverImageUrl: string | null;
  description: string | null;
  averageRating: number;
  reviewCount: number;
  offerCount: number;
  totalCopies: number;
  priceRange: { low: number; high: number; currency: string };
}

const formatMoney = (n: number, currency = "GBP") =>
  `${currency === "GBP" ? "£" : ""}${Number(n || 0).toFixed(2)}`;

const capitalise = (s: string | null) =>
  (s || "").replace(/\b\w/g, (c) => c.toUpperCase()) || "Used";

const BookByIsbn: React.FC = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const { addToCart } = useCart();

  const [book, setBook] = useState<BookMeta | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBook(null);
    setOffers([]);
    setImgErr(false);

    axios
      .get(`${API_BASE}/market/book/${encodeURIComponent(isbn || "")}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          setBook(res.data.book);
          setOffers(res.data.offers || []);
        } else {
          setError("Book not found.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this book.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isbn]);

  const handleAdd = (offer: Offer) => {
    if (!book) return;
    addToCart({
      id: offer.listingId,
      img: offer.coverImageUrl || book.coverImageUrl || FALLBACK_COVER,
      title: book.title,
      author: book.author,
      price: formatMoney(offer.price, offer.currency),
      quantity: 1,
    });
    toast.success(`Added ${capitalise(offer.condition)} copy to cart`);
  };

  const structuredData = useMemo(() => {
    if (!book) return undefined;
    return [
      ...buildBookSchema({
        id: book.isbn,
        title: book.title,
        author: book.author,
        description: book.description || undefined,
        image: book.coverImageUrl || undefined,
        isbn: book.isbn,
        price: book.priceRange.low,
        condition: offers[0]?.condition || undefined,
        availability: offers.some((o) => o.stock > 0) ? "InStock" : "OutOfStock",
      }),
      buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Browse", url: "/explore" },
        { name: book.title, url: `/book/${book.isbn}` },
      ]),
    ];
  }, [book, offers]);

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />
      <TopBar />

      {book && (
        <SEOHead
          title={`${book.title} by ${book.author}`}
          description={
            book.description
              ? book.description.slice(0, 160)
              : `${book.title} by ${book.author} — ${book.totalCopies} ${book.totalCopies === 1 ? "copy" : "copies"} available from ${formatMoney(book.priceRange.low, book.priceRange.currency)}.`
          }
          canonical={`/book/${book.isbn}`}
          image={book.coverImageUrl || undefined}
          type="book"
          structuredData={structuredData}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-500">
            Loading…
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-24">
            <p className="text-lg text-gray-700">{error}</p>
            <Link to="/explore" className="text-blue-600 underline mt-4 inline-block">
              Back to browse
            </Link>
          </div>
        )}

        {book && !loading && (
          <>
            <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:underline">
                Home
              </Link>{" "}
              ›{" "}
              <Link to="/explore" className="hover:underline">
                Browse
              </Link>{" "}
              › <span className="text-gray-800">{book.title}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 mb-10">
              <div>
                <img
                  src={imgErr ? FALLBACK_COVER : book.coverImageUrl || FALLBACK_COVER}
                  onError={() => setImgErr(true)}
                  alt={`${book.title} — cover image`}
                  className="w-full rounded-lg shadow"
                  width={280}
                />
              </div>

              <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-700 mb-4">by {book.author}</p>

                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm text-gray-600 mb-4">
                  <dt className="font-medium">ISBN</dt>
                  <dd>{book.isbn}</dd>
                  {book.publisher && (
                    <>
                      <dt className="font-medium">Publisher</dt>
                      <dd>{book.publisher}</dd>
                    </>
                  )}
                  {book.publicationDate && (
                    <>
                      <dt className="font-medium">Published</dt>
                      <dd>{book.publicationDate}</dd>
                    </>
                  )}
                  {book.format && (
                    <>
                      <dt className="font-medium">Format</dt>
                      <dd>{book.format}</dd>
                    </>
                  )}
                </dl>

                <p className="text-lg font-semibold text-gray-900 mb-1">
                  <BookOpen className="inline w-5 h-5 mr-1 -mt-1" />
                  {book.totalCopies === 1
                    ? `1 copy available at ${formatMoney(book.priceRange.low, book.priceRange.currency)}`
                    : `${book.totalCopies} copies from ${formatMoney(book.priceRange.low, book.priceRange.currency)}`}
                </p>

                {book.description && (
                  <p className="text-gray-700 mt-4 leading-relaxed">
                    {book.description}
                  </p>
                )}
              </div>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Available copies
              </h2>
              <ul className="divide-y divide-gray-200 border-y border-gray-200">
                {offers.map((offer) => (
                  <li
                    key={offer.listingId}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {capitalise(offer.condition)}
                      </p>
                      {offer.sku && (
                        <p className="text-xs text-gray-500">SKU: {offer.sku}</p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 w-24 text-right">
                      {formatMoney(offer.price, offer.currency)}
                    </p>
                    <div className="ml-4 flex items-center gap-2">
                      <Link
                        to={`/browse/${offer.slug}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleAdd(offer)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {offers.length < book.totalCopies && (
                <p className="text-sm text-gray-500 mt-3">
                  Showing {offers.length} of {book.totalCopies} copies.
                </p>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BookByIsbn;
