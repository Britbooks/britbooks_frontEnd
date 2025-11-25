"use client";

import React, { useState, useEffect, useRef } from 'react';
import Footer from '../components/footer';
import TopBar from '../components/Topbar';
import { useAuth } from '../context/authContext';
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";

// === ALL YOUR ORIGINAL ICONS ===
const ChevronDownIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const MailIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const MessageSquareIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const SendIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const XIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// === FAQ COMPONENT (YOUR ORIGINAL) ===
const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-3 sm:py-4">
        <span className="font-semibold text-gray-800 text-sm sm:text-base">{question}</span>
        <ChevronDownIcon className={`w-4 sm:w-5 h-4 sm:h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-3 sm:pb-4 text-gray-600 text-sm sm:text-base">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const faqData = [
  { question: "How do I track my order?", answer: "You can track your order status from the 'My Orders' section in your account dashboard. Once an item is dispatched, you will receive a tracking number via email." },
  { question: "What is your return policy?", answer: "We accept returns within 30 days of receipt, provided the book is in its original condition. Please visit our Shipping & Returns page for detailed instructions on how to initiate a return." },
  { question: "How do I sell my books on BritBooks?", answer: "To sell your books, navigate to the 'Sell Books' section. You can enter the ISBN of your book to get an instant quote. We provide a pre-paid shipping label to send your books to us." },
  { question: "What payment methods do you accept?", answer: "We accept all major credit and debit cards, including Visa, Mastercard, and American Express. We also support payments via PayPal." },
];

const API_BASE = "https://britbooks-api-production.up.railway.app/api/chat";

const SupportTicketSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { auth } = useAuth();
  const userId = auth.user?.userId;
  const token = auth.token;

  const [view, setView] = useState<'form' | 'chat'>('form');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && userId) loadUserChat();
  }, [isOpen, userId]);

  const loadUserChat = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.chat) {
          setChat(data.chat);
          setMessages(data.chat.messages || []);
        }
      }
    } catch (err) {
      console.log("No existing chat");
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ userId, subject, description }),
      });
      if (!res.ok) throw new Error();
      const newChat = await res.json();
      setChat(newChat);
      setMessages(newChat.messages || []);
      setView('chat');
      setSubject('');
      setDescription('');
    } catch (err) {
      alert("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat?._id) return;

    const tempMsg = { _id: `temp_${Date.now()}`, senderId: userId, message: newMessage, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    const text = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ chatId: chat._id, senderId: userId, message: text }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setMessages(updated.messages || []);
      setChat(updated);
    } catch (err) {
      setMessages(prev => prev.filter(m => !m._id?.startsWith('temp_')));
      setNewMessage(text);
    }
  };

  const getSenderType = (msg: any) => {
    if (msg.senderId === userId) return 'user';
    if (msg.senderId === 'bot') return 'bot';
    return 'admin';
  };

  const lastMessage = messages[messages.length - 1];
  const subjectLine = chat?.messages?.[0]?.message?.split('\n')[0]?.replace('Subject: ', '') || 'Support Thread';

  if (!userId) {
    return (
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`} onClick={onClose}>
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm" onClick={e => e.stopPropagation()}>
          <h3 className="text-2xl font-bold mb-4">Login Required</h3>
          <p className="text-gray-600 mb-6">Please log in to access support chat.</p>
          <button onClick={onClose} className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">
            {view === 'form' ? 'Create Support Ticket' : 'Support Chat'}
          </h2>
          <button onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form View */}
        {view === 'form' ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Enter ticket subject..."
                  className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your issue..."
                  className="w-full p-2 sm:p-3 border rounded-md resize-none h-24 sm:h-32 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm sm:text-base"
              >
                {loading ? "Creating..." : "Submit Ticket"}
              </button>
            </form>

            {/* WhatsApp-style Last Message Preview */}
            {chat && messages.length > 0 && (
              <div
                onClick={() => setView('chat')}
                className="mt-8 mx-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all border border-gray-100">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                    B
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base truncate leading-tight">
                      {subjectLine}
                    </p>
                    <p className="text-sm text-gray-600 truncate leading-snug mt-0.5">
                      {lastMessage?.senderId === userId ? 'You: ' : ''}
                      {lastMessage?.message || 'No message'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {lastMessage && new Date(lastMessage.createdAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No previous chat */}
            {!chat && (
              <div className="text-center mt-12">
                <p className="text-gray-500 text-sm">
                  No previous thread. Submit a ticket to start.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Full Chat View */
          <div className="flex flex-col h-full relative">
            <div className="p-3 sm:p-4">
              <button onClick={() => setView('form')} className="text-blue-600 font-semibold text-xs sm:text-sm mb-2 sm:mb-3 hover:underline">
                ← Back to New Ticket
              </button>
              <p className="text-sm sm:text-base font-semibold text-gray-800">{subjectLine}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 border-t border-gray-200 mb-16 sm:mb-20">
              {messages.map((msg: any) => {
                const type = getSenderType(msg);
                const isUser = type === 'user';
                return (
                  <div key={msg._id} className={`mb-3 sm:mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] sm:max-w-xs p-2 sm:p-3 rounded-lg ${isUser ? 'bg-red-600 text-white' : type === 'bot' ? 'bg-gray-100 text-gray-800' : 'bg-gray-200 text-gray-800'}`}>
                      <p className="text-xs sm:text-sm font-semibold">
                        {isUser ? 'You' : type === 'bot' ? 'Grok (Bot)' : 'Support Team'}
                      </p>
                      <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                      <p className="text-xs text-gray-500 mt-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="fixed bottom-0 right-0 w-full sm:w-80 p-3 sm:p-4 border-t bg-white flex items-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 sm:p-3 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
              <button type="submit" className="bg-red-600 text-white p-2 sm:p-3 rounded-r-md hover:bg-red-700">
                <SendIcon className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// === MAIN PAGE - YOUR ORIGINAL FULL PAGE ===
const HelpAndSupportPage = () => {
  const [isSupportSidebarOpen, setIsSupportSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const previousCategory = (location.state as { category?: string })?.category || "Browse";


  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('fade-in-up');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans flex-col">
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
        .hero-section {
          background-image: url('https://media.istockphoto.com/id/1315388795/video/flying-through-emerging-digital-structures-blue-loopable-data-network-virtual-reality-quantum.mp4?s=mp4-640x640-is&k=20&c=YOcxqKZzmSRYHCTkzQgtAKAKGC6E1L5QWNB7ecOspnk=');
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1;
        }
        .hero-section > * { position: relative; z-index: 2; }
      `}</style>

      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <nav aria-label="Breadcrumb" className="flex items-center justify-end text-sm font-medium">
  <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li className="flex items-center">
                <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                  <span className="hidden sm:inline">Home</span>
                  <span className="sm:hidden">Home</span>
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </li>
              {(selectedCategory || (previousCategory && previousCategory !== "Browse")) && (
                <>
                  <li className="flex items-center">
                    <Link
                      to="/category"
                      state={{ category: selectedCategory || previousCategory }}
                      className="text-gray-700 hover:text-blue-600 capitalize font-medium truncate max-w-[120px] sm:max-w-none"
                    >
                      {selectedCategory || previousCategory}
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  </li>
                </>
              )}
              <li className="text-gray-900 font-semibold">Contact</li>
            </ol>
          </nav>
        </div>
      </div>
        
        <main className="flex-1 bg-gray-50 p-4 sm:p-8 overflow-y-auto pb-16 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <header className="hero-section text-white py-16 animate-on-scroll rounded-2xl overflow-hidden">
              <div className="text-center px-6">
                <h1 className="text-4xl sm:text-5xl font-bold">Help & Support</h1>
                <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-200">
                  Create a ticket to chat with our support team or Grok, our AI assistant.
                </p>
              </div>
            </header>

            {/* FAQ Section */}
            <section className="py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center animate-on-scroll">Frequently Asked Questions</h2>
              <div className="bg-white rounded-xl shadow-lg p-6 animate-on-scroll">
                {faqData.map((faq, i) => (
                  <FaqItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </section>

            {/* Contact Section */}
            <section className="py-12 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 animate-on-scroll">Still Need Help?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto mt-10">
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
                  <MailIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg">Email Support</h3>
                  <a href="mailto:support@britbooks.co.uk" className="text-blue-600 font-medium">support@britbooks.co.uk</a>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
                  <MessageSquareIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg">Live Chat</h3>
                  <button
                    onClick={() => setIsSupportSidebarOpen(true)}
                    className="text-blue-600 font-bold hover:underline mt-2"
                  >
                    Start Chat →
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>

      <SupportTicketSidebar
        isOpen={isSupportSidebarOpen}
        onClose={() => setIsSupportSidebarOpen(false)}
      />
    </div>
  );
};

export default HelpAndSupportPage;