import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';

// --- SVG ICONS ---
const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CheckCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const API_BASE_URL = 'https://britbooks-api-production.up.railway.app/api';

// Helper function to capitalize status
const capitalizeStatus = (status) => {
  if (!status) return '';
  return status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// Helper function to map tracking from backend data
const mapTracking = (fetchedOrder) => {
  const history = fetchedOrder.history || [];
  const historyMap = new Map(history.map(h => [h.status, h.updatedAt]));
  const statusOrder = {
    ordered: 0,
    processing: 1,
    dispatched: 2,
    in_transit: 3,
    out_for_delivery: 4,
    delivered: 5,
  };
  const currentStatus = fetchedOrder.status;
  const currentLevel = statusOrder[currentStatus] !== undefined ? statusOrder[currentStatus] : -1;
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
    let date = null;
    if (completed) {
      // Use the specific updatedAt when this status was ticked
      date = historyMap.get(step.backend);
      // Fallback for ordered if no history entry (use creation date)
      if (!date && step.backend === 'ordered') {
        date = fetchedOrder.createdAt;
      }
    }
    return {
      status: step.status,
      date: date ? new Date(date).toISOString() : null,
      location: step.location,
      completed,
    };
  });
};

// --- ItemDetails Component ---
const ItemDetails = ({ orders }) => {
  const { orderId, itemIndex } = useParams();
  const order = orders.find((o) => o.id === orderId);
  const item = order && order.hasDetails && order.items ? order.items[parseInt(itemIndex)] : null;

  if (!order || !order.hasDetails || !item) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Item Not Found</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-600 mb-6">No details available for this item.</p>
          <Link
            to="/orders"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Item Details - Order #{order.id}</h2>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Item Information</h3>
          <div className="text-gray-600 space-y-3">
            <p><span className="font-medium">Title:</span> {item.title}</p>
            <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
            <p><span className="font-medium">Price:</span> £{item.price.toFixed(2)}</p>
            <p><span className="font-medium">Total:</span> £{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );
};

// --- OrderDetailsSidebar Component ---
const OrderDetailsSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { id } = useParams<{ id: string }>();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !id) return;

    const fetchOrderDetails = async () => {
      if (!auth.token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (response.data.success && response.data.order) {
          const o = response.data.order;

          const mappedOrder = {
            id: o._id,
            date: o.createdAt,
            total: o.total,
            status: capitalizeStatus(o.status),
            items: o.items.map((item: any) => ({
              title: item.title,
              author: item.author,
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
            })),
            shippingAddress: {
              name: o.shippingAddress.fullName,
              street: o.shippingAddress.addressLine2
                ? `${o.shippingAddress.addressLine1}, ${o.shippingAddress.addressLine2}`
                : o.shippingAddress.addressLine1,
              city: o.shippingAddress.city,
              state: o.shippingAddress.state || "",
              postalCode: o.shippingAddress.postalCode,
              country: o.shippingAddress.country,
            },
            paymentDetails: {
              method: capitalizeStatus(o.payment.method),
              status: capitalizeStatus(o.payment.status),
              transactionId: o.payment.transactionId,
              paidAt: o.payment.paidAt,
            },
            tracking: o.tracking.map((t: any) => ({
              status: capitalizeStatus(t.status),
              location: t.location,
              completed: t.completed,
              date: t.date,
            })),
          };

          setOrder(mappedOrder);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [isOpen, id, auth.token, navigate, logout]);

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "ordered" || s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "processing") return "bg-blue-100 text-blue-800";
    if (s === "dispatched" || s === "in transit") return "bg-indigo-100 text-indigo-800";
    if (s === "out for delivery") return "bg-purple-100 text-purple-800";
    if (s === "delivered") return "bg-green-100 text-green-800";
    if (s === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
            <Link to="/orders" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XIcon className="w-6 h-6" />
            </Link>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Order Not Found</h2>
            <Link to="/orders" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XIcon className="w-6 h-6" />
            </Link>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-gray-600 mb-6">No details available for this order.</p>
            <Link
              to="/orders"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Order #......{order.id.slice(-15)}</h2>
          <Link to="/orders" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="w-6 h-6" />
          </Link>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-8">
          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="text-gray-600 space-y-3">
              <p>
                <span className="font-medium">Order Date:</span>{" "}
                {new Date(order.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p>
                <span className="font-medium">Total:</span> £{order.total.toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
            <div className="space-y-4">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-4">
                  <div>
                    <p className="text-gray-900 font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">by {item.author}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-gray-900 font-medium">
                    £{(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
            <p className="text-gray-600 leading-relaxed">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.street}
              {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
            <div className="text-gray-600 space-y-2">
              <p>
                <span className="font-medium">Method:</span> {order.paymentDetails.method}
              </p>
              <p>
                <span className="font-medium">Status:</span> {order.paymentDetails.status}
              </p>
              <p>
                <span className="font-medium">Paid At:</span>{" "}
                {new Date(order.paymentDetails.paidAt).toLocaleString("en-GB")}
              </p>
              <p className="text-xs text-gray-500 break-all">
                Transaction ID: {order.paymentDetails.transactionId}
              </p>
            </div>
          </div>

          {/* Tracking */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Tracker</h3>
            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              {order.tracking.map((step: any, index: number) => (
                <div key={index} className="flex items-start mb-6 relative">
                  <div className="absolute left-0 transform -translate-x-1/2">
                    {step.completed ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400 bg-white" />
                    )}
                  </div>
                  <div className="ml-6">
                    <p className={`font-medium ${step.completed ? "text-gray-900" : "text-gray-500"}`}>
                      {step.status}
                    </p>
                    <p className="text-sm text-gray-500">{step.location}</p>
                    <p className="text-xs text-gray-400">
                      {step.date
                        ? new Date(step.date).toLocaleString("en-GB")
                        : "Not started"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-6 border-t border-gray-200">
          <Link
            to="/orders"
            onClick={onClose}
            className="w-full block text-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- MainContent Component ---
const MainContent = ({ setOrders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setLocalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 20; // Match backend default limit
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Ordered', backend: 'ordered', label: 'Ordered' },
    { value: 'Processing', backend: 'processing', label: 'Processing' },
    { value: 'Dispatched', backend: 'dispatched', label: 'Dispatched' },
    { value: 'In Transit', backend: 'in_transit', label: 'In Transit' },
    { value: 'Out for Delivery', backend: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'Delivered', backend: 'delivered', label: 'Delivered' },
    { value: 'Cancelled', backend: 'cancelled', label: 'Cancelled' },
  ];

  // Fetch orders from API with pagination
  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.token) {
        console.error('No auth token. Redirecting to login.');
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode(auth.token);
        const userId = decoded.userId;
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: ordersPerPage,
        });
        if (statusFilter !== 'All') {
          const selectedOption = statusOptions.find(o => o.value === statusFilter);
          if (selectedOption?.backend) {
            queryParams.append('status', selectedOption.backend);
          } else {
            queryParams.append('status', statusFilter.toLowerCase().replace(/ /g, '_'));
          }
        }

        const response = await axios.get(
          `${API_BASE_URL}/orders/user/${userId}?${queryParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );

        if (response.data.success) {
          const fetchedOrders = response.data.orders;
          const mappedOrders = fetchedOrders.map((order) => {
            return {
              id: order._id,
              date: order.createdAt,
              total: order.total,
              status: capitalizeStatus(order.status),
              hasDetails: order.items.length > 0,
              items: order.items.map((item) => ({
                title: item.listing?.title || 'Unknown Item',
                quantity: item.quantity,
                price: item.priceAtPurchase,
              })),
              shippingAddress: {
                name: order.shippingAddress.fullName,
                street: order.shippingAddress.addressLine1,
                city: order.shippingAddress.city,
                postalCode: order.shippingAddress.postalCode,
                country: order.shippingAddress.country,
              },
              paymentDetails: {
                method: capitalizeStatus(order.payment.method),
                status: capitalizeStatus(order.payment.status),
              },
              tracking: mapTracking(order),
            };
          });

          setLocalOrders(mappedOrders);
          setOrders(mappedOrders);
          setTotalPages(response.data.pagination.pages);
          setTotalOrders(response.data.pagination.total);
          console.log('Orders loaded successfully:', response.data.pagination);
        } else {
          console.error('Failed to load orders.');
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
        if (err.response?.status === 401) {
          console.error('Session expired. Redirecting to login.');
          logout();
          navigate('/login');
        } else if (err.response?.status === 403) {
          console.error('Forbidden access.');
          navigate('/orders');
        } else {
          console.error('Failed to load orders. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [auth.token, navigate, logout, setOrders, currentPage, statusFilter]);

  // Filter orders by search query (client-side)
  const filteredOrders = searchQuery
    ? orders.filter((order) => order.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : orders;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusClass = (status) => {
    const lower = status.toLowerCase();
    if (lower.includes('order') || lower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (lower === 'processing') return 'bg-blue-100 text-blue-800';
    if (lower === 'dispatched' || lower.includes('transit')) return 'bg-indigo-100 text-indigo-800';
    if (lower.includes('deliver')) return 'bg-purple-100 text-purple-800';
    if (lower === 'delivered') return 'bg-green-100 text-green-800';
    if (lower === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatItems = (items, orderId, hasDetails) => {
    if (!hasDetails || !items || items.length === 0) {
      return <span className="text-gray-500 italic">No items available</span>;
    }
    return items.map((item, index) => (
      <span key={index}>
        <Link
          to={`/item/${orderId}/${index}`}
          className="text-indigo-600 hover:text-indigo-800 transition-colors"
          aria-label={`View details for ${item.title} in order ${orderId}`}
        >
          {item.title} x{item.quantity}
        </Link>
        {index < items.length - 1 && ', '}
      </span>
    ));
  };

  return (
    <main className="flex-1 bg-gray-100 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 animate-fade-in">Your Orders</h1>
        <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-all duration-200"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-48 p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-200"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label || opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading orders...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 font-semibold text-gray-700">Order Number</th>
                    <th className="p-4 font-semibold text-gray-700">Date</th>
                    <th className="p-4 font-semibold text-gray-700">Items</th>
                    <th className="p-4 font-semibold text-gray-700">Total</th>
                    <th className="p-4 font-semibold text-gray-700">Status</th>
                    <th className="p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No orders found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="p-4 text-gray-900">#{order.id}</td>
                        <td className="p-4 text-gray-600">{new Date(order.date).toLocaleDateString('en-GB')}</td>
                        <td className="p-4 text-gray-600">{formatItems(order.items, order.id, order.hasDetails)}</td>
                        <td className="p-4 text-gray-900">£{order.total.toFixed(2)}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {order.hasDetails ? (
                            <Link
                              to={`/order/${order.id}`}
                              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                              aria-label={`View details for order ${order.id}`}
                            >
                              View Details
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic">No details available</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No orders found matching your criteria.</div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-900 font-medium">#{order.id}</span>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-gray-600 mb-2">
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(order.date).toLocaleDateString('en-GB')}
                  </div>
                  <div className="text-gray-600 mb-2">
                    <span className="font-medium">Items:</span>{' '}
                    {formatItems(order.items, order.id, order.hasDetails)}
                  </div>
                  <div className="text-gray-600 mb-4">
                    <span className="font-medium">Total:</span> £{order.total.toFixed(2)}
                  </div>
                  <div>
                    {order.hasDetails ? (
                      <Link
                        to={`/order/${order.id}`}
                        className="block text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                        aria-label={`View details for order ${order.id}`}
                      >
                        View Details
                      </Link>
                    ) : (
                      <span className="block text-center text-gray-500 italic">No details available</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Pagination Controls */}
          {!loading && totalOrders > 0 && !searchQuery && (
            <div className="mt-12 flex flex-col items-center gap-6">
              {/* Page Info */}
              <p className="text-sm text-gray-600 font-medium">
                Showing page <span className="font-semibold text-indigo-600">{currentPage}</span> of{' '}
                <span className="font-semibold text-indigo-600">{totalPages}</span> ({totalOrders}{' '}
                {totalOrders === 1 ? 'order' : 'orders'} total)
              </p>

              {/* Pagination Navigation */}
              <nav className="flex items-center gap-2" aria-label="Pagination">
                {/* Previous Button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-300
                    bg-white border border-gray-300 text-gray-700 shadow-sm
                    hover:bg-gray-50 hover:border-gray-400 hover:shadow
                    disabled:pointer-events-none disabled:opacity-50 disabled:text-gray-400 disabled:shadow-none
                    focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  aria-label="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Numbers - Smart Truncation (Desktop) */}
                <div className="hidden sm:flex items-center gap-2">
                  {/* First Page + Ellipsis */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => paginate(1)}
                        className="w-12 h-12 rounded-xl text-sm font-medium transition-all duration-300
                          bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="text-gray-500 px-2">...</span>}
                    </>
                  )}

                  {/* Dynamic Page Range (up to 5 visible) */}
                  {(() => {
                    const pages = [];
                    const start = totalPages <= 5 ? 1 : Math.max(1, currentPage - 2);
                    const end = totalPages <= 5 ? totalPages : Math.min(totalPages, currentPage + 2);

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => paginate(i)}
                          className={`w-12 h-12 rounded-xl text-sm font-medium transition-all duration-300 shadow-sm
                            ${currentPage === i
                              ? 'bg-indigo-600 text-white border border-indigo-600 shadow-indigo-200'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow'}`}
                          aria-current={currentPage === i ? 'page' : undefined}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}

                  {/* Last Page + Ellipsis */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="text-gray-500 px-2">...</span>}
                      <button
                        onClick={() => paginate(totalPages)}
                        className="w-12 h-12 rounded-xl text-sm font-medium transition-all duration-300
                          bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Mobile Simplified: Just Prev/Current/Next */}
                <div className="flex sm:hidden items-center gap-4 text-sm font-medium text-gray-700">
                  <span>
                    Page {currentPage} / {totalPages}
                  </span>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-300
                    bg-white border border-gray-300 text-gray-700 shadow-sm
                    hover:bg-gray-50 hover:border-gray-400 hover:shadow
                    disabled:pointer-events-none disabled:opacity-50 disabled:text-gray-400 disabled:shadow-none
                    focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          )}

          {/* Search No Results Message */}
          {searchQuery && displayedOrders.length === 0 && !loading && (
            <div className="mt-12 text-center">
              <p className="text-gray-600 text-lg">
                No orders found matching "<span className="font-semibold text-indigo-600">{searchQuery}</span>".
              </p>
              <p className="text-sm text-gray-500 mt-2">Try searching by full or partial order ID.</p>
            </div>
          )}

          {/* Optional: Show message when searching */}
          {searchQuery && filteredOrders.length === 0 && !loading && (
            <div className="mt-8 text-center text-gray-600">
              No orders found matching "<strong>{searchQuery}</strong>". Try searching by full or partial order ID.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

// --- OrdersPage Component ---
const OrdersPage = () => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.animate-fade-in');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    setIsDetailsOpen(location.pathname.startsWith('/order/') && !!id);
  }, [location.pathname, id]);

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans flex-col">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
      `}</style>
      <TopBar />
      {location.pathname.startsWith('/item/') ? <ItemDetails orders={orders} /> : <MainContent setOrders={setOrders} />}
      <OrderDetailsSidebar isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      <Footer />
    </div>
  );
};

export default OrdersPage;