import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Icon components
const HomeIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const BoxIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const HeartIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const MapPinIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const SettingsIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const HelpCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const LogOutIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const ChevronRightIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const MenuIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const XIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const handleLogout = () => {
  // Clear tokens, user state, etc.
  // localStorage.removeItem("token");
  window.location.href = "/login";
};

const Sidebar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { icon: HomeIcon, label: 'Dashboard', to: '/dashboard' },
    { icon: BoxIcon, label: 'My Orders', to: '/orders' },
    { icon: HeartIcon, label: 'My Wishlist', to: '/wishlist' },
    { icon: MapPinIcon, label: 'My Saved Addresses', to: '/addresses' },
  ];

  const secondaryLinks = [
    { icon: SettingsIcon, label: 'Account Settings', to: '/settings' },
    { icon: HelpCircleIcon, label: 'Help & Support', to: '/help' },
  ];

  const tertiaryLinks = [
    { icon: HomeIcon, label: 'Browse Categories', to: '/category' },
    { icon: BoxIcon, label: 'Top Genres', to: '/genres', hasChevron: true },
    { icon: HeartIcon, label: 'Popular Collections', to: '/collections', hasChevron: true },
  ];

  const NavItem = ({ link }) => (
    <li key={link.to}>
      <Link
        to={link.to}
        className={`flex items-center p-3 rounded-lg transition-colors ${
          location.pathname === link.to
            ? 'bg-gray-900 text-white'
            : 'text-gray-300 hover:bg-white hover:text-black'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <link.icon className="h-5 w-5 mr-3" />
        <span className="flex-1">{link.label}</span>
        {link.hasChevron && <ChevronRightIcon className="h-5 w-5" />}
      </Link>
    </li>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-black text-white flex-col fixed top-0 left-0 h-full">
        <div className="px-4 py-2">
          <div className="flex items-center justify-start space-x-2">
            <div className="bg-red-600 text-white font-bold text-2xl w-6 h-6 flex items-center justify-center rounded-md">B</div>
            <span className="text-lg font-bold">BritBooks</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <ul>{navLinks.map(link => <NavItem key={link.to} link={link} />)}</ul>
          <hr className="border-gray-700 my-4" />
          <ul>{secondaryLinks.map(link => <NavItem key={link.to} link={link} />)}</ul>
          <div className="px-3 py-2 text-sm text-gray-400 font-semibold">Contentier</div>
          <ul>{tertiaryLinks.map(link => <NavItem key={link.to} link={link} />)}</ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOutIcon className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black text-white flex justify-around items-center py-2 border-t border-gray-700 z-50">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center p-2 ${
              location.pathname === link.to ? 'text-white' : 'text-gray-300'
            }`}
          >
            <link.icon className="h-6 w-6" />
            <span className="text-xs">{link.label.split(' ').pop()}</span>
          </Link>
        ))}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center p-2 text-gray-300"
        >
          <MenuIcon className="h-6 w-6" />
          <span className="text-xs">More</span>
        </button>
      </nav>

      {/* Mobile Full-Screen Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="bg-red-600 text-white font-bold text-2xl w-6 h-6 flex items-center justify-center rounded-md">B</div>
              <span className="text-lg font-bold">BritBooks</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="text-white">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <ul>{navLinks.map(link => <NavItem key={link.to} link={link} />)}</ul>
            <hr className="border-gray-700 my-4" />
            <ul>{secondaryLinks.map(link => <NavItem key={link.to} link={link} />)}</ul>
            <div className="px-3 py-2 text-sm text-gray-400 font-semibold">Contentier</div>
            <ul>{tertiaryLinks.map(link => <NavItem key={link.to} link={link} />)}</ul>
          </nav>
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOutIcon className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;