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
  ShoppingCart,
} from "lucide-react";
import { MD5 } from "crypto-js";
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
import { Book, fetchBooks } from "../data/books";
import ReactDOM from "react-dom";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API_BASE_URL = "https://britbooks-api-production.up.railway.app/api";

// --- Helper Function for Placeholder Images ---
const generatePlaceholderImage = (book: { title: string; isbn: string; genre: string }): string => {
  const input = book.isbn || book.title;
  const hash = MD5(input).toString().slice(0, 8);
  const genreColors: Record<string, string> = {
    Mindfulness: "zen",
    Technology: "tech",
    Psychology: "psych",
    "Self-Help": "selfhelp",
    Mystery: "mystery",
    "Contemporary Fiction": "fiction",
    Drama: "drama",
    Biography: "bio",
    Leadership: "lead",
    "Asian Literature": "asianlit",
    Entrepreneurship: "entrepreneur",
    Poetry: "poetry",
    Humor: "humor",
    History: "history",
    Cookbooks: "cook",
    Art: "art",
    Comics: "comics",
    default: "default",
  };
  const genreKey = genreColors[book.genre] || genreColors.default;
  return `https://picsum.photos/seed/${hash}-${genreKey}/300/450`;
};

// --- SVG Star Icon ---
const StarIcon = ({ filled, rating }: { filled: boolean; rating: number }) => (
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

// --- Book Card Component ---
const BookCard = ({ id, imageUrl, title, author, price, rating, isbn, genre }: Book & { price: string }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const numericPrice = typeof price === "string" ? parseFloat(price.replace("£", "")) : price;

  const fallbackImage = "https://placehold.co/300x450?text=Book+Cover";
  const displayImage = imageError
    ? fallbackImage
    : imageUrl || generatePlaceholderImage({ title, isbn, genre });

  const handleAddToCart = () => {
    addToCart({
      id,
      imageUrl: displayImage,
      title,
      author,
      price: `£${numericPrice.toFixed(2)}`,
      quantity: 1,
    });
    toast.success(`${title} added to your basket!`);
  };

  return (
    <div className="group relative flex-shrink-0 w-[180px] text-left p-2">
      <div className="relative">
        <Link to={`/browse/${id}`}>
          <img
            src={displayImage}
            alt={title}
            className="w-full h-48 object-cover mb-2 rounded-md transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </Link>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <Link to={`/browse/${id}`}>
            <button className="bg-white text-gray-900 px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-4 transition-all duration-300 hover:bg-gray-200">
              QUICK VIEW
            </button>
          </Link>
        </div>
      </div>
      <div className="p-2 flex flex-col items-start">
        <h3 className="font-semibold text-sm truncate mt-1">{title}</h3>
        <p className="text-gray-500 text-xs mb-1">{author}</p>
        <div className="flex items-center text-gray-300 mb-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < Math.round(rating || 0)} rating={rating || 0} />
          ))}
        </div>
        <p className="text-lg font-bold text-gray-900">£{numericPrice.toFixed(2)}</p>
        <button
          onClick={handleAddToCart}
          className="bg-red-600 text-white font-medium px-3 py-1 rounded-md text-xs w-full transition-colors hover:bg-red-700 mt-2"
        >
          ADD TO BASKET
        </button>
      </div>
    </div>
  );
};

// --- BookShelf Component ---
const BookShelf = ({ title, fetchParams, currentBookId }: { title: string; fetchParams: any; currentBookId: string }) => {
  const [books, setBooks] = useState<Book[]>([]);
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
        const { books: fetchedBooks } = await fetchBooks({
          page: 1,
          limit: 10,
          ...fetchParams,
        });
        const filteredBooks = fetchedBooks.filter((book) => book.id !== currentBookId);
        setBooks(filteredBooks);
        setIsLoading(false);
      } catch (err) {
        setError(`Failed to load ${title.toLowerCase()}. Please try again.`);
        setIsLoading(false);
        console.error(`Failed to fetch ${title}:`, err instanceof Error ? err.message : err);
      }
    };
    fetchShelfBooks();
  }, [fetchParams, title, currentBookId]);

  const totalPages = Math.min(Math.ceil(books.length / booksPerPage), maxPages);
  const startIndex = (currentPage - 1) * booksPerPage;
  const paginatedBooks = books.slice(startIndex, startIndex + booksPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

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
            key={book.id}
            {...book}
            price={`£${book.price.toFixed(2)}`}
          />
        ))}
      </div>
      {paginatedBooks.length === 0 && (
        <p className="text-center text-gray-500 py-4">No {title.toLowerCase()} available.</p>
      )}
    </section>
  );
};

