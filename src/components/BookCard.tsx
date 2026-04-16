// components/BookCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "../context/cartContext";
import { useWishlist } from "../context/wishlistContext";

interface BookCardProps {
  id: string;
  img: string;
  title: string;
  author: string;
  price: string;
}

const BookCard: React.FC<BookCardProps> = ({ id, img, title, author, price }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(id);

  const handleAddToCart = () => {
    addToCart({ id, img, title, author, price, quantity: 1 });
    toast.success(`${title} added to your basket!`);
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist({ id, img, title, author, price });
    }
  };

  return (
    <>
      {/* ─── MOBILE CARD ─────────────────────────────── */}
      <div className="sm:hidden w-full flex flex-col">
        {/* Image block */}
        <Link to={`/browse/${id}`} className="block relative rounded-2xl overflow-hidden bg-gray-100"
          style={{ aspectRatio: '3/4' }}>
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null;
              t.src = `https://picsum.photos/seed/fallback-${id}/300/450`;
            }}
          />

          {/* Wishlist button — overlaid top-right */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWishlistToggle(); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: inWishlist ? '#c9a84c' : 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <Heart
              size={14}
              className={inWishlist ? 'text-black fill-black' : 'text-gray-500'}
            />
          </motion.button>
        </Link>

        {/* Info block — consistent height via fixed title height */}
        <div className="pt-2 px-0.5 flex flex-col">
          {/* Always 2-line slot — overflows get … */}
          <p
            className="text-[12px] font-bold text-gray-900 leading-tight flex-shrink-0"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.4em',
            }}
          >
            {title}
          </p>
          <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5 mb-2 flex-shrink-0">
            {author}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-black leading-none" style={{ color: '#0a1628' }}>{price}</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#c9a84c' }}
            >
              <ShoppingBag size={13} className="text-black" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP CARD ────────────────────────────── */}
      <div
        className="hidden sm:block relative group w-full text-center
        border border-gray-200 rounded-lg p-3
        transform transition-all duration-500
        hover:shadow-xl hover:-translate-y-1
        animate-zoomIn"
        style={{ maxWidth: '100%' }}
      >
        {/* ❤️ Wishlist */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md z-10
          hover:scale-110 transition-transform"
        >
          <Heart
            size={16}
            className={inWishlist ? "text-red-500 fill-red-500" : "text-gray-400"}
          />
        </button>

        <div className="relative overflow-hidden rounded">
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-60 object-cover mb-3 rounded
            transition-transform duration-500
            group-hover:scale-110"
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null;
              t.src = `https://picsum.photos/seed/fallback-${id}/300/450`;
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-x-0 top-0 h-60 bg-black bg-opacity-0
          group-hover:bg-opacity-20 transition-opacity duration-300
          flex items-center justify-center">
            <Link to={`/browse/${id}`}>
              <button className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold
              opacity-0 group-hover:opacity-100
              transform translate-y-6 group-hover:translate-y-0
              transition-all duration-300">
                QUICK VIEW
              </button>
            </Link>
          </div>
        </div>

        <h3 className="font-semibold text-sm truncate">{title}</h3>
        <p className="text-gray-500 text-xs mb-2">{author}</p>

        <div className="flex items-center justify-center text-yellow-400 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} fill="currentColor" />
          ))}
        </div>

        <p className="text-blue-600 font-bold mb-3">{price}</p>

        <button
          onClick={handleAddToCart}
          className="bg-red-400 text-white px-4 py-2 rounded-full hover:bg-red-500
          text-xs w-full transition-all duration-300 hover:scale-105"
        >
          ADD TO BASKET
        </button>
      </div>
    </>
  );
};

export default BookCard;
