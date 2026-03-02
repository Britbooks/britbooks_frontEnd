import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, BookOpen, Globe, ShieldCheck, Zap, 
  BarChart3, ShoppingBag, Leaf, Search, Truck 
} from 'lucide-react';
import Footer from '../components/footer';
import Topbar from '../components/Topbar';

const AboutUs = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  // ────────────────────────────────────────────────
  //     Real data — only edit these numbers
  // ────────────────────────────────────────────────
  const rawImpactData = [
    { year: 2022, booksSaved: 1_200_000 },
    { year: 2023, booksSaved: 1_540_000 },
    { year: 2024, booksSaved: 1_980_000 },
    { year: 2025, booksSaved: 2_150_000 }, // partial year (Feb 2025)
  ];

  const maxBooks = Math.max(...rawImpactData.map(d => d.booksSaved));

  const impactStats = rawImpactData.map(item => ({
    year: String(item.year),
    saved: `${(item.booksSaved / 1_000_000).toFixed(1)}M`,
    height: `${Math.round((item.booksSaved / maxBooks) * 100)}%`,
  }));

  return (
    <>
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .graph-bar {
          transition: height 1.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .text-balance {
          text-wrap: balance;
        }
      `}</style>

      <div className="bg-[#FAFAFA] text-[#1A1A1A] min-h-screen">
        <Topbar />
        
        <main className="overflow-x-hidden">
          {/* ── Hero ──────────────────────────────────────── */}
          <section className="relative min-h-[80vh] flex items-center pt-20 pb-16 md:pb-24">
            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative z-10 reveal">
                <span className="inline-block text-red-600 font-bold tracking-widest uppercase text-sm mb-5">
                  Since 2014 • Sustainable Literacy
                </span>
                <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 text-balance">
                  Reviving Stories,<br />
                  <span className="text-red-600">Preserving</span> Our Planet
                </h1>
                <p className="text-gray-600 text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
                  BritBooks is more than a bookstore — it's a circular economy movement. 
                  We rescue pre-loved books, keep them out of landfills, and place them in new hands.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    to="/category" 
                    className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    Explore Collection <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
              
              <div className="relative reveal" style={{ transitionDelay: '0.2s' }}>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                  <img
                    src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2074&auto=format&fit=crop"
                    alt="Stack of beautiful vintage books"
                    className="w-full h-[480px] md:h-[560px] object-cover"
                  />
                </div>
                <div className="absolute -bottom-12 -left-8 glass-card p-8 rounded-3xl shadow-xl hidden md:block animate-float">
                  <p className="text-5xl font-black text-red-600">2M+</p>
                  <p className="text-gray-600 font-medium mt-1">Books saved from landfill</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Impact Graph ──────────────────────────────── */}
          <section className="py-24 bg-white border-y border-gray-100">
            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
              <div className="reveal">
                <h2 className="text-4xl md:text-5xl font-black mb-6">Measurable Impact</h2>
                <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                  Every year we rescue more books than the year before. 
                  Your purchase directly reduces paper waste and carbon emissions across the UK.
                </p>
                <div className="space-y-5">
                  <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-2xl">
                    <Leaf className="text-green-600" size={32} />
                    <p className="font-bold text-xl">≈ 920 tons of CO₂ saved</p>
                  </div>
                  <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-2xl">
                    <BarChart3 className="text-red-600" size={32} />
                    <p className="font-bold text-xl">Over 2 million books re-homed each year</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-10 md:p-12 rounded-3xl shadow-2xl reveal" style={{ transitionDelay: '0.15s' }}>
                <h3 className="text-white text-2xl font-bold mb-12 flex items-center gap-3">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  Books Saved per Year (Millions)
                </h3>
                
                <div 
                  className="flex items-end justify-between h-72 md:h-80 gap-5 md:gap-8"
                  role="img"
                  aria-label="Bar chart showing yearly books saved growth"
                >
                  {impactStats.map((item) => (
                    <div key={item.year} className="flex flex-col items-center flex-1 group relative">
                      <div 
                        className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-2xl graph-bar relative"
                        style={{ height: item.height }}
                      >
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {item.saved}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm font-medium mt-4">{item.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Book Journey ──────────────────────────────── */}
          <section className="py-24">
            <div className="container mx-auto px-6 text-center mb-16 reveal">
              <h2 className="text-4xl md:text-5xl font-black mb-5 text-balance">The Journey of Every Book</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                From rescue to your shelf — full transparency at every step.
              </p>
            </div>

            <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8 reveal">
              {[
                { icon: <Search size={28} />, title: "Sourcing", desc: "Recovered from charities, closing libraries, house clearances and overstock across the UK." },
                { icon: <ShieldCheck size={28} />, title: "Quality Check", desc: "Carefully graded by hand — condition, binding, pages, and smell all assessed." },
                { icon: <Truck size={28} />, title: "Packing & Dispatch", desc: "Stored in Milton Keynes • packed sustainably • zero single-use plastic." },
                { icon: <Globe size={28} />, title: "Carbon-Neutral Delivery", desc: "Shipped via climate-friendly carriers straight to your home or library." }
              ].map((step, i) => (
                <div 
                  key={i} 
                  className="p-8 rounded-3xl bg-white border border-gray-100 hover:border-red-200 transition-all text-center shadow-sm group reveal"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="w-14 h-14 mx-auto bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {step.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Marketplaces ──────────────────────────────── */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-10 reveal">
                <div className="max-w-md text-center md:text-left">
                  <h3 className="text-3xl font-black mb-4">Available Everywhere</h3>
                  <p className="text-gray-600">Find BritBooks quality second-hand books on all major platforms.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-10 md:gap-16 opacity-50 grayscale">
                  <div className="text-3xl font-black italic">amazon</div>
                  <div className="text-3xl font-black italic">eBay</div>
                  <div className="text-3xl font-black italic">AbeBooks</div>
                  <div className="text-3xl font-black italic">World of Books</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Values + Big Image ───────────────────────── */}
          <section className="py-24 bg-black text-white rounded-[2.5rem] mx-4 md:mx-8 mb-24 overflow-hidden relative">
            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div className="reveal">
                <h2 className="text-4xl md:text-6xl font-black mb-10 leading-tight">
                  Reading shouldn't cost the Earth.
                </h2>
                <div className="space-y-10">
                  <div className="flex gap-6">
                    <div className="text-red-500 font-black text-4xl shrink-0">01</div>
                    <div>
                      <h4 className="text-2xl font-bold mb-3">True Circular Economy</h4>
                      <p className="text-gray-300 leading-relaxed">
                        We extend the life of existing books, dramatically reducing demand for virgin paper and the emissions tied to it.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-red-500 font-black text-4xl shrink-0">02</div>
                    <div>
                      <h4 className="text-2xl font-bold mb-3">Democratising Access to Books</h4>
                      <p className="text-gray-300 leading-relaxed">
                        High-quality second-hand books at a fraction of new prices — making reading affordable for everyone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="reveal" style={{ transitionDelay: '0.3s' }}>
                <img
                  src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop"
                  alt="Warm cozy library with wooden shelves full of books"
                  className="rounded-3xl h-[500px] w-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl"
                />
              </div>
            </div>
          </section>

          {/* ── Testimonials ──────────────────────────────── */}
          <section className="pb-24 container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: "Sarah J.", location: "London", quote: "The books arrived in such incredible condition — I genuinely thought they were brand new!" },
                { name: "Marcus T.", location: "Manchester", quote: "Beautiful plastic-free packaging and fast delivery. Will be buying again." },
                { name: "Elena R.", location: "Edinburgh", quote: "Finally found a long out-of-print first edition I've wanted for years — thank you!" }
              ].map((t, i) => (
                <div 
                  key={i} 
                  className="glass-card p-10 rounded-3xl border border-gray-200 hover:border-red-400 transition-colors reveal"
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <div className="flex gap-1 text-red-600 mb-5 text-2xl">
                    {'★★★★★'}
                  </div>
                  <p className="text-lg italic text-gray-700 mb-6 leading-relaxed">“{t.quote}”</p>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.location}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Final CTA ─────────────────────────────────── */}
          <section className="container mx-auto px-6 mb-32 reveal">
            <div className="bg-red-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black mb-6">Join the Movement</h2>
                <p className="text-red-100 text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
                  Get 10% off your first order + early access to rare and collectible arrivals.
                </p>
                <Link 
                  to="/signup" 
                  className="bg-white text-black px-12 py-6 rounded-full font-black text-xl hover:bg-black hover:text-white transition-all inline-flex items-center gap-3 shadow-2xl hover:scale-105"
                >
                  Start Reading Sustainably
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AboutUs;