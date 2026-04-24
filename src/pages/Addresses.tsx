import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MapPin, 
  Pencil, 
  Trash2, 
  X, 
  CheckCircle2, 
  Phone, 
  User, 
  Home,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../context/authContext';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

// --- Interfaces ---
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

// --- Component 1: Address Form Modal ---
const AddressFormModal: React.FC<AddressFormModalProps> = ({ isOpen, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || "",
    phoneNumber: initialData.phoneNumber || "",
    addressLine1: initialData.addressLine1 || "",
    addressLine2: initialData.addressLine2 || "",
    city: initialData.city || "",
    state: initialData.state || "",
    postalCode: initialData.postalCode || "",
    country: initialData.country || "GB",
    isDefault: initialData.isDefault || false,
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: initialData.fullName || "",
        phoneNumber: initialData.phoneNumber || "",
        addressLine1: initialData.addressLine1 || "",
        addressLine2: initialData.addressLine2 || "",
        city: initialData.city || "",
        state: initialData.state || "",
        postalCode: initialData.postalCode || "",
        country: initialData.country || "GB",
        isDefault: initialData.isDefault || false,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone is required";
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postcode is required";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev: any) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setErrors({ form: "Failed to save address. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                {initialData._id ? "Edit Address" : "New Shipping Address"}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {errors.form && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors.form}</div>}
              
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className={`w-full pl-10 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all ${errors.fullName ? 'border-red-500' : 'border-gray-200'}`} />
                </div>
                
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" className={`w-full pl-10 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200'}`} />
                </div>

                <div className="relative">
                  <Home className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Street Address" className={`w-full pl-10 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all ${errors.addressLine1 ? 'border-red-500' : 'border-gray-200'}`} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                  <input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="Postcode" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                </div>

                <div className="flex items-center gap-2 p-2">
                  <input type="checkbox" name="isDefault" id="isDefault" checked={formData.isDefault} onChange={handleChange} className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer" />
                  <label htmlFor="isDefault" className="text-sm text-gray-600 font-medium cursor-pointer">Set as default address</label>
                </div>
              </div>
            </form>

            <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2.5 font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
              <button type="submit" onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-70">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Address"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Component 2: Address List Display ---
const Addresses: React.FC<AddressesProps> = ({ addresses, setAddresses, authToken, userId, navigate, onSelectAddress, selectedAddressId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = "https://britbooks-api-production-8ebd.up.railway.app/api";

  const handleAddAddress = async (formData: Address) => {
    try {
      const newAddress = { ...formData, isDefault: formData.isDefault || addresses.length === 0 };
      const response = await axios.post(`${API_BASE_URL}/users/${userId}/address`, newAddress, { headers: { Authorization: `Bearer ${authToken}` } });
      const updated = newAddress.isDefault ? addresses.map(a => ({ ...a, isDefault: false })).concat(response.data) : [...addresses, response.data];
      setAddresses(updated);
      if (onSelectAddress) onSelectAddress(response.data);
    } catch (err) {
      setError("Failed to add address.");
    }
  };
  const handleEditAddress = async (formData: Address) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/${userId}/address/${editingAddress!._id}`,
        formData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
  
      // Backend returns full updated addresses array
      setAddresses(response.data.addresses);
  
    } catch (err) {
      setError("Failed to update address.");
    }
  };
  

  const handleRemoveAddress = async (id: string) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/users/${userId}/address/${id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
  
      // Backend returns updated addresses array
      setAddresses(response.data.addresses);
  
    } catch (err) {
      setError("Failed to remove address.");
    }
  };
  

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shipping Addresses</h2>
          <p className="text-gray-500 mt-1">Manage where your books are delivered.</p>
        </div>
        <button
          onClick={() => { setEditingAddress(null); setIsModalOpen(true); }}
          className="group flex items-center gap-2 bg-gray-900 text-white py-3 px-6 rounded-2xl hover:bg-red-600 transition-all duration-300 shadow-xl"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-bold">Add New Address</span>
        </button>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {addresses.map((address) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={address._id}
              onClick={() => onSelectAddress?.(address)}
              className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${
                selectedAddressId === address._id ? "border-red-600 bg-red-50/40 ring-4 ring-red-50" : "border-white bg-white shadow-sm hover:shadow-md"
              }`}
            >
              {selectedAddressId === address._id && <div className="absolute top-5 right-5 text-red-600"><CheckCircle2 className="w-6 h-6 fill-red-50" /></div>}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-lg uppercase tracking-tight">{address.fullName}</p>
                  {address.isDefault && <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Default</span>}
                </div>
                <div className="text-gray-600 text-sm space-y-1">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {address.addressLine1}</p>
                  <p className="ml-6">{address.city}, {address.postalCode}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {address.phoneNumber}</p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between">
                  <button onClick={(e) => { e.stopPropagation(); setEditingAddress(address); setIsModalOpen(true); }} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-3.5 h-3.5" /> EDIT</button>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveAddress(address._id); }} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /> REMOVE</button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {addresses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No addresses found.</p>
        </div>
      )}

      <AddressFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={editingAddress ? handleEditAddress : handleAddAddress} initialData={editingAddress || {}} />
    </div>
  );
};

// --- Component 3: Main Page ---
const AddressesPage = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "https://britbooks-api-production-8ebd.up.railway.app/api";

  const userId = auth.token ? (jwtDecode(auth.token) as any).userId : null;

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!auth.token || !userId) { navigate("/login"); return; }
      try {
        const res = await axios.get(`${API_BASE_URL}/users/${userId}/address`, { headers: { Authorization: `Bearer ${auth.token}` } });
        setAddresses(res.data.addresses || []);
      } catch (err) {
        if ((err as AxiosError).response?.status === 401) { logout(); navigate("/login"); }
      } finally { setLoading(false); }
    };
    fetchAddresses();
  }, [auth.token, userId]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      <SEOHead title="My Addresses" description="Manage your delivery addresses on BritBooks." canonical="/addresses" noindex={true} />
      <TopBar />
      <main className="flex-1 py-10">
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
        ) : (
          <Addresses addresses={addresses} setAddresses={setAddresses} authToken={auth.token} userId={userId} navigate={navigate} />
        )}
      </main>
      <Footer />
    </div>
  );
};

// --- Exports ---
export { Addresses, AddressFormModal };
export default AddressesPage;