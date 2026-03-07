"use client";

import React from "react";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useWishlist } from "../context/wishlistContext";
import BookCard from "../components/BookCard";
import { Heart, ArrowRight, Trash2 } from "lucide-react"; // Assuming lucide-react for icons

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            Curated Collection
          </h1>
          <p className="text-slate-500 mt-2 italic">Your personal library in waiting.</p>
        </div>
        <div className="mt-4 md:mt-0 text-sm font-medium text-slate-400">
          {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Heart className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Your wishlist is resting</h3>
          <p className="text-slate-500 mt-2 max-w-xs text-center">
            Whenever you find a story that speaks to you, save it here to find it again.
          </p>
          <a
            href="/books"
            className="group mt-8 inline-flex items-center gap-2 bg-slate-900 text-white py-3 px-8 rounded-full font-medium transition-all hover:bg-red-600 hover:shadow-lg active:scale-95"
          >
            Explore Library
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {wishlist.map((item) => (
            <div key={item.id} className="group relative flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
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
  );
};

const MyWishlistPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] font-sans selection:bg-red-100 selection:text-red-900">
      <TopBar />

      <main className="flex-1 py-12 sm:py-20">
        <Wishlist />
      </main>

      <Footer />
    </div>
  );
};

export default MyWishlistPage;