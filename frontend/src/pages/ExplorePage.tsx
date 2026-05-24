"use client";

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/footer';
import { Menu, X } from 'lucide-react';
import SEOHead from '../components/SEOHead';

// --- ICONS ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const ShoppingCartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// Mobile Menu Icons
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


// --- MOCK DATA ---
const allBooks = [
  {
    id: 1,
    title: 'The Midnight Library',
    author: 'Matt Haig',
    price: 14.99,
    rating: 5,
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrlxe14gdf9GY9IIAhaQ4S2O-U-u8afql_BQ&s',
    category: 'Fiction',
    synopsis: 'Somewhere out beyond the edge of the universe is a library that contains an infinite number of books, each one the story of another reality. Nora Seed finds herself in The Midnight Library, faced with the chance to undo her regrets and explore lives she could have lived.',
    publicationDate: '2020-08-13',
    pageCount: 304,
    reviews: [
      { user: 'Jane D.', rating: 5, comment: 'A heartwarming and thought-provoking read!' },
      { user: 'Tom R.', rating: 4, comment: 'Beautifully written, though a bit slow at times.' },
    ],
  },
  {
    id: 2,
    title: 'Atomic Habits',
    author: 'James Clear',
    price: 18.50,
    rating: 5,
    imageUrl: 'https://target.scene7.com/is/image/Target/GUEST_0035cc74-7206-485d-aa04-83b3b7cf8db7?wid=800&hei=800&qlt=80&fmt=webp',
    category: 'Non-Fiction',
    synopsis: 'Discover how small changes can lead to remarkable results. James Clear’s proven framework for building good habits and breaking bad ones will transform the way you approach personal growth and productivity.',
    publicationDate: '2018-10-16',
    pageCount: 320,
    reviews: [
      { user: 'Sarah K.', rating: 5, comment: 'Life-changing advice, easy to apply!' },
      { user: 'Mike L.', rating: 5, comment: 'A must-read for anyone seeking self-improvement.' },
    ],
  },
  {
    id: 3,
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    price: 22.00,
    rating: 4,
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPFqlHR1RrGJqeKnEzk730HXxCH00dfP4VyQ&s',
    category: 'Sci-Fi',
    synopsis: 'A former school teacher wakes up alone on a spaceship with no memory. As he pieces together his mission to save Earth from solar dimming, he faces impossible odds in a race against time.',
    publicationDate: '2021-05-04',
    pageCount: 496,
    reviews: [
      { user: 'Alex P.', rating: 4, comment: 'Thrilling and witty, a sci-fi gem!' },
      { user: 'Emma W.', rating: 3, comment: 'Great story, but the science was heavy.' },
    ],
  },
  {
    id: 4,
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    price: 16.75,
    rating: 4,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1603206535i/54120408.jpg',
    category: 'Fiction',
    synopsis: 'From her place in the store, Klara, an Artificial Friend, observes the world, waiting to be chosen. Her story explores love, hope, and what it means to be human in a tech-driven future.',
    publicationDate: '2021-03-02',
    pageCount: 320,
    reviews: [
      { user: 'Clara T.', rating: 4, comment: 'Poignant and beautifully crafted.' },
      { user: 'Liam S.', rating: 4, comment: 'A slow burn with deep emotional impact.' },
    ],
  },
  {
    id: 5,
    title: 'The Four Winds',
    author: 'Kristin Hannah',
    price: 15.25,
    rating: 5,
    imageUrl: 'https://m.media-amazon.com/images/I/81BvTRnoBoL._UF894,1000_QL80_.jpg',
    category: 'Historical',
    synopsis: 'Set during the Great Depression, this epic tale follows Elsa Martinelli’s fight for survival and hope as she makes heart-wrenching choices to protect her family in a time of crisis.',
    publicationDate: '2021-02-02',
    pageCount: 464,
    reviews: [
      { user: 'Grace M.', rating: 5, comment: 'An emotional rollercoaster, loved it!' },
      { user: 'Noah B.', rating: 4, comment: 'Powerful, but some parts felt drawn out.' },
    ],
  },
  {
    id: 6,
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    price: 20.00,
    rating: 5,
    imageUrl: 'https://www.ynharari.com/wp-content/uploads/2017/01/sapiens.png',
    category: 'Non-Fiction',
    synopsis: 'Explore the history of our species, from the Stone Age to the modern era. Harari’s groundbreaking narrative reveals how biology and history have shaped who we are today.',
    publicationDate: '2011-09-04',
    pageCount: 512,
    reviews: [
      { user: 'Olivia H.', rating: 5, comment: 'Mind-blowing insights into humanity!' },
      { user: 'Ethan J.', rating: 4, comment: 'Fascinating, but dense in parts.' },
    ],
  },
  {
    id: 7,
    title: 'Dune',
    author: 'Frank Herbert',
    price: 12.99,
    rating: 5,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
    category: 'Sci-Fi',
    synopsis: 'Follow young Paul Atreides on the desert planet Arrakis, where a powerful substance called spice fuels a mythic journey of betrayal, destiny, and epic adventure.',
    publicationDate: '1965-08-01',
    pageCount: 688,
    reviews: [
      { user: 'Sophie L.', rating: 5, comment: 'A sci-fi masterpiece, timeless!' },
      { user: 'Jacob M.', rating: 5, comment: 'Complex and utterly gripping.' },
    ],
  },
  {
    id: 8,
    title: 'Educated: A Memoir',
    author: 'Tara Westover',
    price: 17.99,
    rating: 4,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1506026635i/35133922.jpg',
    category: 'Biography',
    synopsis: 'Tara Westover’s journey from a survivalist family in Idaho to earning a PhD from Cambridge is a powerful testament to the transformative power of education.',
    publicationDate: '2018-02-20',
    pageCount: 352,
    reviews: [
      { user: 'Ava C.', rating: 4, comment: 'Inspiring and raw, a must-read.' },
      { user: 'Lucas D.', rating: 4, comment: 'Captivating, though emotionally heavy.' },
    ],
  },
  {
    id: 9,
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    price: 13.50,
    rating: 4,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1668782119i/40097951.jpg',
    category: 'Thriller',
    synopsis: 'Alicia Berenson, a painter, shoots her husband and then stops speaking. A psychotherapist unravels her silence in this gripping psychological thriller.',
    publicationDate: '2019-02-05',
    pageCount: 336,
    reviews: [
      { user: 'Mia F.', rating: 4, comment: 'Twist after twist, couldn’t put it down!' },
      { user: 'Henry G.', rating: 3, comment: 'Great plot, but the ending felt rushed.' },
    ],
  },
  {
    id: 10,
    title: 'Circe',
    author: 'Madeline Miller',
    price: 16.20,
    rating: 5,
    imageUrl: 'https://bloximages.newyork1.vip.townnews.com/dailynebraskan.com/content/tncms/assets/v3/editorial/1/70/170af38a-c06a-11e8-8fb7-afa41aa0b97c/5ba99c69a23bd.image.jpg',
    category: 'Fiction',
    synopsis: 'Circe, a goddess with a mortal’s voice, discovers her power in a world of gods and men. A bold reimagining of the Odyssey’s enigmatic witch.',
    publicationDate: '2018-04-10',
    pageCount: 400,
    reviews: [
      { user: 'Isabella R.', rating: 5, comment: 'Mythology brought to life, stunning!' },
      { user: 'Mason T.', rating: 4, comment: 'Lyrical and immersive storytelling.' },
    ],
  },
  {
    id: 11,
    title: 'Becoming',
    author: 'Michelle Obama',
    price: 21.99,
    rating: 5,
    imageUrl: 'https://m.media-amazon.com/images/I/81KGjsBXQ7L.jpg',
    category: 'Biography',
    synopsis: 'Michelle Obama shares her journey from Chicago’s South Side to the White House, offering an intimate look at her life, family, and legacy.',
    publicationDate: '2018-11-13',
    pageCount: 448,
    reviews: [
      { user: 'Charlotte E.', rating: 5, comment: 'Inspiring and deeply personal.' },
      { user: 'William P.', rating: 5, comment: 'A powerful and relatable memoir.' },
    ],
  },
  {
    id: 12,
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    price: 14.00,
    rating: 4,
    imageUrl: 'https://bookvilleworld.com/wp-content/uploads/2024/04/WHERE-THE-CRAWDADS-SING.jpg',
    category: 'Fiction',
    synopsis: 'Kya Clark, the "Marsh Girl," lives a solitary life in the North Carolina marshes. A tale of love, loss, and survival unfolds when a murder mystery grips her town.',
    publicationDate: '2018-08-14',
    pageCount: 384,
    reviews: [
      { user: 'Amelia N.', rating: 4, comment: 'Beautifully written, a touching story.' },
      { user: 'Elijah K.', rating: 4, comment: 'Great, but the pacing slowed at times.' },
    ],
  },
];

