import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MapPin, Pencil, Trash2, X, CheckCircle2,
  Phone, User, Home, Loader2, AlertCircle, Star, Building2
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../context/authContext';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

const API_BASE = 'https://britbooks-api-production-8ebd.up.railway.app/api';

interface Address {
  _id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialData?: Partial<Address>;
}

interface AddressesProps {
  addresses: Address[];
  setAddresses: React.Dispatch<React.SetStateAction<Address[]>>;
  authToken: string | null;
  userId: string | null;
  navigate: ReturnType<typeof useNavigate>;
  onSelectAddress?: (address: Address) => void;
  selectedAddressId?: string | null;
}

// ─── Form Modal ──────────────────────────────────────────────────────────────
const AddressFormModal: React.FC<AddressFormModalProps> = ({ isOpen, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    phoneNumber: initialData.phoneNumber || '',
    addressLine1: initialData.addressLine1 || '',
    addressLine2: initialData.addressLine2 || '',
    city: initialData.city || '',
    state: initialData.state || '',
    postalCode: initialData.postalCode || '',
    country: initialData.country || 'GB',
    isDefault: initialData.isDefault || false,
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postalCode: initialData.postalCode || '',
        country: initialData.country || 'GB',
        isDefault: initialData.isDefault || false,
      });
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const e: any = {};
    if (!formData.fullName.trim()) e.fullName = 'Required';
    if (!formData.phoneNumber.trim()) e.phoneNumber = 'Required';
    if (!formData.addressLine1.trim()) e.addressLine1 = 'Required';
    if (!formData.city.trim()) e.city = 'Required';
    if (!formData.postalCode.trim()) e.postalCode = 'Required';
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrors((p: any) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch {
      setErrors({ form: 'Failed to save address. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none transition-all
    ${errors[field]
      ? 'bg-red-50 border border-red-300 focus:ring-2 focus:ring-red-200'
      : 'bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#0a1628]/20 focus:bg-white'
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0a1628' }}>
                  <MapPin size={16} className="text-white" />
                </div>
                <h2 className="font-black text-gray-900 text-lg">
                  {(initialData as any)._id ? 'Edit Address' : 'New Address'}
                </h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {errors.form && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={15} /> {errors.form}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jane Smith" className={inputCls('fullName')} />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Phone */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+44 7700 900000" className={inputCls('phoneNumber')} />
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                </div>

                {/* Address Line 1 */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Street Address</label>
                  <div className="relative">
                    <Home size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="123 Book Lane" className={inputCls('addressLine1')} />
                  </div>
                  {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                </div>

                {/* Address Line 2 */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Apt / Floor <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Flat 2B" className={inputCls('addressLine2')} />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} placeholder="London"
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none transition-all ${errors.city ? 'bg-red-50 border border-red-300' : 'bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#0a1628]/20 focus:bg-white'}`}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                {/* Postcode */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Postcode</label>
                  <input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="SW1A 1AA"
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none transition-all ${errors.postalCode ? 'bg-red-50 border border-red-300' : 'bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#0a1628]/20 focus:bg-white'}`}
                  />
                  {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                </div>
              </div>

              {/* Set as default */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition">
                <div
                  onClick={() => setFormData(p => ({ ...p, isDefault: !p.isDefault }))}
                  className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${formData.isDefault ? 'bg-[#0a1628]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${formData.isDefault ? 'left-6' : 'left-1'}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Set as default address</p>
                  <p className="text-xs text-gray-400">Used automatically at checkout</p>
                </div>
              </label>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-black text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#0a1628' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Saving…' : 'Save Address'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Address Card ─────────────────────────────────────────────────────────────
const AddressCard: React.FC<{
  address: Address;
  selected: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ address, selected, onSelect, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    onClick={onSelect}
    className={`relative flex flex-col rounded-2xl border-2 p-5 transition-all duration-200 ${
      onSelect ? 'cursor-pointer' : ''
    } ${
      selected
        ? 'border-[#0a1628] bg-[#0a1628]/[0.03] shadow-md'
        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
    }`}
  >
    {/* Selected tick */}
    {selected && (
      <div className="absolute top-4 right-4">
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#0a1628' }}>
          <CheckCircle2 size={14} className="text-white" />
        </div>
      </div>
    )}

    {/* Default badge */}
    {address.isDefault && (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 w-fit"
        style={{ background: '#c9a84c20', color: '#8a6a20' }}>
        <Star size={9} fill="currentColor" /> Default
      </span>
    )}

    {/* Name */}
    <p className="font-black text-gray-900 text-base mb-3">{address.fullName}</p>

    {/* Address lines */}
    <div className="space-y-1.5 text-sm text-gray-500 flex-1">
      <div className="flex items-start gap-2">
        <MapPin size={14} className="text-gray-300 mt-0.5 flex-shrink-0" />
        <div>
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>{address.city}, {address.postalCode}</p>
          <p>{address.country}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Phone size={14} className="text-gray-300 flex-shrink-0" />
        <p>{address.phoneNumber}</p>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1 mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={e => { e.stopPropagation(); onEdit(); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
      >
        <Pencil size={12} /> Edit
      </button>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 transition ml-1"
      >
        <Trash2 size={12} /> Remove
      </button>
    </div>
  </motion.div>
);

// ─── Addresses List Component ─────────────────────────────────────────────────
const Addresses: React.FC<AddressesProps> = ({
  addresses, setAddresses, authToken, userId, navigate, onSelectAddress, selectedAddressId
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async (formData: any) => {
    const body = { ...formData, isDefault: formData.isDefault || addresses.length === 0 };
    const res = await axios.post(`${API_BASE}/users/${userId}/address`, body, { headers: { Authorization: `Bearer ${authToken}` } });
    const updated = body.isDefault
      ? addresses.map(a => ({ ...a, isDefault: false })).concat(res.data)
      : [...addresses, res.data];
    setAddresses(updated);
    if (onSelectAddress) onSelectAddress(res.data);
  };

  const handleEdit = async (formData: any) => {
    const res = await axios.put(`${API_BASE}/users/${userId}/address/${editing!._id}`, formData, { headers: { Authorization: `Bearer ${authToken}` } });
    setAddresses(res.data.addresses);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await axios.delete(`${API_BASE}/users/${userId}/address/${id}`, { headers: { Authorization: `Bearer ${authToken}` } });
      setAddresses(res.data.addresses);
    } catch {
      setError('Failed to remove address.');
    } finally {
      setDeleting(null);
    }
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (addr: Address) => { setEditing(addr); setModalOpen(true); };

  return (
    <div>
      {error && (
        <div className="mb-5 flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {addresses.map(addr => (
            <AddressCard
              key={addr._id}
              address={addr}
              selected={selectedAddressId === addr._id}
              onSelect={onSelectAddress ? () => onSelectAddress(addr) : undefined}
              onEdit={() => openEdit(addr)}
              onDelete={() => handleDelete(addr._id)}
            />
          ))}

          {/* Add new card */}
          <motion.button
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={openAdd}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-gray-400 hover:border-[#0a1628] hover:text-[#0a1628] transition-all duration-200 min-h-[180px] group"
          >
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={20} />
            </div>
            <span className="text-sm font-bold">Add New Address</span>
          </motion.button>
        </AnimatePresence>
      </motion.div>

      <AddressFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editing ? handleEdit : handleAdd}
        initialData={editing || {}}
      />
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const AddressesPage = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = auth.token ? (jwtDecode(auth.token) as any).userId : null;

  useEffect(() => {
    const load = async () => {
      if (!auth.token || !userId) { navigate('/login'); return; }
      try {
        const res = await axios.get(`${API_BASE}/users/${userId}/address`, { headers: { Authorization: `Bearer ${auth.token}` } });
        setAddresses(res.data.addresses || []);
      } catch (err) {
        if ((err as AxiosError).response?.status === 401) { logout(); navigate('/login'); }
      } finally { setLoading(false); }
    };
    load();
  }, [auth.token, userId]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
      <SEOHead title="My Addresses" description="Manage your delivery addresses on BritBooks." canonical="/addresses" noindex />
      <TopBar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#0a1628' }}>
              <MapPin size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Delivery Addresses</h1>
          </div>
          <p className="text-gray-400 text-sm ml-13 pl-[52px]">
            {addresses.length === 0
              ? 'Add an address to get started'
              : `${addresses.length} address${addresses.length > 1 ? 'es' : ''} saved`}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 size={28} className="animate-spin text-gray-300" />
            <p className="text-gray-400 text-sm">Loading addresses…</p>
          </div>
        ) : (
          <Addresses
            addresses={addresses}
            setAddresses={setAddresses}
            authToken={auth.token}
            userId={userId}
            navigate={navigate}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export { Addresses, AddressFormModal };
export default AddressesPage;
