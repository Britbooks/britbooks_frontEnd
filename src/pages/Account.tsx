"use client";

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { JwtPayload } from '../types/auth';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';

// API URL consistent with AuthContext
const API_URL = import.meta.env.VITE_API_URL || 'https://britbooks-api-production.up.railway.app';

// --- SVG ICONS ---
const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const TrashIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// --- Initial User Data (for fallback) ---
const initialUserData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '',
  profilePicture: '',
  is2FAEnabled: false,
  notifications: { email: true, sms: false },
};

// --- Account Settings Form Component ---
const AccountSettingsForm = ({ userData, setUserData, token, logout }) => {
  const [formData, setFormData] = useState({
    ...userData,
    password: '',
    confirmPassword: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(null); // null, 'logout', 'delete'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const profilePicPreview = profilePicFile 
  ? URL.createObjectURL(profilePicFile)
  : (userData.profilePicture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(userData.name || 'User')}`);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name.includes('notifications.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: checked },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB.');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Profile picture must be a JPEG, PNG, or GIF.');
        return;
      }
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      setError('Please enter a valid phone number (10-15 digits).');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phoneNumber', formData.phone);
      if (formData.password) formDataToSend.append('password', formData.password);
      if (profilePicFile) formDataToSend.append('profilePicture', profilePicFile);

      const response = await axios.put(
        `${API_URL}/api/users/${userData.userId}`,
        formDataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserData({
        userId: response.data._id,
        name: response.data.fullName || 'User',
        email: response.data.email,
        phone: response.data.phoneNumber || '',
        profilePicture: response.data.profilePicture 
          ? response.data.profilePicture 
          : `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(response.data.fullName || 'User')}`,
        is2FAEnabled: initialUserData.is2FAEnabled,
        notifications: initialUserData.notifications,
      });
      setSuccess('Account details updated successfully!');
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      console.error('Update user error:', err);
      setError(err.response?.data?.message || 'Failed to update account details.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`${API_URL}/api/users/${userData.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Failed to delete account.');
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Account Settings</h2>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm animate-on-scroll">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center mb-4 sm:mb-6">
          <img
  src={profilePicPreview}
  alt="Profile"
  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mb-2"
/>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleProfilePicChange}
              className="w-full text-sm sm:text-base text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1234567890"
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800">New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="New Password"
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm New Password"
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is2FAEnabled"
                checked={formData.is2FAEnabled}
                onChange={handleChange}
                className="form-checkbox text-red-600"
              />
              <span className="ml-2 text-xs sm:text-sm text-gray-600">Enable Two-Factor Authentication</span>
            </label>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Notification Preferences</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications.email"
                checked={formData.notifications.email}
                onChange={handleChange}
                className="form-checkbox text-red-600"
              />
              <span className="ml-2 text-xs sm:text-sm text-gray-600">Receive email notifications</span>
            </label>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                name="notifications.sms"
                checked={formData.notifications.sms}
                onChange={handleChange}
                className="form-checkbox text-red-600"
              />
              <span className="ml-2 text-xs sm:text-sm text-gray-600">Receive SMS notifications</span>
            </label>
          </div>
          {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
          {success && <p className="text-xs sm:text-sm text-green-600">{success}</p>}
          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-red-600 text-white py-2 px-3 sm:px-4 rounded-md text-sm sm:text-base hover:bg-red-700 transition-colors"
            >
              Save Changes
            </button>
            <div className="flex space-x-2 sm:space-x-4">
              <button
                type="button"
                onClick={() => setIsModalOpen('logout')}
                className="text-blue-600 text-xs sm:text-sm hover:underline"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen('delete')}
                className="flex items-center text-xs sm:text-sm text-gray-500 hover:text-red-600"
              >
                <TrashIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-1" /> Delete Account
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300 ${
          isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm m-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              {isModalOpen === 'logout' ? 'Confirm Logout' : 'Confirm Delete Account'}
            </h2>
            <button onClick={() => setIsModalOpen(null)} className="text-gray-600 hover:text-gray-800">
              <XIcon className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            {isModalOpen === 'logout'
              ? 'Are you sure you want to log out?'
              : 'Are you sure you want to delete your account? This action cannot be undone.'}
          </p>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(null)}
              className="py-2 px-3 sm:px-4 rounded-md text-sm sm:text-base text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={isModalOpen === 'logout' ? handleLogout : handleDeleteAccount}
              className="bg-red-600 text-white py-2 px-3 sm:px-4 rounded-md text-sm sm:text-base hover:bg-red-700 transition-colors"
            >
              {isModalOpen === 'logout' ? 'Logout' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Account Settings Page Component ---
const AccountSettingsPage = () => {
  const [activeLink, setActiveLink] = useState('account');
  const [userData, setUserData] = useState(initialUserData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const context = useContext(AuthContext);

  if (!context) throw new Error("AuthContext must be used within AuthProvider");
  const { auth, logout } = context;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.token) {
        setError('No authentication token available. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const userId = auth.user?.userId || jwtDecode<JwtPayload>(auth.token).userId;
        if (!userId) {
          setError('Invalid token: userId not found.');
          setLoading(false);
          return;
        }

        console.log('Fetching user data for userId:', userId);
        const response = await axios.get(
          `${API_URL}/api/users/${userId}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        console.log('User data response:', response.data);

        setUserData({
          userId: response.data._id,
          name: response.data.fullName,
          email: response.data.email,
          phone: response.data.phoneNumber || '',
          profilePicture: response.data.profilePicture || initialUserData.profilePicture,
          is2FAEnabled: initialUserData.is2FAEnabled,
          notifications: initialUserData.notifications,
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch user data error:', err);
        setError(err.response?.data?.message || 'Failed to fetch user data.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth.token, auth.user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex-col flex">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
      `}</style>

      <TopBar />
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto pb-16">
        <AccountSettingsForm userData={userData} setUserData={setUserData} token={auth.token} logout={logout} />
      </main>
      <Footer />
    </div>
  );
};

export default AccountSettingsPage;