const categories = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Thriller', 'Biography', 'Historical'];
const ratings = [5, 4, 3, 2, 1];

// --- COMPONENTS ---
const StarRating = ({ rating, setRating, interactive = false }: { rating: number; setRating?: (rating: number) => void; interactive?: boolean }) => (
  <div className={`flex items-center ${interactive ? 'cursor-pointer' : ''}`}>
    {ratings.map((star) => (
      <StarIcon
        key={star}
        className={`h-5 w-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} ${interactive ? 'hover:text-yellow-400' : ''}`}
        onClick={() => interactive && setRating && setRating(star)}
      />
    ))}
  </div>
);

const BookCard = ({ book, onClick }: { book: typeof allBooks[0]; onClick: () => void }) => (
  <div
    className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
    onClick={onClick}
  >
    <img
      src={book.imageUrl}
      alt={book.title}
      className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex flex-col justify-end p-4">
      <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white text-lg font-bold">{book.title}</h3>
        <p className="text-gray-300 text-sm mb-2">{book.author}</p>
        <p className="text-gray-300 text-xs mb-4 line-clamp-3">{book.synopsis}</p>
        <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent group-hover:opacity-0 transition-opacity duration-300">
      <h3 className="text-white font-bold">{book.title}</h3>
      <p className="text-gray-200 text-sm">by {book.author}</p>
      <div className="flex justify-between items-center mt-2">
        <p className="text-white font-bold text-lg">£{book.price.toFixed(2)}</p>
        <StarRating rating={book.rating} />
      </div>
    </div>
  </div>
);

