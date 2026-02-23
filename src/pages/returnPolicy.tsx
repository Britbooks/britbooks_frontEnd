import React, { useState } from 'react';
import { ChevronDown, Mail, Phone, MapPin } from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';

const ReturnPolicyPage = () => {
  const [isEligibilityOpen, setIsEligibilityOpen] = useState(true);
  const [isProcessOpen, setIsProcessOpen] = useState(true);
  const [isConditionsOpen, setIsConditionsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(true);

  const toggleSection = (setter) => setter((prev) => !prev);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-800 mb-6 text-center">Return Policy</h1>
          <p className="text-gray-600 text-center mb-8">We’re here to make returns easy and stress-free!</p>

          {/* Eligibility Section */}
          <section className="mb-6">
            <div
              className="flex justify-between items-center p-4 bg-blue-50 rounded-lg cursor-pointer"
              onClick={() => toggleSection(setIsEligibilityOpen)}
            >
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">📦</span>
                <h2 className="text-xl font-semibold text-gray-800">Return Eligibility</h2>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isEligibilityOpen ? 'rotate-180' : ''}`} />
            </div>
            {isEligibilityOpen && (
              <div className="p-4 bg-white border border-blue-100 rounded-lg mt-2">
                <p className="text-gray-600 leading-relaxed mb-4">
                  We want you to love your books! Return most new, unopened items within 30 days of delivery for a full refund or exchange. Please ensure items are in their original packaging with tags attached.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Books must be unused and resalable.</li>
                  <li>Include your order number or receipt.</li>
                  <li>Personalized items can’t be returned—sorry!</li>
                </ul>
              </div>
            )}
          </section>

          {/* Process Section */}
          <section className="mb-6">
            <div
              className="flex justify-between items-center p-4 bg-blue-50 rounded-lg cursor-pointer"
              onClick={() => toggleSection(setIsProcessOpen)}
            >
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">🔧</span>
                <h2 className="text-xl font-semibold text-gray-800">Return Process</h2>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isProcessOpen ? 'rotate-180' : ''}`} />
            </div>
            {isProcessOpen && (
              <div className="p-4 bg-white border border-blue-100 rounded-lg mt-2">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Ready to return? Here’s how to get started:
                </p>
                <ol className="list-decimal list-inside text-gray-600 space-y-2">
                  <li>Contact us at <a href="mailto:support@britbooks.com" className="text-blue-600 hover:underline">support@britbooks.com</a> with your order number and reason.</li>
                  <li>We’ll send you a Return Merchandise Authorization (RMA) number and instructions.</li>
                  <li>Pack your item securely with the RMA number on the package.</li>
                  <li>Ship it back within 14 days of receiving the RMA.</li>
                </ol>
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
                  Start Return
                </button>
              </div>
            )}
          </section>

          {/* Conditions Section */}
          <section className="mb-6">
            <div
              className="flex justify-between items-center p-4 bg-blue-50 rounded-lg cursor-pointer"
              onClick={() => toggleSection(setIsConditionsOpen)}
            >
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">📋</span>
                <h2 className="text-xl font-semibold text-gray-800">Return Conditions</h2>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isConditionsOpen ? 'rotate-180' : ''}`} />
            </div>
            {isConditionsOpen && (
              <div className="p-4 bg-white border border-blue-100 rounded-lg mt-2">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Keep these in mind for a smooth return:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>You cover return shipping unless the item was damaged or defective.</li>
                  <li>Refunds take 7-10 business days after we receive your item.</li>
                  <li>Original shipping costs aren’t refundable.</li>
                  <li>Items without an RMA may face delays or refusal.</li>
                </ul>
              </div>
            )}
          </section>

          {/* Contact Section */}
          <section>
            <div
              className="flex justify-between items-center p-4 bg-blue-50 rounded-lg cursor-pointer"
              onClick={() => toggleSection(setIsContactOpen)}
            >
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">📞</span>
                <h2 className="text-xl font-semibold text-gray-800">Contact Us</h2>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isContactOpen ? 'rotate-180' : ''}`} />
            </div>
            {isContactOpen && (
              <div className="p-4 bg-white border border-blue-100 rounded-lg mt-2">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Need help? We’re here for you!
                </p>
                <ul className="list-none text-gray-600 space-y-2">
                  <li className="flex items-center"><Mail className="w-5 h-5 mr-2 text-blue-600" /><strong>Email:</strong> <a href="mailto:support@britbooks.com" className="text-blue-600 hover:underline ml-1">support@britbooks.com</a></li>
                  <li className="flex items-center"><Phone className="w-5 h-5 mr-2 text-blue-600" /><strong>Phone:</strong> 01234 567890 (Mon-Fri, 9 AM - 5 PM WAT)</li>
                  <li className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-600" /><strong>Address:</strong> britbooks Returns, 123 Book Lane, London, UK</li>
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReturnPolicyPage;