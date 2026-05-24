"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  X,
  CreditCard,
  Lock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  MapPin,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useCart } from "../context/cartContext";
import { useAuth } from "../context/authContext";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Addresses } from "./Addresses";
import toast, { Toaster } from "react-hot-toast";
import { fetchBooks } from "../data/books";
import type { CartItem } from "../context/cartContext";
import BookCard from "../components/BookCard";
import SEOHead from '../components/SEOHead';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API_BASE_URL = "https://britbooks-api-production-8ebd.up.railway.app/api";


interface AppliedCampaign {
  campaignId: string;
  title: string;
  type: string;
  discountAmount: number;
  finalTotal: number;
  isFreeShipping: boolean;
}

interface ShoppingCartViewProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  goToNextStep: () => void;
  appliedCampaign: AppliedCampaign | null;
  setAppliedCampaign: (c: AppliedCampaign | null) => void;
  authToken: string | null;
  userId: string | null;
}


// ──────────────────────────────────────────────
// Reusable small components
// ──────────────────────────────────────────────

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "#facc15" : "#d1d5db"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={filled ? "text-yellow-400" : "text-gray-300"}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

 

const BookShelf = ({ title, fetchParams, currentBookId }: { title: string; fetchParams: any; currentBookId?: string }) => {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5;
  const maxPages = 20;

  useEffect(() => {
    const fetchShelfBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchBooks({
          page: 1,
          limit: 12,
          ...fetchParams,
        });

        let fetchedBooks = response?.listings || [];

        if (currentBookId) {
          fetchedBooks = fetchedBooks.filter((b: any) => b.id !== currentBookId);
        }

        setBooks(fetchedBooks);
      } catch (err) {
        console.error(err);
        setError(`Failed to load ${title.toLowerCase()}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShelfBooks();
  }, [fetchParams, currentBookId, title]);

  const totalPages = Math.min(Math.ceil(books.length / booksPerPage), maxPages);
  const startIndex = (currentPage - 1) * booksPerPage;
  const paginatedBooks = books.slice(startIndex, startIndex + booksPerPage);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  if (isLoading) {
    return (
      <section className="py-6">
        <h2 className="text-xl font-bold text-blue-800 mb-4">{title}</h2>
        <p className="text-gray-500 text-center">Loading {title.toLowerCase()}...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6">
        <h2 className="text-xl font-bold text-blue-800 mb-4">{title}</h2>
        <p className="text-red-500 text-center">{error}</p>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-800">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {paginatedBooks.map((book) => (
         <BookCard
         key={book._id || book.id}
         id={book._id || book.id}
         img={book.imageUrl}  
         title={book.title}
         author={book.author}
         price={typeof book.price === "number" ? `£${book.price.toFixed(2)}` : book.price}
       />
        ))}
      </div>
      {paginatedBooks.length === 0 && (
        <p className="text-center text-gray-500 py-4">No {title.toLowerCase()} available.</p>
      )}
    </section>
  );
};

const CheckoutStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { label: "Basket", short: "1" },
    { label: "Payment", short: "2" },
    { label: "Confirm", short: "3" },
  ];
  return (
    <div className="w-full max-w-2xl mx-auto mb-6 sm:mb-12">
      {/* Mobile stepper */}
      <div className="flex items-center sm:hidden px-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  isActive ? "bg-[#c9a84c] text-black shadow-md" : isCompleted ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {isCompleted ? <Check size={14} /> : stepNumber}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? "text-[#0a1628]" : isCompleted ? "text-[#c9a84c]" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${isCompleted ? "bg-[#c9a84c]" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  isActive ? "bg-[#c9a84c] text-black shadow-lg" : isCompleted ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-400"
                }`}>
                  {isCompleted ? <Check size={20} /> : stepNumber}
                </div>
                <p className={`mt-2 text-sm font-semibold ${isActive || isCompleted ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full ${isCompleted ? "bg-[#c9a84c]" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const ShoppingCartView: React.FC<ShoppingCartViewProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  goToNextStep,
  appliedCampaign,
  setAppliedCampaign,
  authToken,
  userId,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/campaigns/validate`,
        { code: promoCode.trim().toUpperCase(), userId, cartTotal: subtotal },
        authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
      );
      if (res.data?.campaignId) {
        setAppliedCampaign(res.data);
        setPromoCode('');
        toast.success(`${res.data.title} applied — £${res.data.discountAmount.toFixed(2)} off!`);
      } else {
        setPromoError('Invalid or expired code.');
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const getDisplayImage = (item: CartItem) => {
    return imageErrors[item.id]
      ? "https://placehold.co/300x450?text=Book+Cover"
      : item.img;
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const priceNumber = Number(
      (typeof item.price === "string" ? item.price.replace("£", "") : item.price)
    );
    return sum + priceNumber * item.quantity;
  }, 0);
  const discount = appliedCampaign?.discountAmount ?? 0;
  const effectiveShipping = appliedCampaign?.isFreeShipping ? 0 : cartItems.length > 0 ? 5.0 : 0;
  const shipping = effectiveShipping;
  const total = Math.max(subtotal - discount, 0) + shipping;

  const freeShippingThreshold = 4;
  const booksInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shippingProgress = Math.min((booksInCart / freeShippingThreshold) * 100, 100);
  const booksNeeded = Math.max(0, freeShippingThreshold - booksInCart);

  return (
    <>
      {/* ── MOBILE LAYOUT ── */}
      <div className="sm:hidden pb-40">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
              <Package size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Your basket is empty</h3>
            <p className="text-gray-400 text-sm mb-6">Looks like you haven't added any books yet.</p>
            <Link to="/category" className="bg-[#c9a84c] text-black font-bold px-8 py-3 rounded-2xl text-sm">
              Browse Books
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping bar */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              {booksNeeded === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Truck size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-emerald-700">Free delivery unlocked!</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-600">
                      Add <span className="text-[#0a1628] font-black">{booksNeeded} more book{booksNeeded > 1 ? 's' : ''}</span> for free delivery
                    </p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${shippingProgress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-[#c9a84c] rounded-full"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Cart items */}
            <div className="space-y-3 mb-4">
              <AnimatePresence>
                {cartItems.map((item) => {
                  const itemPrice = typeof item.price === "string" ? Number(item.price.replace("£", "")) : item.price;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -60, height: 0 }}
                      className="bg-white rounded-2xl p-3 flex gap-3 border border-gray-100"
                    >
                      <img
                        src={getDisplayImage(item)}
                        alt={item.title}
                        onError={() => handleImageError(item.id)}
                        className="w-16 h-22 rounded-xl object-cover flex-shrink-0"
                        style={{ height: 88 }}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">{item.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{item.author}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          {/* Qty stepper */}
                          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1 py-1">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center disabled:text-gray-300"
                            >
                              <Minus size={12} className="text-gray-700" />
                            </motion.button>
                            <span className="text-sm font-black text-gray-800 w-5 text-center">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center"
                            >
                              <Plus size={12} className="text-gray-700" />
                            </motion.button>
                          </div>
                          <span className="font-black text-[#0a1628] text-sm">£{(itemPrice * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 self-start mt-0.5"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <button
              onClick={clearCart}
              className="w-full py-3 rounded-2xl border border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest"
            >
              Clear Basket
            </button>
          </>
        )}

        {/* Sticky bottom order summary + CTA */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-6"
            style={{ boxShadow: '0 -8px 30px rgba(10,22,40,0.10)' }}>
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Subtotal ({booksInCart} items)</span>
              <span className="font-bold text-gray-800">£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Shipping</span>
              <span className={booksNeeded === 0 || appliedCampaign?.isFreeShipping ? "text-emerald-600 font-bold" : "font-bold text-gray-800"}>
                {booksNeeded === 0 || appliedCampaign?.isFreeShipping ? "FREE" : `£${shipping.toFixed(2)}`}
              </span>
            </div>
            {appliedCampaign && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold mb-1">
                <span className="flex items-center gap-1"><Check size={12} /> {appliedCampaign.title}</span>
                <span>-£{appliedCampaign.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Mobile promo code */}
            {appliedCampaign ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 mb-2">
                <span className="text-xs font-bold text-emerald-700">{appliedCampaign.title} applied</span>
                <button onClick={() => setAppliedCampaign(null)} className="text-xs text-gray-400 font-bold">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                  onKeyDown={e => e.key === 'Enter' && applyPromoCode()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
                />
                <button
                  onClick={applyPromoCode}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-4 py-2 bg-[#0a1628] text-white text-xs font-bold rounded-xl disabled:opacity-40"
                >
                  {promoLoading ? '…' : 'Apply'}
                </button>
              </div>
            )}
            {promoError && <p className="text-red-500 text-xs mb-1 font-medium">{promoError}</p>}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={goToNextStep}
              className="w-full py-4 bg-[#c9a84c] text-black font-black rounded-2xl text-sm flex items-center justify-between px-6"
            >
              <span>Proceed to Checkout</span>
              <span className="text-black font-black">£{total.toFixed(2)}</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* ── DESKTOP LAYOUT (unchanged) ── */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h2>
            {cartItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-lg mb-4">Your cart is empty.</p>
                <Link to="/category" className="text-red-600 font-semibold hover:underline">Continue Shopping</Link>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">PRODUCT</th>
                        <th className="text-left p-4 font-semibold text-gray-700">PRICE</th>
                        <th className="text-left p-4 font-semibold text-gray-700">QUANTITY</th>
                        <th className="text-left p-4 font-semibold text-gray-700">TOTAL</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <img src={getDisplayImage(item)} alt={item.title} className="w-20 h-28 object-cover rounded shadow-sm" onError={() => handleImageError(item.id)} loading="lazy" />
                              <div>
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium">{item.price}</td>
                          <td className="p-4">
                            <div className="flex items-center border rounded-lg w-fit">
                              <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="px-3 py-1 hover:bg-gray-100" disabled={item.quantity <= 1}>-</button>
                              <span className="px-4 py-1 border-x">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100">+</button>
                            </div>
                          </td>
                          <td className="p-4 font-bold">£{((typeof item.price === "string" ? Number(item.price.replace("£", "")) : item.price) * item.quantity).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"><X size={20} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 flex gap-4">
                  <Link to="/category" className="px-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition text-center">CONTINUE SHOPPING</Link>
                  <button onClick={clearCart} className="px-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition">CLEAR CART</button>
                </div>
              </>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md border sticky top-24">
              <h3 className="text-xl font-bold mb-5">Order Summary</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">£{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={`font-medium ${appliedCampaign?.isFreeShipping ? 'text-emerald-600 line-through' : ''}`}>
                    {appliedCampaign?.isFreeShipping ? 'FREE' : `£${shipping.toFixed(2)}`}
                  </span>
                </div>
                {appliedCampaign && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-medium flex items-center gap-1"><Check size={13} /> {appliedCampaign.title}</span>
                    <span className="font-bold">-£{appliedCampaign.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span className="text-red-600">£{total.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Promo code */}
              {appliedCampaign ? (
                <div className="mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5"><Check size={14} /> {appliedCampaign.title}</span>
                  <button onClick={() => setAppliedCampaign(null)} className="text-xs text-gray-400 hover:text-red-500 font-bold">Remove</button>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                      onKeyDown={e => e.key === 'Enter' && applyPromoCode()}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
                    />
                    <button
                      onClick={applyPromoCode}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2.5 bg-[#0a1628] text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-[#1a2d4f] transition"
                    >
                      {promoLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-xs mt-1.5 font-medium">{promoError}</p>}
                </div>
              )}

              <button onClick={goToNextStep} disabled={cartItems.length === 0} className="w-full mt-6 py-4 bg-red-400 text-black font-bold rounded-lg hover:bg-red-200 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">PROCEED TO CHECKOUT</button>
            </div>
          </div>
        </div>
        {cartItems.length > 0 && (
          <div className="mt-16">
            <BookShelf title="You may also like" fetchParams={{ filters: { genre: "Fiction" }, sort: "rating", order: "desc" }} currentBookId={cartItems[0]?.id} />
          </div>
        )}
      </div>
    </>
  );
};

const PaymentForm = ({
  goToNextStep,
  setPaymentData,
}: {
  goToNextStep: () => void;
  setPaymentData: (data: any) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"credit-card" | "paypal">("credit-card");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    line1: "",
    city: "",
    phoneNumber: "",
    postalCode: "",
    country: "GB",
  });

  const userId = auth.token ? jwtDecode<{ userId: string }>(auth.token)?.userId : null;

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!auth.token || !userId) {
        setError("Please log in to view addresses.");
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}/address`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setAddresses(response.data.addresses || []);
        const defaultAddress = response.data.addresses.find((addr: any) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setShippingAddress({
            name: defaultAddress.fullName,
            line1: defaultAddress.addressLine2
              ? `${defaultAddress.addressLine1}, ${defaultAddress.addressLine2}`
              : defaultAddress.addressLine1,
            city: defaultAddress.city,
            phoneNumber: defaultAddress.phoneNumber,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
          });
        }
        setError(null);
      } catch (err: any) {
        console.error("Fetch addresses error:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          logout();
          navigate("/login");
        } else {
          setError("Failed to load addresses. Please try again.");
        }
      }
    };
    if (useSavedAddress) {
      fetchAddresses();
    }
  }, [auth.token, userId, navigate, logout, useSavedAddress]);

  const handleSelectAddress = (address: any) => {
    setSelectedAddressId(address._id);
    setShippingAddress({
      name: address.fullName,
      line1: address.addressLine2 ? `${address.addressLine1}, ${address.addressLine2}` : address.addressLine1,
      city: address.city,
      phoneNumber: address.phoneNumber,
      postalCode: address.postalCode,
      country: address.country,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      const { token, error: stripeError } = await stripe.createToken(cardElement!);

      if (stripeError) {
        setError(stripeError.message ?? null);
        setLoading(false);
        return;
      }

      setPaymentData({
        token: token.id,
        shippingAddress,
      });

      goToNextStep();
    } catch (err) {
      setError("Failed to process payment details. Please try again.");
      console.error("Payment form error:", err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:bg-white transition-all";

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg sm:text-2xl font-black text-gray-800 text-center mb-5 sm:mb-8">Payment & Delivery</h2>

      {/* Payment method tabs */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setActiveTab("credit-card")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
            activeTab === "credit-card" ? "border-[#c9a84c] bg-[#c9a84c] text-black" : "border-gray-200 text-gray-600 bg-white"
          }`}
        >
          <CreditCard size={16} /> Card
        </button>
        <button
          onClick={() => setActiveTab("paypal")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
            activeTab === "paypal" ? "border-[#c9a84c] bg-[#c9a84c] text-black" : "border-gray-200 text-gray-600 bg-white"
          }`}
        >
          PayPal
        </button>
      </div>

      {activeTab === "credit-card" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shipping section */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-blue-500" />
              </div>
              <h3 className="font-black text-sm text-gray-800">Delivery Address</h3>
            </div>
            <div className="px-5 py-4">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <div
                  onClick={() => setUseSavedAddress(!useSavedAddress)}
                  className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${useSavedAddress ? "bg-[#0a1628]" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${useSavedAddress ? "left-6" : "left-1"}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Use saved address</span>
              </label>

              {useSavedAddress ? (
                <Addresses
                  addresses={addresses}
                  setAddresses={setAddresses}
                  authToken={auth.token}
                  userId={userId}
                  navigate={navigate}
                  onSelectAddress={handleSelectAddress}
                  selectedAddressId={selectedAddressId}
                />
              ) : (
                <div className="space-y-3">
                  <input type="text" placeholder="Full Name" value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} className={inputClass} required />
                  <input type="text" placeholder="Address Line 1" value={shippingAddress.line1} onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })} className={inputClass} required />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="City" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} className={inputClass} required />
                    <input type="text" placeholder="Postcode" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })} className={inputClass} required />
                  </div>
                  <input type="tel" placeholder="Phone Number" value={shippingAddress.phoneNumber} onChange={(e) => setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value })} className={inputClass} required />
                  <input type="text" placeholder="Country" value={shippingAddress.country} onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })} className={inputClass} required />
                </div>
              )}
            </div>
          </div>

          {/* Card details section */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <CreditCard size={16} className="text-purple-500" />
              </div>
              <h3 className="font-black text-sm text-gray-800">Card Details</h3>
              <Lock size={12} className="text-gray-300 ml-auto" />
            </div>
            <div className="px-5 py-4">
              <CardElement
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl"
                options={{
                  style: {
                    base: { fontSize: "16px", color: "#0a1628", "::placeholder": { color: "#9ca3af" } },
                    invalid: { color: "#ef4444" },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" /> 256-bit SSL encrypted · Secured by Stripe
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-4 bg-[#c9a84c] text-black font-black rounded-2xl text-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={loading || !stripe || !shippingAddress.name}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing…
              </span>
            ) : "Continue to Review →"}
          </motion.button>
        </form>
      )}

      {activeTab === "paypal" && (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 font-black text-xl">PP</span>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-6">You'll be redirected to PayPal to complete your purchase securely.</p>
          <button className="w-full py-4 bg-[#0070ba] text-black font-black rounded-2xl text-sm">PAY WITH PAYPAL</button>
        </div>
      )}
    </div>
  );
};

const ReviewOrder = ({
  cartItems,
  goToPreviousStep,
  paymentData,
  setPaymentData,
  setSuccessData,
  appliedCampaign,
}: any) => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + (typeof item.price === "string" ? Number(item.price.replace("£", "")) : Number(item.price)) * item.quantity, 0);
  const discount = appliedCampaign?.discountAmount ?? 0;
  const shipping = appliedCampaign?.isFreeShipping ? 0 : 5.0;
  const total = Math.max(subtotal - discount, 0) + shipping;

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const getDisplayImage = (item: any) => {
    if (imageErrors[item.id]) {
      return "https://placehold.co/300x450?text=Book+Cover";
    }
    return item.img; // ← FIXED: use img, not imageUrl
  };

  const handlePlaceOrder = async () => {
    if (!auth.token) {
      setError("Please log in to place an order.");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
  
    if (loading) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const decoded = jwtDecode<{ userId: string }>(auth.token);
      const userId = decoded.userId;
      const newOrderId = `ORDER_${Date.now()}`;
      const items = cartItems.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        price: typeof item.price === "string" ? parseFloat(item.price.replace("£", "")) : Number(item.price),
      }));
  
      const response = await axios.post(
        `${API_BASE_URL}/payments/create-payment`,
        {
          userId,
          email: auth.user?.email,
          orderId: newOrderId,
          shippingAddress: paymentData.shippingAddress,
          items,
          subtotal,
          shippingFee: shipping,
          discountAmount: discount,
          campaignId: appliedCampaign?.campaignId ?? null,
          total,
          currency: "gbp",
          token: paymentData.token,
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
  
      const { success, type, message, items: errorItems, clientSecret, reference, status, requiresAction, receiptUrl } = response.data;
  
      if (type === "stock_error") {
        // Display unavailable items
        const itemList = errorItems.map((i: any) => `${i.title} (Available: ${i.available})`).join(", ");
        setError(`Some items are unavailable: ${itemList}`);
        setLoading(false);
        return;
      }
  
      // Handle Stripe or successful payment as before
      if (requiresAction) {
        const stripe = await stripePromise;
        const { error: confirmError, paymentIntent } = await stripe!.confirmCardPayment(clientSecret);
  
        if (confirmError) {
          setError(confirmError.message || "Payment failed.");
          setLoading(false);
          return;
        }
  
        if (paymentIntent.status === "succeeded") {
          await finalizeOrder(paymentIntent.id, receiptUrl);
        } else {
          setError("Payment is processing. Check email for status.");
          setLoading(false);
        }
      } else if (status === "succeeded") {
        await finalizeOrder(reference, receiptUrl);
      } else {
        setError("Payment is processing. Check email for status.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Place order error:", err.response?.data || err);
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
      } else if (err.response?.data?.type === "stock_error") {
        const errorItems = err.response.data.items || [];
        const itemList = errorItems.map((i: any) => `${i.title} (Available: ${i.available})`).join(", ");
        setError(`Some items are unavailable: ${itemList}`);
      } else {
        setError(err.response?.data?.message || "Payment failed. Please try again.");
      }
      setLoading(false);
    }
  };
  

  const finalizeOrder = async (reference: string, receipt: string | null) => {
    try {
      const successResponse = await axios.post(
        `${API_BASE_URL}/payments/success/${reference}`,
        { reference, receiptUrl: receipt || null },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      if (successResponse.data.success) {
        const { orderId, total, receiptUrl } = successResponse.data;

        clearCart();
        setPaymentData(null);
        setSuccessData({
          orderId: orderId || reference,
          total: total || subtotal + 5,
          receiptUrl: receiptUrl || null,
        });

        setTimeout(() => {
          navigate("/orders", {
            state: { orderId: orderId || reference, receiptUrl: receiptUrl || null }
          });
        }, 5000);
      } else {
        setError("Order failed. Please contact support.");
      }
    } catch (err: any) {
      setError("Failed to confirm order. Contact support.");
      console.error("Finalize error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData || !paymentData.shippingAddress) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-600">Loading payment details...</p>
        <button onClick={goToPreviousStep} className="mt-4 text-red-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-32 sm:pb-0">
      <h2 className="text-lg sm:text-2xl font-black text-gray-800 text-center mb-5 sm:mb-8">Review & Confirm</h2>

      <div className="space-y-4">
        {/* Delivery address card */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <MapPin size={15} className="text-blue-500" />
              </div>
              <h3 className="font-black text-sm text-gray-800">Deliver to</h3>
            </div>
            <button onClick={goToPreviousStep} className="text-xs font-bold text-[#c9a84c]">Change</button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm font-bold text-gray-800">{paymentData.shippingAddress.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {paymentData.shippingAddress.line1}, {paymentData.shippingAddress.city}, {paymentData.shippingAddress.postalCode}, {paymentData.shippingAddress.country}
            </p>
          </div>
        </div>

        {/* Payment method card */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <CreditCard size={15} className="text-purple-500" />
              </div>
              <h3 className="font-black text-sm text-gray-800">Payment</h3>
            </div>
            <button onClick={goToPreviousStep} className="text-xs font-bold text-[#c9a84c]">Change</button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600 font-medium">Card ending in {paymentData?.card?.last4 || "••••"}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Package size={15} className="text-amber-500" />
            </div>
            <h3 className="font-black text-sm text-gray-800">Items ({cartItems.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {cartItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <img
                  src={getDisplayImage(item)}
                  alt={item.title}
                  className="w-10 h-14 object-cover rounded-xl flex-shrink-0"
                  onError={(e) => { e.currentTarget.src = "https://placehold.co/300x450?text=Book+Cover"; e.currentTarget.onerror = null; }}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-black text-gray-800 flex-shrink-0">£{((typeof item.price === "string" ? Number(item.price.replace("£", "")) : Number(item.price)) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-3xl border border-gray-100 px-5 py-4 space-y-2.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span className="font-semibold text-gray-800">£{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Shipping</span>
            <span className={`font-semibold ${appliedCampaign?.isFreeShipping ? 'text-emerald-600' : 'text-gray-800'}`}>
              {appliedCampaign?.isFreeShipping ? 'FREE' : `£${shipping.toFixed(2)}`}
            </span>
          </div>
          {appliedCampaign && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span className="font-semibold flex items-center gap-1.5"><Check size={13} /> {appliedCampaign.title}</span>
              <span className="font-bold">-£{appliedCampaign.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-black text-gray-800">Total</span>
            <span className="font-black text-[#0a1628] text-lg">£{total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
        )}

        {/* CTA — visible inline on desktop, sticky on mobile */}
        <div className="hidden sm:block">
          <button
            onClick={handlePlaceOrder}
            className="w-full py-4 bg-[#c9a84c] text-black font-black rounded-2xl text-sm disabled:bg-gray-200 disabled:text-gray-400"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                Processing…
              </span>
            ) : "Place Order →"}
          </button>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-6"
        style={{ boxShadow: '0 -8px 30px rgba(10,22,40,0.10)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePlaceOrder}
          className="w-full py-4 bg-[#c9a84c] text-black font-black rounded-2xl text-sm flex items-center justify-between px-6 disabled:bg-gray-200 disabled:text-gray-400"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2 mx-auto">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
              Processing…
            </span>
          ) : (
            <>
              <span>Place Order</span>
              <span className="text-black font-black">£{total.toFixed(2)}</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

const CheckoutFlow = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { auth } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [appliedCampaign, setAppliedCampaign] = useState<AppliedCampaign | null>(null);
  const userId = auth.token ? (() => { try { return jwtDecode<{ userId: string }>(auth.token!).userId; } catch { return null; } })() : null;
  const [successData, setSuccessData] = useState<{
    orderId: string;
    total: number;
    receiptUrl: string | null;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans flex-col">
      <SEOHead title="Checkout" description="Complete your BritBooks order securely." canonical="/checkout" noindex={true} />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      <TopBar />

      <main className="flex-1 px-4 py-5 sm:p-8 pb-4 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <CheckoutStepper currentStep={step} />

          {step === 1 && (
            <ShoppingCartView
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              goToNextStep={() => setStep(2)}
              appliedCampaign={appliedCampaign}
              setAppliedCampaign={setAppliedCampaign}
              authToken={auth.token ?? null}
              userId={userId}
            />
          )}

          {step === 2 && (
            <Elements stripe={stripePromise}>
              <PaymentForm goToNextStep={() => setStep(3)} setPaymentData={setPaymentData} />
            </Elements>
          )}

          {step === 3 && paymentData ? (
            <ReviewOrder
              cartItems={cartItems}
              goToPreviousStep={() => setStep(2)}
              paymentData={paymentData}
              setPaymentData={setPaymentData}
              setSuccessData={setSuccessData}
              appliedCampaign={appliedCampaign}
            />
          ) : step === 3 && successData ? (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-4">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <Check size={36} className="text-emerald-600" strokeWidth={3} />
                </motion.div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Order Confirmed!</h2>
                <p className="text-gray-400 text-sm mb-6">Thank you for shopping with BritBooks.</p>
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Order ID</span>
                    <span className="font-black text-gray-800 text-xs">{successData.orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Total Paid</span>
                    <span className="font-black text-[#0a1628]">£{successData.total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/orders", { state: successData })}
                  className="w-full bg-[#c9a84c] text-black py-4 rounded-2xl font-black text-sm mb-3"
                >
                  View My Order
                </button>

                {/* Trustpilot review nudge */}
                <a
                  href="https://uk.trustpilot.com/review/britbooks.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-gray-200 rounded-2xl py-3 mb-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#00B67A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Share your experience on Trustpilot</span>
                </a>

                <p className="text-xs text-gray-400">Redirecting automatically in 5 seconds…</p>
              </motion.div>
            </div>
          ) : step === 3 ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0a1628] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Processing your order…</p>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutFlow;