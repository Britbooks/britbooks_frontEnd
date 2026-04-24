"use client";

import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ShoppingBag, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useWishlist } from "../context/wishlistContext";
import { useCart } from "../context/cartContext";
import BookCard from "../components/BookCard";
import toast from "react-hot-toast";
import SEOHead from '../components/SEOHead';

// ── Main component ────────────────────────────────────────────────────────────
const MyWishlistPage = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    addToCart({ id: item.id, img: item.img, title: item.title, author: item.author, price: item.price, quantity: 1 });
    toast.success(`${item.title} added to basket!`);
  };

  const handleAddAll = () => {
    wishlist.forEach((item) =>
      addToCart({ id: item.id, img: item.img, title: item.title, author: item.author, price: item.price, quantity: 1 })
    );
    toast.success(`${wishlist.length} books added to basket!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] font-sans">
      <SEOHead title="My Wishlist" description="View your saved books on BritBooks." canonical="/wishlist" noindex={true} />
      <TopBar />

      {/* ── MOBILE LAYOUT ─────────────────────────────────────────── */}
      <div className="sm:hidden flex-1 flex flex-col pb-28">

        {/* Mobile header */}
        <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <Heart size={16} className="text-red-500 fill-red-500" />
              </div>
              <h1 className="text-lg font-black text-gray-900">My Wishlist</h1>
            </div>
            {wishlist.length > 0 && (
              <span className="bg-[#c9a84c] text-black text-xs font-black px-2.5 py-1 rounded-full">
                {wishlist.length} {wishlist.length === 1 ? "book" : "books"}
              </span>
            )}
          </div>
          {wishlist.length > 0 && (
            <p className="text-xs text-gray-400 font-medium mt-1.5">
              Tap <Heart size={10} className="inline text-red-400 fill-red-400" /> to remove · Tap <ShoppingBag size={10} className="inline text-[#c9a84c]" /> to add to basket
            </p>
          )}
        </div>

        {/* Empty state */}
        {wishlist.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center py-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mb-6"
            >
              <Heart size={40} className="text-red-300" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Nothing saved yet</h2>
            <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">
              Tap the heart on any book to save it here for later.
            </p>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 bg-[#c9a84c] text-black font-black px-8 py-3.5 rounded-2xl text-sm"
              >
                <BookOpen size={16} />
                Explore Books
              </Link>
            </motion.div>
          </div>
        ) : (
          <>
            {/* 2-column grid */}
            <div className="px-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {wishlist.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                      className="flex flex-col"
                    >
                      <BookCard
                        id={item.id}
                        img={item.img}
                        title={item.title}
                        author={item.author}
                        price={item.price}
                      />
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-red-400 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Clear all link */}
            <div className="px-4 mt-6 text-center">
              <button
                onClick={() => wishlist.forEach((i) => removeFromWishlist(i.id))}
                className="text-xs text-gray-400 font-bold uppercase tracking-widest"
              >
                Clear Wishlist
              </button>
            </div>
          </>
        )}

        {/* Sticky bottom CTA */}
        {wishlist.length > 0 && (
          <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6"
            style={{ boxShadow: "0 -8px 30px rgba(10,22,40,0.08)" }}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-gray-400 font-semibold">{wishlist.length} saved books</span>
              <Link to="/checkout" className="text-xs font-bold text-[#c9a84c]">
                View Basket →
              </Link>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddAll}
              className="w-full py-4 bg-[#c9a84c] text-black font-black rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Add All to Basket
            </motion.button>
          </div>
        )}
      </div>

      {/* ── DESKTOP LAYOUT ────────────────────────────────────────── */}
      <main className="hidden sm:block flex-1 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
                Curated Collection
              </h1>
              <p className="text-slate-500 mt-2 italic">Your personal library in waiting.</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              {wishlist.length > 0 && (
                <button
                  onClick={handleAddAll}
                  className="flex items-center gap-2 bg-[#c9a84c] text-black font-bold px-5 py-2.5 rounded-full text-sm hover:bg-amber-400 transition-colors"
                >
                  <ShoppingBag size={15} /> Add All to Basket
                </button>
              )}
              <span className="text-sm font-medium text-slate-400">
                {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>

          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Heart className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Your wishlist is resting</h3>
              <p className="text-slate-500 mt-2 max-w-xs text-center">
                Whenever you find a story that speaks to you, save it here to find it again.
              </p>
              <Link
                to="/browse"
                className="group mt-8 inline-flex items-center gap-2 bg-[#c9a84c] text-black py-3 px-8 rounded-full font-medium transition-all hover:bg-amber-400 hover:shadow-lg active:scale-95"
              >
                Explore Library
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
              {wishlist.map((item) => (
                <div key={item.id} className="group relative flex flex-col">
                  <BookCard
                    id={item.id}
                    img={item.img}
                    title={item.title}
                    author={item.author}
                    price={item.price}
                  />
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-slate-400 border border-slate-100 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove from list
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyWishlistPage;