const BookDetailsModal = ({ book, onClose }: { book: typeof allBooks[0] | null; onClose: () => void }) => {
  if (!book) return null;

  const handleAddToCart = () => {
    toast.error('Please log in to add items to your cart!', {
      icon: '🚫',
      style: {
        background: '#ffffff',
        color: '#333',
        fontFamily: 'Georgia, serif',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      duration: 3000,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Desktop and tablet: show from md up */}
      <div className="hidden md:flex bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <img src={book.imageUrl} alt={book.title} className="w-full md:w-1/3 h-96 object-cover rounded-md" />
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{book.title}</h2>
            <p className="text-lg text-gray-600 mb-4">by {book.author}</p>
            <StarRating rating={book.rating} />
            <p className="text-2xl font-bold text-red-600 mt-2">£{book.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">Category: {book.category}</p>
            <p className="text-sm text-gray-500">Published: {new Date(book.publicationDate).toLocaleDateString('en-GB')}</p>
            <p className="text-sm text-gray-500 mb-4">Pages: {book.pageCount}</p>
            <h3 className="text-xl font-semibold mb-2">About the Book</h3>
            <p className="text-gray-700 mb-6">{book.synopsis}</p>
            <h3 className="text-xl font-semibold mb-2">Reader Reviews</h3>
            {book.reviews.map((review, index) => (
              <div key={index} className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{review.user}</p>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-gray-600 text-sm">{review.comment}</p>
              </div>
            ))}
            <div className="flex space-x-4 mt-6">
              <button
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: show only below md */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-3">
  <div className="flex flex-col bg-white rounded-lg w-full max-w-xs max-h-[80vh] shadow-lg">
    {/* Scrollable content */}
    <div className="flex-grow overflow-y-auto p-4">
      <img
        src={book.imageUrl}
        alt={book.title}
        className="w-full h-40 object-cover rounded-md mb-4 shadow-sm"
      />
      <h2 className="text-xl font-bold text-gray-900 mb-1 leading-snug truncate">{book.title}</h2>
      <p className="text-sm text-gray-600 mb-2 italic truncate">by {book.author}</p>
      <StarRating rating={book.rating} />
      <p className="text-lg font-semibold text-red-600 mt-2 mb-3 tracking-wide">£{book.price.toFixed(2)}</p>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{book.category}</span>
        <span>Published: {new Date(book.publicationDate).toLocaleDateString('en-GB')}</span>
        <span>Pages: {book.pageCount}</span>
      </div>

      <h3 className="text-sm font-semibold mb-2 border-b border-gray-200 pb-1">About the Book</h3>
      <p className="text-gray-700 mb-4 leading-relaxed text-sm">{book.synopsis}</p>

      <h3 className="text-sm font-semibold mb-2 border-b border-gray-200 pb-1">Reader Reviews</h3>
      <div className="space-y-3 text-xs text-gray-700">
        {book.reviews.map((review, i) => (
          <div key={i} className="border-t pt-2">
            <div className="flex justify-between items-center mb-1">
              <p className="font-semibold truncate">{review.user}</p>
              <StarRating rating={review.rating} />
            </div>
            <p className="leading-snug truncate">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Buttons */}
    <div className="p-4 border-t border-gray-200 flex space-x-3">
      <button
        className="flex-1 bg-red-600 text-white py-3 rounded-md font-semibold hover:bg-red-700 transition-colors"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
      <button
        className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
        onClick={onClose}
      >
        Cancel
      </button>
    </div>
  </div>
</div>





    </div>
  );
};


const FilterSidebar = ({ filters, setFilters }: { filters: any; setFilters: (filters: any) => void }) => {
  const handleCategoryChange = (category: string) => {
    setFilters({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c: string) => c !== category)
        : [...filters.categories, category],
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'min' | 'max') => {
    setFilters({ ...filters, price: { ...filters.price, [field]: e.target.value } });
  };

  const resetFilters = () => {
    setFilters({ categories: [], price: { min: '', max: '' }, rating: 0 });
  };

  return (
    <aside className="w-full lg:w-64 xl:w-72 sticky top-0 self-start space-y-6 p-4 lg:p-6 bg-white border-r lg:border-r-0">
      <h2 className="text-2xl font-bold">Filters</h2>
      <div>
        <h3 className="font-semibold mb-2">Category</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Price Range</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.price.min}
            onChange={(e) => handlePriceChange(e, 'min')}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.price.max}
            onChange={(e) => handlePriceChange(e, 'max')}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Rating</h3>
        <StarRating rating={filters.rating} setRating={(r) => setFilters({ ...filters, rating: r })} interactive={true} />
      </div>
      <div className="flex flex-col space-y-2 pt-4">
        <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
          Apply Filters
        </button>
        <button
          onClick={resetFilters}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};

// --- MAIN EXPLORE PAGE COMPONENT ---
const ExplorePage = () => {
  const [filters, setFilters] = useState<{ categories: string[]; price: { min: string; max: string }; rating: number }>({ categories: [], price: { min: '', max: '' }, rating: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<typeof allBooks[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu
  const [isFilterOpen, setIsFilterOpen] = useState(false); // State for mobile filters
  const booksPerPage = 12;

  const filteredBooks = useMemo(() => {
    return allBooks.filter(book => {
      const searchMatch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = filters.categories.length === 0 || filters.categories.includes(book.category);
      const minPrice = parseFloat(filters.price.min);
      const maxPrice = parseFloat(filters.price.max);
      const priceMatch = (isNaN(minPrice) || book.price >= minPrice) && (isNaN(maxPrice) || book.price <= maxPrice);
      const ratingMatch = book.rating >= filters.rating;
      return searchMatch && categoryMatch && priceMatch && ratingMatch;
    });
  }, [searchTerm, filters]);

  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * booksPerPage;
    return filteredBooks.slice(startIndex, startIndex + booksPerPage);
  }, [filteredBooks, currentPage]);

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  const handleSortChange = (sortOption: string) => {
    // Sorting logic handled in filteredBooks for simplicity
  };
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white font-sans">
      <SEOHead
        title="Explore Books"
        description="Browse and search thousands of books across all genres at BritBooks. Find your next read from our huge selection of second-hand and new books."
        canonical="/explore"
      />
      <Toaster position="top-right" />
      <style>{`
        .book-image-hover { transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; }
        .book-image-hover:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>

<header className="h-auto sm:h-20 px-4 sm:px-8 border-b sticky top-0 bg-white z-20 flex items-center">
  <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 py-4 sm:py-0 relative w-full">
    
    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
      <div className="flex justify-between w-full sm:w-auto items-center">
        <Link to="/">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-red-600 text-white font-bold text-2xl w-12 h-12 flex items-center justify-center rounded-md">B</div>
            <span className="text-2xl sm:text-3xl font-bold">BritBooks</span>
          </div>
        </Link>

        {/* Hamburger button - only on mobile */}
        <button
          className="sm:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="relative w-full sm:w-64">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search books, authors, or genres..."
          className="pl-10 pr-4 py-2 border rounded-full w-full"
        />
      </div>
    </div>

    {/* DESKTOP NAV */}
    <div className="hidden sm:flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
      <Link to="/explore" className="text-gray-600 header-btn text-center sm:text-left">Explore</Link>
      <Link to="/login" className="text-gray-600 header-btn text-center sm:text-left">Login</Link>
      <Link to="/signup" className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold btn-hover-effect text-center sm:text-left w-full sm:w-auto">Sign Up</Link>
    </div>
  </div>

  {/* MOBILE MENU */}
  {menuOpen && (
    <div className="sm:hidden w-full border-t">
      <div className="flex flex-col space-y-2 py-4">
        <Link to="/explore" className="text-gray-600 text-center" onClick={() => setMenuOpen(false)}>Explore</Link>
        <Link to="/login" className="text-gray-600 text-center" onClick={() => setMenuOpen(false)}>Login</Link>
        <Link to="/signup" className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold text-center w-full" onClick={() => setMenuOpen(false)}>Sign Up</Link>
      </div>
    </div>
  )}
</header>


      {/* Mobile Navigation Menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} absolute top-20 left-0 w-full bg-white z-10 shadow-lg`}>
        <div className="flex flex-col items-center space-y-4 p-4">
          <Link to="/explore" className="text-gray-600 header-btn w-full text-center py-2">Explore</Link>
          <Link to="/login" className="text-gray-600 header-btn w-full text-center py-2">Login</Link>
          <Link to="/signup" className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold btn-hover-effect w-full text-center">Sign Up</Link>
        </div>
      </div>


      <main className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full bg-gray-800 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>{isFilterOpen ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>

          {/* Sidebar */}
          <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block`}>
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-center sm:text-left">Showing {filteredBooks.length} results</h2>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Sort by:</span>
                <select
                  className="p-2 border rounded-md focus:ring-2 focus:ring-red-500"
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="rating-high-low">Highest Rating</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {paginatedBooks.map(book => (
                <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <nav className="flex items-center space-x-1 sm:space-x-2">
                <button
                  className="px-3 sm:px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`px-3 sm:px-4 py-2 rounded-md ${currentPage === i + 1 ? 'bg-red-600 text-white' : 'hover:bg-gray-200'}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 sm:px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </main>

      <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} />

      <Footer />
    </div>
  );
};

export default ExplorePage;