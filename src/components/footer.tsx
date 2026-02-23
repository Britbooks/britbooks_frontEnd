import React from 'react';
import { Link } from 'react-router-dom';

// --- ICONS ---
import { FaFacebookF, FaTwitter, FaPinterestP, FaInstagram } from 'react-icons/fa';

// --- ASSETS ---
const paymentIcons = {
    paypal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png',
    visa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',
    mastercard: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png',
    discover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFHOiHlQ6bd5N1qstL-Syl4ghK9tJDaE-pEA&s',
    amex: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/200px-American_Express_logo.svg.png',
  };

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white font-sans">
      {/* --- Newsletter Section --- */}
      <div className="bg-blue-900 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-semibold text-center md:text-left text-sm md:text-base">
            SIGN UP FOR NEWSLETTER & GET <span className="text-red-500">25% OFF</span> FIRST ORDER
          </p>
          <form className="flex w-full md:w-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="w-full md:w-64 px-4 py-2 text-gray-800 rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="bg-red-600 text-white px-6 py-2 font-bold rounded-r-md hover:bg-red-700 transition-colors"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>

      {/* --- Main Footer Content --- */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: About */}
          <div>
          <Link to="/" className="flex items-center gap-2 text-xl font-bold mb-1 -mt-6 -ml-6">
          <img
  src="/logobrit3.png"
  alt="BritBooks Logo"
  className="h-20 w-auto object-contain"
/>
  </Link>
  <p className="text-gray-400 text-sm leading-relaxed -ml-4">
  BritBooks is your trusted destination for quality used books at unbeatable prices. Explore our vast collection, discover hidden gems, and enjoy fast delivery.
  <Link to="/about" className="text-blue-500 hover:underline ml-1">Learn more →</Link>
</p>

</div>


          {/* Column 2: Customer Support */}
          <div>
            <h3 className="font-semibold mb-4">Customer Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Get in Touch</Link></li>
              <li><Link to="/return-policy" className="text-gray-400 hover:text-white">Return Policy</Link></li>
              <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-gray-400 hover:text-white">Cookies Policy</Link></li>
            </ul>
          </div>

          {/* Column 3: My Account */}
          <div>
            <h3 className="font-semibold mb-4">My account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/checkout" className="text-gray-400 hover:text-white">Shopping Cart</Link></li>
              <li><Link to="/orders" className="text-gray-400 hover:text-white">Order History</Link></li>
              <li><Link to="/invoices" className="text-gray-400 hover:text-white">See my invoices</Link></li>
              <li><Link to="/credits" className="text-gray-400 hover:text-white">My credit slips</Link></li>
              <li><Link to="/addresses" className="text-gray-400 hover:text-white">My addresses</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Insert Contact Address Here, Insert</p>
              <p>Contact Address Here.</p>
              <p className="text-red-500 pt-2">Call: 0208 9046479</p>
            </div>
          </div>

          {/* Column 5: Follow Us */}
          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex items-center space-x-4">
              <Link to="#" aria-label="Facebook" className="text-gray-400 hover:text-white"><FaFacebookF size={20} /></Link>
              <Link to="#" aria-label="Twitter" className="text-gray-400 hover:text-white"><FaTwitter size={20} /></Link>
              <Link to="#" aria-label="Pinterest" className="text-gray-400 hover:text-white"><FaPinterestP size={20} /></Link>
              <Link to="#" aria-label="Instagram" className="text-gray-400 hover:text-white"><FaInstagram size={20} /></Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Bar --- */}
      <div className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © 2020 Brit Books All Rights Reserved<br className="sm:hidden" /> Designed and Developed by <a href="https://excelclone.co.uk" className="hover:text-white">excelclone.co.uk</a>
          </p>
          <div className="flex items-center gap-x-3">
            <img src={paymentIcons.paypal} alt="PayPal" className="h-6" />
            <img src={paymentIcons.visa} alt="Visa" className="h-6" />
            <img src={paymentIcons.mastercard} alt="Mastercard" className="h-6" />
            <img src={paymentIcons.discover} alt="Discover" className="h-6" />
            <img src={paymentIcons.amex} alt="American Express" className="h-6" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;