// --- Checkout Stepper Component ---
const CheckoutStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Shopping Cart", "Checkout", "Order Complete"];
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 sm:mb-12 animate-on-scroll">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold transition-all duration-300 ${
                    isActive ? "bg-red-600 text-white shadow-lg" : isCompleted ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check size={20} /> : stepNumber}
                </div>
                <p className={`mt-2 text-xs sm:text-sm font-semibold ${isActive || isCompleted ? "text-gray-800" : "text-gray-400"}`}>
                  {step}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 sm:mx-4 ${isCompleted ? "bg-yellow-400" : "bg-gray-200"}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// --- Shopping Cart View Component ---
const ShoppingCartView = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  goToNextStep,
}: {
  cartItems: any[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  goToNextStep: () => void;
}) => {
  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price.replace("£", "")) * item.quantity, 0);
  const shipping = 5.0;
  const total = subtotal + shipping;

  // Move image error state OUTSIDE the map
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const getDisplayImage = (item: any) => {
    if (imageErrors[item.id]) {
      return "https://placehold.co/300x450?text=Book+Cover";
    }
    return item.imageUrl || generatePlaceholderImage({ title: item.title, isbn: item.isbn || "", genre: item.genre || "default" });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Your Cart</h2>

          {cartItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg mb-4">Your cart is empty.</p>
              <Link to="/category" className="text-red-600 font-semibold hover:underline">
                Continue Shopping
              </Link>
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
                            <img
                              src={getDisplayImage(item)}
                              alt={item.title}
                              className="w-20 h-28 object-cover rounded shadow-sm"
                              onError={() => handleImageError(item.id)}
                              loading="lazy"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              <p className="text-sm text-gray-500">{item.author}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{item.price}</td>
                        <td className="p-4">
                          <div className="flex items-center border rounded-lg w-fit">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="px-3 py-1 hover:bg-gray-100"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="px-4 py-1 border-x">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-4 font-bold">
                          £{(parseFloat(item.price.replace("£", "")) * item.quantity).toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                            title="Remove item"
                          >
                            <X size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/category"
                  className="px-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition text-center"
                >
                  CONTINUE SHOPPING
                </Link>
                <button
                  onClick={clearCart}
                  className="px-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  CLEAR CART
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md border sticky top-24">
            <h3 className="text-xl font-bold mb-5">Order Summary</h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium">£{shipping.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL</span>
                  <span className="text-red-600">£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={goToNextStep}
              disabled={cartItems.length === 0}
              className="w-full mt-6 py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {cartItems.length > 0 && (
        <div className="mt-16">
          <BookShelf
            title="You may also like"
            fetchParams={{
              filters: { genre: cartItems[0].genre || "Fiction" },
              sort: "rating",
              order: "desc",
            }}
            currentBookId={cartItems[0].id}
          />
        </div>
      )}
    </>
  );
};

