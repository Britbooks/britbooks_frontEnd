import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MapPin, Send, MessageSquare, 
  ArrowRight, Clock, ShieldCheck, Globe2
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [londonTime, setLondonTime] = useState('');

  // Keeps a live clock for that "Boutique UK" feel
  useEffect(() => {
    const timer = setInterval(() => {
      setLondonTime(new Intl.DateTimeFormat('en-GB', {
        timeStyle: 'short',
        timeZone: 'Europe/London',
      }).format(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      <TopBar />

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* --- Header: Simple & Bold --- */}
        <header className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6">
                How can we <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">help?</span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed">
                Whether you're looking for a specific title or need help with a delivery, our London-based team is ready to assist.
              </p>
            </div>
            
            {/* Boutique Status Card */}
            <div className="hidden md:flex flex-col items-end">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Active</p>
                  <p className="text-sm font-bold text-slate-900">{londonTime} London Time</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Communication Hub (Bento Style) */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-4">
            
            {/* Quick Contact Card */}
            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white group">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 opacity-70">Direct Contact</h3>
              <div className="space-y-6">
                <a href="mailto:support@britbooks.co.uk" className="flex items-center gap-4 hover:translate-x-2 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Mail size={18} /></div>
                  <span className="font-bold">support@britbooks.co.uk</span>
                </a>
                <a href="tel:+442012345678" className="flex items-center gap-4 hover:translate-x-2 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Phone size={18} /></div>
                  <span className="font-bold">+44 (0) 20 1234 5678</span>
                </a>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-slate-400">Head Office</h3>
              <p className="font-bold text-lg leading-snug mb-4">123 Book Street<br/>London, EC1A 1BB</p>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
                Get Directions <ArrowRight size={14} />
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center text-center">
                <ShieldCheck size={24} className="text-slate-300 mb-2" />
                <span className="text-[9px] font-black uppercase text-slate-500">Secure Data</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Globe2 size={24} className="text-slate-300 mb-2" />
                <span className="text-[9px] font-black uppercase text-slate-500">Global Shipping</span>
              </div>
            </div>
          </div>

          {/* Right: The Modern Form */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-slate-100/50">
            <div className="flex items-center gap-2 mb-10">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Send an Enquiry</h2>
            </div>

            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <input 
                    type="text" 
                    id="name"
                    className="peer w-full py-3 bg-transparent border-b-2 border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors placeholder-transparent" 
                    placeholder="Full Name"
                  />
                  <label htmlFor="name" className="absolute left-0 -top-3.5 text-slate-500 text-xs font-bold transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-indigo-600 peer-focus:text-xs">
                    Your Full Name
                  </label>
                </div>
                <div className="relative">
                  <input 
                    type="email" 
                    id="email"
                    className="peer w-full py-3 bg-transparent border-b-2 border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors placeholder-transparent" 
                    placeholder="Email"
                  />
                  <label htmlFor="email" className="absolute left-0 -top-3.5 text-slate-500 text-xs font-bold transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-indigo-600 peer-focus:text-xs">
                    Email Address
                  </label>
                </div>
              </div>

              <div className="relative pt-4">
                <textarea 
                  rows={4}
                  id="msg"
                  className="peer w-full py-3 bg-transparent border-b-2 border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors placeholder-transparent resize-none" 
                  placeholder="Message"
                />
                <label htmlFor="msg" className="absolute left-0 top-0.5 text-slate-500 text-xs font-bold transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-7 peer-focus:top-0.5 peer-focus:text-indigo-600 peer-focus:text-xs">
                  Your Message
                </label>
              </div>

              <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-tighter hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group">
                Send Message
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </div>

        </div>

        {/* --- Bottom: Why Us Section --- */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 pt-16 text-center md:text-left">
          <div className="space-y-4">
            <Clock size={32} className="text-indigo-600 mx-auto md:mx-0" />
            <h4 className="font-black text-lg">Fast Response</h4>
            <p className="text-slate-500 text-sm">We're proud of our speed. Expect a reply within one business day, usually much faster.</p>
          </div>
          <div className="space-y-4">
            <MessageSquare size={32} className="text-indigo-600 mx-auto md:mx-0" />
            <h4 className="font-black text-lg">Human Support</h4>
            <p className="text-slate-500 text-sm">Real bibliophiles, not bots. Our team actually reads and cares about your collection.</p>
          </div>
          <div className="space-y-4">
            <ShieldCheck size={32} className="text-indigo-600 mx-auto md:mx-0" />
            <h4 className="font-black text-lg">Order Protection</h4>
            <p className="text-slate-500 text-sm">Something wrong with your delivery? We provide a no-questions-asked UK return policy.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;