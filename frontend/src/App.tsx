import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Homepage from './pages/homePage';
import ExplorePage from './pages/ExplorePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignUp';
import DashboardPage from './pages/Dashboard';
import OrdersPage from './pages/Orders';
import CategoryBrowsePage from './pages/Category';
import BrowseCategoryDetail from './components/browseCategoryDetails';
import AboutUs from './pages/About';
import SustainabilityPage from './pages/Sustainability';
import CareersPage from './pages/Careers';
import PressPage from './pages/Press';
import NewArrivalsPage from './pages/NewArrival';
import ContactPage from './pages/Contact';
import FAQPage from './pages/Faq';
import ShippingReturnsPage from './pages/Shipping';
import BestsellersPage from './pages/BestSeller';
import SpecialOffersPage from './pages/SpecialOffer';
import HelpAndSupportPage from './pages/Support';
import SupportChatPage from './pages/SupportChat';
import CheckoutFlow from './pages/CheckOut';
import MyWishlistPage from './pages/Wishlist';
import AddressesPage from './pages/Addresses';
import AccountSettingsPage from './pages/Account';
import PopularBooksPage from './pages/PopularBooks';
import ClearancePage from './pages/ClearancePage';
import ReturnPolicyPage from './pages/returnPolicy';
import PrivacyPolicyPage from './pages/PrivacyPolicy';
import CookiesPolicyPage from './pages/CookiesPolicy';
import InvoicesPage from './pages/Invoices';
import CreditSlipsPage from './pages/CreditSlips';
import NotFoundPage from './pages/NotFound';
import ForgotPasswordPage from './pages/ForgotPassword';

import { AuthProvider } from './context/authContext'; 
import { CartProvider } from './context/cartContext';
import { RecentlyViewedProvider } from './context/viewManager';
import { WishlistProvider } from './context/wishlistContext';

// ScrollToTop component
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <RecentlyViewedProvider>
          <WishlistProvider>
            
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/order/:id" element={<OrdersPage />} />
              <Route path="/item/:orderId/:itemIndex" element={<OrdersPage />} />
              <Route path="/category" element={<CategoryBrowsePage />} />
              <Route path="/browse/:id" element={<BrowseCategoryDetail />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/sustainability" element={<SustainabilityPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/new-arrivals" element={<NewArrivalsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
              <Route path="/bestsellers" element={<BestsellersPage />} />
              <Route path="/special-offers" element={<SpecialOffersPage />} />
              <Route path="/help" element={<HelpAndSupportPage />} />
              <Route path="/help/chat" element={<SupportChatPage />} />
              <Route path="/checkout" element={<CheckoutFlow />} />
              <Route path="/wishlist" element={<MyWishlistPage />} />
              <Route path="/addresses" element={<AddressesPage />} />
              <Route path="/settings" element={<AccountSettingsPage />} />
              <Route path="/popular-books" element={<PopularBooksPage />} />
              <Route path="/clearance" element={<ClearancePage />} />
              <Route path="/return-policy" element={<ReturnPolicyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/cookies" element={<CookiesPolicyPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/credits" element={<CreditSlipsPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </WishlistProvider>
        </RecentlyViewedProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;