// --- Payment Form Component ---
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
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    line1: "",
    city: "",
    phoneNumber: "",
    postalCode: "",
    country: "GB",
  });

  const userId = auth.token ? jwtDecode<{ userId: string }>(auth.token).userId : null;

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
        const defaultAddress = response.data.addresses.find((addr) => addr.isDefault);
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

  const handleSelectAddress = (address) => {
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
      const { token, error: stripeError } = await stripe.createToken(cardElement);

      if (stripeError) {
        setError(stripeError.message);
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

  return (
    <div className="max-w-2xl mx-auto animate-on-scroll">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-6 sm:mb-8">Payment Information</h2>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="mb-4 sm:mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("credit-card")}
              className={`py-2 px-3 sm:px-4 font-semibold text-sm sm:text-base ${
                activeTab === "credit-card" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500 hover:text-red-600"
              }`}
            >
              <CreditCard className="inline-block mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Credit/Debit Card
            </button>
            <button
              onClick={() => setActiveTab("paypal")}
              className={`py-2 px-3 sm:px-4 font-semibold text-sm sm:text-base ${
                activeTab === "paypal" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500 hover:text-red-600"
              }`}
            >
              PayPal
            </button>
          </div>
        </div>
        {activeTab === "credit-card" && (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Shipping Address</h3>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={useSavedAddress}
                  onChange={() => setUseSavedAddress(!useSavedAddress)}
                  className="form-checkbox text-red-600"
                />
                <span className="ml-2 text-sm sm:text-base text-gray-600">Use saved address</span>
              </div>
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
                <div className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={shippingAddress.line1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={shippingAddress.phoneNumber}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value })}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Card Details</label>
              <CardElement
                className="w-full mt-1 p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#32325d",
                      "::placeholder": { color: "#a0aec0" },
                    },
                    invalid: { color: "#e53e3e" },
                  },
                }}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex items-center text-xs sm:text-sm text-gray-500">
              <Lock className="mr-2 w-4 h-4" /> Secure Payment
            </div>
            <button
              type="submit"
              className="w-full mt-4 sm:mt-6 bg-red-600 text-white py-2 sm:py-3 rounded-md font-semibold text-sm sm:text-base hover:bg-red-700 transition-colors"
              disabled={loading || !stripe || !shippingAddress.name}
            >
              {loading ? "Processing..." : "CONTINUE TO REVIEW"}
            </button>
          </form>
        )}
        {activeTab === "paypal" && (
          <div className="text-center py-6 sm:py-8">
            <p className="mb-4 text-sm sm:text-base text-gray-700">You will be redirected to PayPal to complete your payment.</p>
            <button className="bg-blue-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-md text-sm sm:text-base hover:bg-blue-700 transition-colors">
              PAY WITH PAYPAL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Review Order Component ---
const ReviewOrder = ({
  cartItems,
  goToPreviousStep,
  paymentData,
  setPaymentData,
  setOrderId,
  setReceiptUrl,
  setSuccessData,
}: {
  cartItems: any[];
  goToPreviousStep: () => void;
  paymentData: any;
  setPaymentData: (data: any) => void;
  setOrderId: (id: string | null) => void;
  setReceiptUrl: (url: string | null) => void;
}) => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price.replace("£", "")) * item.quantity, 0);
  const shipping = 5.0;
  const total = subtotal + shipping;

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

  const handlePlaceOrder = async () => {
    if (!auth.token) {
      setError("Please log in to place an order.");
      navigate("/login");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const decoded = jwtDecode<{ userId: string }>(auth.token);
      const userId = decoded.userId;
      const newOrderId = `ORDER_${Date.now()}`;
      const items = cartItems.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price.replace("£", "")),
      }));

      const response = await axios.post(
        `${API_BASE_URL}/payments/create-payment`,
        {
          userId,
          email: auth.user.email,
          orderId: newOrderId,
          shippingAddress: paymentData.shippingAddress,
          items,
          subtotal,
          shippingFee: shipping,
          total,
          currency: "gbp",
          token: paymentData.token,
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      const { clientSecret, reference, status, requiresAction, receiptUrl: receipt } = response.data;

      if (requiresAction) {
        const stripe = await stripePromise;
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

        if (confirmError) {
          setError(confirmError.message || "Payment failed.");
          setLoading(false);
          return;
        }

        if (paymentIntent.status === "succeeded") {
          await finalizeOrder(paymentIntent.id, receipt);
        } else {
          setError("Payment is processing. Check email for status.");
          setLoading(false);
        }
      } else if (status === "succeeded") {
        await finalizeOrder(reference, receipt);
      } else {
        setError("Payment is processing. Check email for status.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Place order error:", err.response?.data || err);
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
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
        const { orderId, total, receiptUrl } = successResponse.data; // FROM API
  
        clearCart();
        setPaymentData(null);
        setSuccessData({
          orderId: orderId || reference,
          total: total || subtotal + 5,
          receiptUrl: receiptUrl || null,
        });
  
        // Auto redirect
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

  return (
    <div className="max-w-3xl mx-auto animate-on-scroll">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-6 sm:mb-8">Review & Place Order</h2>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-4">Shipping Address</h3>
            <p className="text-gray-600 text-sm sm:text-base">
              {paymentData.shippingAddress.name}
              <br />
              {paymentData.shippingAddress.line1}
              <br />
              {paymentData.shippingAddress.city}, {paymentData.shippingAddress.postalCode}
              <br />
              {paymentData.shippingAddress.country}
            </p>
            <button onClick={goToPreviousStep} className="text-red-600 text-xs sm:text-sm mt-2 hover:underline">
              Change
            </button>
          </div>
          <div>
  <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-4">Payment Method</h3>
  <p className="text-gray-600 text-sm sm:text-base">
    Card ending in {paymentData?.card?.last4}
  </p>

  <button
    onClick={goToPreviousStep}
    className="text-red-600 text-xs sm:text-sm mt-2 hover:underline"
  >
    Change
  </button>
</div>

        </div>

        <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-4">Items in Order</h3>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {cartItems.map((item) => {
              const [imageError, setImageError] = useState(false);
              const fallbackImage = "https://placehold.co/300x450?text=Book+Cover";
              const displayImage = imageError
                ? fallbackImage
                : item.imageUrl || generatePlaceholderImage({ title: item.title, isbn: item.isbn || "", genre: item.genre || "default" });

              return (
                <div key={item.id} className="flex items-center justify-between py-2 text-sm sm:text-base text-gray-700">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <img
                      src={displayImage}
                      alt={item.title}
                      className="w-10 h-10 object-cover rounded"
                      onError={() => setImageError(true)}
                      loading="lazy"
                    />
                    <p>{item.title} (x{item.quantity})</p>
                  </div>
                  <p>£{(parseFloat(item.price.replace("£", "")) * item.quantity).toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 sm:mt-6 border-t border-gray-200 pt-4 sm:pt-6 space-y-2 text-sm sm:text-base text-gray-700">
          <div className="flex justify-between">
            <p>Subtotal</p>
            <p>£{subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Shipping</p>
            <p>£{shipping.toFixed(2)}</p>
          </div>
          <div className="flex justify-between font-bold text-base sm:text-lg text-gray-800">
            <p>Total</p>
            <p>£{total.toFixed(2)}</p>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}

        <button
          onClick={handlePlaceOrder}
          className="w-full mt-6 sm:mt-8 bg-red-600 text-white py-2 sm:py-3 rounded-md font-semibold text-sm sm:text-base hover:bg-red-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Processing..." : "PLACE ORDER"}
        </button>
      </div>
    </div>
  );
};

// --- Main Checkout Flow Component ---
const CheckoutFlow = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [successData, setSuccessData] = useState<{
    orderId: string;
    total: number;
    receiptUrl: string | null;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [step]);

  // Scroll to top on mount
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

      <main className="flex-1 p-4 sm:p-8 pb-16 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <CheckoutStepper currentStep={step} />
          {step === 1 && (
            <ShoppingCartView
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              goToNextStep={() => setStep(2)}
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
  />
) : step === 3 && successData ? (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center animate-fade-in">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
      <p className="text-gray-600 mb-4">Thank you for your order.</p>
      <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Order ID:</span> {successData.orderId}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Total Paid:</span> £{successData.total.toFixed(2)}
        </p>
      </div>
      <button
        onClick={() => navigate("/orders", { state: successData })}
        className="w-full bg-red-600 text-white py-2 rounded-md font-semibold hover:bg-red-700"
      >
        VIEW ORDER
      </button>
      <p className="text-xs text-gray-500 mt-3">Redirecting in 5 seconds...</p>
    </div>
  </div>
) : step === 3 ? (
  <div className="text-center py-12">
    <p className="text-gray-600">Processing your order...</p>
  </div>
) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutFlow;