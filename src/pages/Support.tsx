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

  const [view, setView] = useState<'list' | 'form' | 'chat'>('list'); // list → form → chat
  const [threads, setThreads] = useState<any[]>([]);                    // All user threads
  const [selectedChat, setSelectedChat] = useState<any>(null);          // Currently open chat
  const [messages, setMessages] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = "https://britbooks-api-production.up.railway.app/api/chat";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load all threads when sidebar opens
  useEffect(() => {
    if (isOpen && userId && token) {
      loadUserThreads();
    } else if (isOpen && !userId) {
      setChatLoading(false);
    }
  }, [isOpen, userId, token]);

  const loadUserThreads = async () => {
    if (!userId || !token) return;

    setChatLoading(true);
    setChatError('');

    try {
      const res = await fetch(`${API_BASE}/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      const threadList = result.data || [];

      // Sort by last message time (newest first)
      threadList.sort((a: any, b: any) => 
        new Date(b.lastMessageAt || b.updatedAt).getTime() - 
        new Date(a.lastMessageAt || a.updatedAt).getTime()
      );

      setThreads(threadList);

      if (threadList.length > 0) {
        // Auto-open the most recent thread
        setSelectedChat(threadList[0]);
        setMessages(threadList[0].messages || []);
        setView('chat');
      } else {
        setView('form');
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
      setChatError("Could not load your support history.");
      setView('form');
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, subject, description }),
      });

      if (!res.ok) throw new Error('Failed to create ticket');

      const newChat = await res.json();
      setThreads(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
      setMessages(newChat.messages || []);
      setView('chat');
      setSubject('');
      setDescription('');
    } catch (err) {
      alert("Failed to create ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat?._id) return;

    const optimisticMsg = {
      _id: `temp_${Date.now()}`,
      senderId: userId,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMsg]);
    const text = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          senderId: userId,
          message: text,
        }),
      });

      if (!res.ok) throw new Error();

      const updatedChat = await res.json();
      setMessages(updatedChat.messages || []);
      setSelectedChat(updatedChat);

      // Update thread list with new last message
      setThreads(prev => prev.map(t => t._id === updatedChat._id ? updatedChat : t));
    } catch (err) {
      setMessages(prev => prev.filter(m => !m._id?.startsWith('temp_')));
      setNewMessage(text);
      alert("Failed to send message.");
    }
  };

  const getSenderName = (msg: any) => {
    if (msg.senderId === userId) return 'You';
    if (msg.senderId === 'bot') return 'Grok (AI)';
    return 'Support Team';
  };

  const extractSubject = (chat: any) => {
    const firstMsg = chat.messages?.[0]?.message;
    if (firstMsg?.startsWith('Subject:')) {
      return firstMsg.split('\n')[0].replace('Subject:', '').trim();
    }
    return 'Support Thread';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Not logged in
  if (!userId) {
    return (
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`} onClick={onClose}>
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm" onClick={e => e.stopPropagation()}>
          <h3 className="text-2xl font-bold mb-4">Login Required</h3>
          <p className="text-gray-600 mb-6">Please log in to access support.</p>
          <button onClick={onClose} className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {view === 'form' ? 'New Support Ticket' : view === 'list' ? 'Support Threads' : 'Support Chat'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Loading */}
        {chatLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading your threads...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {chatError && !chatLoading && (
          <div className="p-4 text-center text-red-600 bg-red-50 mx-4 rounded-lg">
            {chatError}
          </div>
        )}

        {/* Thread List View */}
        {!chatLoading && view === 'list' && threads.length > 0 && (
  <div className="flex flex-col h-full bg-gray-50">
    {/* Clean Minimal Header */}
    <div className="bg-white px-6 pt-8 pb-6">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Support</h2>
      <p className="text-sm text-gray-500">Your conversations with BritBooks</p>
      
      <button
        onClick={() => setView('form')}
        className="mt-6 w-full bg-red-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
        New Ticket
      </button>
    </div>

    {/* Modern Thread List - Clean Cards */}
    <div 
      className="flex-1 overflow-y-auto -mt-4" // Overlap header slightly for modern feel
      style={{ 
        paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 4rem), 6rem)' 
      }}
      ref={(node) => {
        if (node) node.scrollTop = 0;
      }}
    >
      <div className="px-4 pt-4 space-y-4">
        {threads.map((thread) => {
          // Replace with real unread logic later
          const unreadCount = thread.unreadCount || 0;
          const isUnread = unreadCount > 0;

          return (
            <div
              key={thread._id}
              onClick={() => {
                setSelectedChat(thread);
                setMessages(thread.messages || []);
                setView('chat');
              }}
              className={`bg-white rounded-3xl p-5 cursor-pointer transition-all duration-300 ${
                isUnread 
                  ? 'ring-2 ring-red-500/30 shadow-xl scale-[1.01]' 
                  : 'shadow-md hover:shadow-xl hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Large Clean Avatar */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 ${
                  isUnread ? 'bg-red-600' : 'bg-gray-800'
                }`}>
                  B
                  {/* Unread dot */}
                  {isUnread && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold text-lg truncate ${isUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                      {extractSubject(thread)}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTime(thread.lastMessageAt || thread.updatedAt)}
                    </span>
                  </div>

                  <p className={`text-base line-clamp-2 leading-relaxed ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {thread.lastMessage || 'No messages yet'}
                  </p>

                  {/* Unread Badge - Clean Pill */}
                  {isUnread && (
                    <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount} new
                    </div>
                  )}
                </div>

                {/* Subtle chevron */}
                <svg className={`w-6 h-6 flex-shrink-0 transition-colors ${isUnread ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

        {/* Form View */}
        {!chatLoading && view === 'form' && (
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Order not received"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your issue..."
                  className="w-full p-3 border rounded-lg h-40 resize-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-70"
              >
                {loading ? 'Creating...' : 'Submit Ticket'}
              </button>
            </form>

            {threads.length > 0 && (
              <button
                onClick={() => setView('list')}
                className="w-full mt-4 text-blue-600 font-medium hover:underline"
              >
                ← View Previous Threads
              </button>
            )}
          </div>
        )}

        {/* Chat View */}
        {!chatLoading && view === 'chat' && selectedChat && (
  <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-gray-100">
    {/* Modern Header with subtle glass effect */}
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView(threads.length > 1 ? 'list' : 'form')}
          className="text-blue-600 text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {threads.length > 1 ? 'All Threads' : 'New Ticket'}
        </button>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
          B
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-lg truncate">
            {extractSubject(selectedChat)}
          </p>
          <p className="text-sm text-green-600 font-medium">Support • Usually replies quickly</p>
        </div>
      </div>
    </div>

    {/* Messages Area - Modern bubble design */}
    <div 
      className="flex-1 overflow-y-auto px-4 pt-6"
      style={{ 
        paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 6rem), 9rem)' 
      }}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((msg: any, index) => {
          const isUser = msg.senderId === userId;
          const showAvatar = !isUser && (index === 0 || messages[index - 1]?.senderId === userId);

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}
            >
              {/* Bot/Support Avatar - only show on first or after user message */}
              {!isUser && showAvatar && (
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 mb-6">
                  B
                </div>
              )}
              {(!isUser && !showAvatar) && <div className="w-9 flex-shrink-0" />}

              {/* Message Bubble */}
              <div
                className={`relative max-w-[75%] px-5 py-4 rounded-3xl shadow-lg transition-all hover:scale-[1.01] ${
                  isUser
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}
              >
                {/* Sender Name - only for non-user */}
                {!isUser && (
                  <p className="text-xs font-bold text-red-600 mb-1">
                    {getSenderName(msg)}
                  </p>
                )}

                {/* Message Text */}
                <p className="text-base leading-relaxed break-words whitespace-pre-wrap">
                  {msg.message}
                </p>

                {/* Timestamp */}
                <p className={`text-xs mt-2 ${isUser ? 'text-red-200' : 'text-gray-500'} text-right`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>

                {/* Tail for bubble */}
                <div
                  className={`absolute bottom-0 w-3 h-3 ${
                    isUser
                      ? 'right-0 -mr-1 bg-red-700'
                      : 'left-0 -ml-1 bg-white border-b border-l border-gray-200'
                  } rotate-45 transform`}
                />
              </div>

              {/* User avatar - only on last message */}
              {isUser && index === messages.length - 1 && (
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md mb-6">
                  Y
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>

    {/* Modern Input Bar - Glassmorphism + floating feel */}
    <div
      className="fixed bottom-0 left-0 right-0 sm:right-auto sm:w-96 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-2xl"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
    >
      <form onSubmit={handleSendMessage} className="px-4 py-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full px-6 py-4 bg-gray-100 rounded-full text-base placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all shadow-inner"
            autoFocus
          />
          {/* Optional: Add emoji button later */}
          {/* <button className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <SmileIcon className="w-6 h-6" />
          </button> */}
        </div>

        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  </div>
)}

        {/* Empty State */}
        {!chatLoading && threads.length === 0 && view === 'list' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquareIcon className="w-20 h-20 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-6">No support threads yet.</p>
            <button
              onClick={() => setView('form')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
            >
              Create Your First Ticket
            </button>
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