import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CheckCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Placeholder for lucide-react style icons (replace with actual imports if using lucide)
const PackageIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><path d="M12 22 3.29 17" /><path d="M12 22 20.71 17" /><path d="M12 12v10" /></svg>;

const CalendarIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

const TruckIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;

const ClockIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /></svg>;

const ShoppingBagIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;

const MapPinIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;

const CreditCardIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;

const AlertCircleIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

const API_BASE_URL = 'https://britbooks-api-production-8ebd.up.railway.app/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface OrderItem {
  title: string;
  author?: string;
  quantity: number;
  price?: number;
  priceAtPurchase: number;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PaymentDetails {
  method: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
}

interface TrackingStep {
  status: string;
  date: string | null;
  location: string;
  completed: boolean;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  hasDetails?: boolean;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentDetails: PaymentDetails;
  tracking: TrackingStep[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const capitalizeStatus = (status) => {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const mapTracking = (fetchedOrder) => {
  const history: { status: string; updatedAt: string }[] = fetchedOrder.history || [];
  const historyMap = new Map<string, string>(history.map(h => [h.status, h.updatedAt]));
  const statusOrder = {
    ordered: 0,
    processing: 1,
    dispatched: 2,
    in_transit: 3,
    out_for_delivery: 4,
    delivered: 5,
  };
  const currentLevel = statusOrder[fetchedOrder.status] ?? -1;

  const trackingSteps = [
    { status: 'Ordered', backend: 'ordered', location: 'Order placed online' },
    { status: 'Processing', backend: 'processing', location: 'Warehouse' },
    { status: 'Dispatched', backend: 'dispatched', location: 'Sorting Facility' },
    { status: 'In Transit', backend: 'in_transit', location: 'En route to delivery hub' },
    { status: 'Out for Delivery', backend: 'out_for_delivery', location: 'Local Delivery Hub' },
    { status: 'Delivered', backend: 'delivered', location: 'Delivered to address' },
  ];

  return trackingSteps.map(step => {
    const stepLevel = statusOrder[step.backend];
    const completed = stepLevel !== undefined && stepLevel <= currentLevel;
    let date: string | null = null;
    if (completed) {
      date = historyMap.get(step.backend) ?? null;
      if (!date && step.backend === 'ordered') date = fetchedOrder.createdAt;
    }
    return {
      status: step.status,
      date: date ? new Date(date).toISOString() : null,
      location: step.location,
      completed,
    };
  });
};

// ─── ItemDetails ─────────────────────────────────────────────────────────────
const ItemDetails = ({ orders }) => {
  const { orderId, itemIndex } = useParams();
  const order = orders.find(o => o.id === orderId);
  const item = order?.hasDetails && order.items?.[parseInt(itemIndex ?? '0')];

  if (!order || !order.hasDetails || !item) {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-fade-in">
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">Item Not Found</h2>
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-600 mb-6">No details available for this item.</p>
          <Link to="/orders" className="inline-flex px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
      <h2 className="text-3xl font-semibold text-gray-900 mb-6">Item Details - Order #{order.id}</h2>
      <div className="bg-white rounded-xl shadow p-8 space-y-8">
        <div>
          <h3 className="text-xl font-medium mb-4">Item Information</h3>
          <div className="space-y-4 text-gray-700">
            <p><span className="font-medium">Title:</span> {item.title}</p>
            <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
            <p><span className="font-medium">Price:</span> £{item.price.toFixed(2)}</p>
            <p><span className="font-medium">Total:</span> £{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        </div>
        <Link to="/orders" className="inline-flex px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Back to Orders
        </Link>
      </div>
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const OrderDetailsSidebar = ({ isOpen, onClose }) => {
  const { id } = useParams();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !id) return;

    const fetchOrderDetails = async () => {
      if (!auth?.token) {
        setError("Please sign in to view order details");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(`${API_BASE_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (res.data.success && res.data.order) {
          const o = res.data.order;
          setOrder({
            id: o._id,
            date: o.createdAt,
            total: o.total,
            status: capitalizeStatus(o.status),
            items: o.items.map(item => ({
              title: item.title || item.listing?.title || 'Unknown Item',
              author: item.author || item.listing?.author || '',
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase || item.price || 0,
            })),
            shippingAddress: {
              name: o.shippingAddress.fullName,
              street: o.shippingAddress.addressLine2
                ? `${o.shippingAddress.addressLine1}, ${o.shippingAddress.addressLine2}`
                : o.shippingAddress.addressLine1,
              city: o.shippingAddress.city,
              state: o.shippingAddress.state || '',
              postalCode: o.shippingAddress.postalCode,
              country: o.shippingAddress.country,
            },
            paymentDetails: {
              method: capitalizeStatus(o.payment?.method || 'Unknown'),
              status: capitalizeStatus(o.payment?.status || 'Unknown'),
              transactionId: o.payment?.transactionId || 'Not available',
              paidAt: o.payment?.paidAt,
            },
            tracking: mapTracking(o),
          });
        } else {
          setError("Order not found");
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          logout();
          navigate("/login");
        } else {
          setError("Failed to load order details. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [isOpen, id, auth?.token, logout, navigate]);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('ordered') || s === 'pending') return "bg-amber-100 text-amber-800 border-amber-300";
    if (s === 'processing') return "bg-blue-100 text-blue-800 border-blue-300";
    if (s === 'dispatched' || s.includes('transit')) return "bg-indigo-100 text-indigo-800 border-indigo-300";
    if (s.includes('delivery')) return "bg-violet-100 text-violet-800 border-violet-300";
    if (s === 'delivered') return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (s === 'cancelled') return "bg-rose-100 text-rose-800 border-rose-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (loading) {
    return (
      <aside className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 transform transition-all duration-500 ease-out ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </aside>
    );
  }

  if (error || !order) {
    return (
      <aside className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 transform transition-all duration-500 ease-out ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="p-10 flex flex-col items-center justify-center h-full text-center">
          <AlertCircleIcon className="w-16 h-16 text-rose-500 mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Oops...</h2>
          <p className="text-gray-600 mb-8 max-w-sm">{error || "We couldn't load this order."}</p>
          <button onClick={onClose} className="px-10 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition">
            Close
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 transform transition-all duration-500 ease-out ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="px-8 py-7 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <PackageIcon className="w-7 h-7 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 font-mono break-all leading-tight">
                  #{order.id}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  {new Date(order.date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <span className={`px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide border ${getStatusClass(order.status)}`}>
              {order.status}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-14">
          {/* Order Journey */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-100 rounded-lg">
                <TruckIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Order Journey</h3>
            </div>
            <div className="relative pl-11 space-y-10">
              <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-gray-200 rounded-full" />
              {order.tracking.map((step, index) => (
                <div key={index} className="relative flex items-start group">
                  <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110 ${
                    step.completed ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-white'
                  }`}>
                    {step.completed ? (
                      <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <div className="ml-14">
                    <p className={`font-semibold text-lg ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.status}
                    </p>
                    <p className="text-gray-600 mt-1 leading-relaxed">{step.location}</p>
                    {step.date && (
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        {new Date(step.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Items */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-100 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})
              </h3>
            </div>
            <div className="space-y-8">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:justify-between gap-6 pb-7 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg leading-tight">{item.title}</p>
                    {item.author && <p className="text-gray-600 mt-1.5">by {item.author}</p>}
                    <p className="text-gray-600 mt-2">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right min-w-[140px]">
                    <p className="font-semibold text-gray-900 text-lg">
                      £{(item.priceAtPurchase * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      £{item.priceAtPurchase.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Address & Payment */}
          <section className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-rose-100 rounded-lg">
                  <MapPinIcon className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Delivery Address</h3>
              </div>
              <address className="not-italic text-gray-700 leading-relaxed space-y-2">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                {order.shippingAddress.state && <p>{order.shippingAddress.state}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                <p className="font-medium pt-2">{order.shippingAddress.country}</p>
              </address>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-100 rounded-lg">
                  <CreditCardIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
              </div>
              <div className="space-y-5 text-gray-700">
                <p><span className="font-medium text-gray-800">Method:</span> {order.paymentDetails.method}</p>
                <p><span className="font-medium text-gray-800">Status:</span> {order.paymentDetails.status}</p>
                <p>
                  <span className="font-medium text-gray-800">Paid At:</span><br />
                  {order.paymentDetails.paidAt
                    ? new Date(order.paymentDetails.paidAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })
                    : 'Not available'}
                </p>
                <div className="pt-2">
                  <span className="font-medium text-gray-800 block mb-2">Transaction ID</span>
                  <code className="text-sm bg-gray-50 px-4 py-2.5 rounded font-mono break-all block">
                    {order.paymentDetails.transactionId}
                  </code>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="px-8 py-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-100 shadow-sm"
          >
            Close & Return
          </button>
        </footer>
      </div>
    </aside>
  );
};

// Module-level cache so the list survives a remount (e.g. React Router
// swapping routes when navigating from /orders → /order/:id).
const ordersCache: {
  orders: Order[];
  currentPage: number;
  statusFilter: string;
  totalPages: number;
  totalOrders: number;
  loaded: boolean;
} = {
  orders: [],
  currentPage: 1,
  statusFilter: 'All',
  totalPages: 1,
  totalOrders: 0,
  loaded: false,
};

// ─── MainContent (Orders List) ───────────────────────────────────────────────
const MainContent = ({ setOrders, selectedOrderId, isDetailsOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(ordersCache.statusFilter);
  const [orders, setLocalOrders] = useState<Order[]>(ordersCache.orders);
  const [loading, setLoading] = useState(!ordersCache.loaded);
  const [currentPage, setCurrentPage] = useState(ordersCache.currentPage);
  const [totalPages, setTotalPages] = useState(ordersCache.totalPages);
  const [totalOrders, setTotalOrders] = useState(ordersCache.totalOrders);
  const ordersPerPage = 20;

  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Ordered', backend: 'ordered' },
    { value: 'Processing', backend: 'processing' },
    { value: 'Dispatched', backend: 'dispatched' },
    { value: 'In Transit', backend: 'in_transit' },
    { value: 'Out for Delivery', backend: 'out_for_delivery' },
    { value: 'Delivered', backend: 'delivered' },
    { value: 'Cancelled', backend: 'cancelled' },
  ];

  // Push cached orders back to the parent OrdersPage on mount, so the
  // sidebar's lookup still finds them without waiting for a refetch.
  useEffect(() => {
    if (ordersCache.loaded) setOrders(ordersCache.orders);
  }, [setOrders]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth?.token) {
        setLoading(false);
        return;
      }

      // Only show the loading skeleton if this is a truly new
      // page/filter (or the very first load). A pure remount for the
      // same page+filter reuses the cache and refreshes silently.
      const cacheHit =
        ordersCache.loaded &&
        ordersCache.currentPage === currentPage &&
        ordersCache.statusFilter === statusFilter;
      if (!cacheHit) setLoading(true);

      try {
        const decoded = jwtDecode<{ userId: string }>(auth.token);
        const userId = decoded.userId;

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ordersPerPage.toString(),
        });

        if (statusFilter !== 'All') {
          const opt = statusOptions.find(o => o.value === statusFilter);
          params.append('status', opt?.backend || statusFilter.toLowerCase().replace(/ /g, '_'));
        }

        const res = await axios.get(
          `${API_BASE_URL}/orders/user/${userId}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );

        if (res.data.success) {
          const mapped = res.data.orders.map(o => ({
            id: o._id,
            date: o.createdAt,
            total: o.total,
            status: capitalizeStatus(o.status),
            hasDetails: o.items.length > 0,
            items: o.items.map(i => ({
              title: i.listing?.title || 'Unknown Item',
              quantity: i.quantity,
              price: i.priceAtPurchase,
            })),
            shippingAddress: o.shippingAddress,
            paymentDetails: {
              method: capitalizeStatus(o.payment.method),
              status: capitalizeStatus(o.payment.status),
            },
            tracking: mapTracking(o),
          }));

          const pages = res.data.pagination?.pages || 1;
          const total = res.data.pagination?.total || 0;

          setLocalOrders(mapped);
          setOrders(mapped);
          setTotalPages(pages);
          setTotalOrders(total);

          ordersCache.orders = mapped;
          ordersCache.currentPage = currentPage;
          ordersCache.statusFilter = statusFilter;
          ordersCache.totalPages = pages;
          ordersCache.totalOrders = total;
          ordersCache.loaded = true;
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [auth?.token, currentPage, statusFilter, logout, navigate, setOrders]);

  const filteredOrders = searchQuery
    ? orders.filter(o => o.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : orders;

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('ordered') || s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (s === 'processing') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (s === 'dispatched' || s.includes('transit')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (s.includes('delivery')) return 'bg-violet-100 text-violet-800 border-violet-300';
    if (s === 'delivered') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s === 'cancelled') return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const paginate = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main
      className={`flex-1 bg-gradient-to-b from-gray-50 to-white min-h-screen px-5 sm:px-6 lg:px-10 py-8 lg:py-12 transition-[margin] duration-500 ease-out ${
        isDetailsOpen ? 'lg:mr-[32rem]' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Hero header */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-[0.2em]">
            <span className="text-indigo-600">Account</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">Order History</span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">Your Orders</h1>
              <p className="text-gray-500 mt-2 text-base lg:text-lg">
                {loading
                  ? 'Loading your history…'
                  : totalOrders === 0
                    ? 'Your future orders will live here.'
                    : `${totalOrders} order${totalOrders !== 1 ? 's' : ''} · every purchase, tracked.`}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order number…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition shadow-sm placeholder-gray-400 text-sm"
            />
          </div>
          <div className="relative sm:w-56">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none py-3.5 pl-5 pr-10 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition shadow-sm font-medium text-gray-700 text-sm cursor-pointer"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label || opt.value}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Orders / states */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="flex justify-between items-start mb-5">
                  <div className="space-y-2.5">
                    <div className="h-5 bg-gray-100 rounded-full w-28" />
                    <div className="h-3 bg-gray-100 rounded w-64" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-6 bg-gray-100 rounded w-20 ml-auto" />
                    <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-7 bg-gray-100 rounded-lg w-24" />
                  <div className="h-7 bg-gray-100 rounded-lg w-32" />
                  <div className="h-7 bg-gray-100 rounded-lg w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center mx-auto mb-5">
              <PackageIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {searchQuery ? `No orders match "${searchQuery}"` : 'No orders yet'}
            </p>
            <p className="mt-2 text-gray-500">
              {searchQuery ? 'Try a different search term.' : "Once you place an order, it'll show up here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const isSelected = selectedOrderId === order.id;
              const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
              const orderDate = new Date(order.date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              });
              return (
                <div
                  key={order.id}
                  className={`group relative bg-white rounded-2xl transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-100/60'
                      : 'border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-200'
                  }`}
                >
                  {isSelected && (
                    <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-indigo-600" />
                  )}

                  {/* Top: status + date | total */}
                  <div className="px-7 pt-6 pb-4 flex items-start justify-between gap-6 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusClass(order.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-400 inline-flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {orderDate}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-gray-500 break-all leading-relaxed">
                        #{order.id}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        £{order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {totalItems} item{totalItems !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-7 h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

                  {/* Bottom: items + CTA */}
                  <div className="px-7 py-5 flex items-center justify-between gap-5 flex-wrap">
                    <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-xs text-gray-700 max-w-[16rem]">
                          <span className="truncate">{item.title}</span>
                          <span className="text-gray-400 font-medium shrink-0">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="inline-flex items-center bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>

                    {order.hasDetails && (
                      <Link
                        to={`/order/${order.id}`}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-all ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                            : 'bg-gray-900 hover:bg-indigo-600 text-white shadow-sm hover:shadow-lg hover:shadow-indigo-500/20'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'View'}
                        <svg
                          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                          fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalOrders > 0 && !searchQuery && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Page <span className="font-bold text-gray-900">{currentPage}</span> of{' '}
              <span className="font-bold text-gray-900">{totalPages}</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition flex items-center justify-center"
                aria-label="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 7) {
                  if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;
                }
                if (page < 1 || page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`w-10 h-10 rounded-xl font-semibold text-sm transition ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition flex items-center justify-center"
                aria-label="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const OrdersPage = () => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    setIsDetailsOpen(location.pathname.startsWith('/order/') && !!id);
  }, [location.pathname, id]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <SEOHead title="My Orders" description="View and track your BritBooks orders." canonical="/orders" noindex={true} />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
      `}</style>

      <TopBar />
      {location.pathname.startsWith('/item/') ? (
        <ItemDetails orders={orders} />
      ) : (
        <MainContent
          setOrders={setOrders}
          selectedOrderId={isDetailsOpen ? id ?? null : null}
          isDetailsOpen={isDetailsOpen}
        />
      )}
      <OrderDetailsSidebar isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      <Footer />
    </div>
  );
};

export default OrdersPage;