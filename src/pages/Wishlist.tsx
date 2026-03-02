"use client";

import React, { useEffect } from "react";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { useWishlist } from "../context/wishlistContext";
import BookCard from "../components/BookCard";

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center">
        My Wishlist
      </h2>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 sm:py-24 animate-on-scroll">
          <p className="text-lg sm:text-xl text-gray-600">Your wishlist is empty.</p>
          <p className="text-base sm:text-lg text-gray-500 mt-2">
            Add books to your wishlist to keep track of titles you love!
          </p>
          <a
            href="/books"
            className="inline-block mt-6 bg-red-600 text-white py-3 px-6 rounded-md font-semibold text-base sm:text-lg hover:bg-red-700 transition-colors"
          >
            Browse Books
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 animate-on-scroll">
          {wishlist.map((item) => (
            <BookCard
              key={item.id}
              id={item.id}
              img={item.img}
              title={item.title}
              author={item.author}
              price={item.price}
            >
              {/* Custom action buttons for wishlist page */}
              <div className="flex justify-between mt-2">
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="flex items-center text-sm sm:text-base text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </BookCard>
          ))}
        </div>
      )}
    </div>
  );
};

const MyWishlistPage = () => {
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
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <TopBar />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto pb-16">
        <Wishlist />
      </main>

      <Footer />
    </div>
  );
};

export default MyWishlistPage;