import React, { useEffect, useRef } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';

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
import ReturnPolicyPage from './pages/returnPolicy';
import PrivacyPolicyPage from './pages/PrivacyPolicy';
import CookiesPolicyPage from './pages/CookiesPolicy';
import InvoicesPage from './pages/Invoices';
import CreditSlipsPage from './pages/CreditSlips';
import NotFoundPage from './pages/NotFound';
import ForgotPasswordPage from './pages/ForgotPassword';

import NotificationModal from './components/NotificationModal';
import { AuthProvider } from './context/authContext';
import { CartProvider } from './context/cartContext';
import { RecentlyViewedProvider } from './context/viewManager';
import { WishlistProvider } from './context/wishlistContext';

// ScrollToTop component
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Treat /orders, /order/:id, and /item/:orderId/:itemIndex as one
    // logical page — opening the details sidebar shouldn't yank the
    // scroll back to the top of the orders list.
    const inOrdersSection = (p: string) =>
      p === '/orders' || p.startsWith('/order/') || p.startsWith('/item/');

    if (inOrdersSection(prevPathname.current) && inOrdersSection(pathname)) {
      prevPathname.current = pathname;
      return;
    }

    window.scrollTo(0, 0);
    prevPathname.current = pathname;
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
            <NotificationModal />
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Layout route: keep OrdersPage mounted so the list doesn't
                  refetch when the sidebar opens via /order/:id */}
              <Route element={<OrdersPage />}>
                <Route path="/orders" />
                <Route path="/order/:id" />
                <Route path="/item/:orderId/:itemIndex" />
              </Route>
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
              <Route path="/clearance" element={<Navigate to="/special-offers" replace />} />
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