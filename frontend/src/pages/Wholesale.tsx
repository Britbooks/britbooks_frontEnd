import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Building2, Send, ShieldCheck, Truck, Boxes, BookOpen,
  CheckCircle, MessageSquare, FileText, Package,
  Sparkles, ChevronDown, Mail, Phone, Download, ArrowRight,
  Baby, GraduationCap, Feather, Landmark, HeartHandshake, Trophy,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

const API_BASE_URL = 'https://britbooks-api-production-8ebd.up.railway.app/api';

const BUSINESS_TYPES = [
  { value: 'bookshop', label: 'Independent bookshop' },
  { value: 'library',  label: 'Library' },
  { value: 'school',   label: 'School / University' },
  { value: 'reseller', label: 'Online reseller' },
  { value: 'charity',  label: 'Charity / Non-profit' },
  { value: 'other',    label: 'Other' },
];

const METRICS = [
  { value: '500+',     label: 'Trade customers'      },
  { value: '2M+',      label: 'Titles in stock'      },
  { value: '5 days',   label: 'Typical dispatch'     },
  { value: 'Up to 35%', label: 'Off retail at volume' },
];

const PRICING = [
  { units: '100 – 499',      discount: '15%',     lead: '3–5 days', shipping: 'Free UK' },
  { units: '500 – 1,999',    discount: '25%',     lead: '5–7 days', shipping: 'Free UK' },
  { units: '2,000 – 9,999',  discount: '35%',     lead: '7–10 days', shipping: 'Free UK' },
  { units: '10,000+',        discount: 'Bespoke', lead: 'On quote',  shipping: 'Free UK + intl. on request' },
];

const CATEGORIES = [
  { Icon: BookOpen,        label: 'General fiction',      count: '620k titles' },
  { Icon: Feather,         label: 'Non-fiction',          count: '410k titles' },
  { Icon: Baby,            label: "Children's books",     count: '380k titles' },
  { Icon: GraduationCap,   label: 'Textbooks & academic', count: '250k titles' },
  { Icon: Landmark,        label: 'History & politics',   count: '180k titles' },
  { Icon: Trophy,          label: 'Sports & leisure',     count: '90k titles' },
  { Icon: HeartHandshake,  label: 'Self-help & wellbeing', count: '110k titles' },
  { Icon: Sparkles,        label: 'Rare & collectible',   count: '35k titles' },
];

const HOW_IT_WORKS = [
  { Icon: MessageSquare, title: 'Submit an enquiry', body: 'Complete the form with your business details and volume requirements.' },
  { Icon: FileText,      title: 'Receive a quote',   body: 'Trade team responds within one business day with tiered pricing.' },
  { Icon: Package,       title: 'Confirm and pay',   body: 'Approve the quote — first order is upfront, later orders can be net-30.' },
  { Icon: Truck,         title: 'Dispatch',          body: 'Books are picked, graded and packed at our UK warehouse.' },
];

const FAQ = [
  { q: 'What is the minimum wholesale order?', a: 'Tiered pricing starts at 100 units per order. Below that we point trade buyers to our retail catalogue.' },
  { q: 'Can I pick specific titles?',          a: 'Yes. Order a mixed condition-graded pallet for the deepest discount, or send us a shortlist of ISBNs and we\'ll price against current stock.' },
  { q: 'How is condition graded?',             a: 'Every book is hand-inspected and graded New / Like New / Very Good / Good / Acceptable. Grade breakdown is agreed with you before dispatch.' },
  { q: 'Do you ship internationally?',         a: 'Yes — Europe, US, Australia and beyond, quoted per order. UK dispatch is included in your bulk quote.' },
  { q: 'What payment terms do you offer?',     a: 'First order is upfront. Once we\'ve worked together we can offer net-30 subject to a short credit check.' },
  { q: 'Can I return unsold stock?',           a: 'Bulk pre-loved orders are non-returnable, but we always replace anything mis-graded or damaged in transit.' },
];

const TOC = [
  { id: 'overview',   label: 'Overview'         },
  { id: 'enquire',    label: 'Get a quote'      },
  { id: 'pricing',    label: 'Volume pricing'   },
  { id: 'process',    label: 'How it works'     },
  { id: 'catalogue',  label: 'Catalogue'        },
  { id: 'faq',        label: 'FAQ'              },
  { id: 'contact',    label: 'Contact'          },
];

const WholesalePage: React.FC = () => {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: 'United Kingdom',
    businessType: 'bookshop',
    expectedVolume: '',
    interests: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [heroBg] = useState(() => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/1600/900`);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setActiveSection(e.target.id); break; }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    TOC.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.companyName.trim())  { toast.error('Please enter your company name.'); return false; }
    if (!form.contactName.trim())  { toast.error('Please enter your name.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) { toast.error('Please enter a valid email address.'); return false; }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/wholesale/enquiries`, form);
      setSubmitted(true);
      toast.success('Enquiry received — we\'ll be in touch shortly.');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <SEOHead
        title="Wholesale — BritBooks"
        description="Buy pre-loved books in bulk from BritBooks. Tiered pricing for bookshops, libraries, schools and resellers."
      />
      <TopBar />
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '8px', fontWeight: 600, fontSize: '13px' } }} />

      {/* Hero — matches Popular Books layout */}
      <header
        className="relative pt-14 pb-12 px-6 md:px-8 overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/55 to-black/35" />
        <div className="relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
            <div>
              <span className="text-white font-black uppercase tracking-[0.3em] mb-2 block">
                BritBooks Trade
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-xl">
                Wholesale
              </h1>
              <p className="text-white/80 text-sm sm:text-base mt-3 max-w-xl">
                Bulk supply of condition-graded pre-loved books for bookshops, libraries, schools and online resellers.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-wrap gap-3">
              <a href="#enquire" className="inline-flex items-center gap-2 bg-[#c9a84c] text-black font-black text-sm px-6 py-3 rounded-xl hover:bg-[#c9a84c]/90 transition-colors">
                Get a quote <ArrowRight className="w-4 h-4" />
              </a>
              <a href="mailto:trade@britbooks.co.uk" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                <Mail className="w-4 h-4" /> Contact trade
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Two-column layout: sticky TOC + content */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 border-l border-gray-200 pl-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">On this page</div>
              <ul className="space-y-1">
                {TOC.map(item => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`block text-sm py-1.5 border-l-2 -ml-4 pl-4 transition-colors ${
                        activeSection === item.id
                          ? 'border-[#0a1628] text-[#0a1628] font-bold'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a href="#" onClick={(e) => e.preventDefault()} className="mt-8 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900">
                <Download className="w-3.5 h-3.5" /> Trade brochure (PDF)
              </a>
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0 space-y-20">

            {/* Overview */}
            <Section id="overview" title="Overview">
              <p className="text-base leading-relaxed text-gray-700 max-w-3xl">
                BritBooks operates one of the UK's largest pre-loved book warehouses. Trade customers buy from us to stock their shelves, resell online, populate school and library collections, or supply pallets to charity operations. Every title is condition-graded before it ships.
              </p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 border-t border-l border-gray-200">
                {METRICS.map(m => (
                  <div key={m.label} className="border-r border-b border-gray-200 p-5">
                    <div className="text-2xl sm:text-3xl font-black text-[#0a1628] tracking-tight">{m.value}</div>
                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <FeatureRow Icon={Boxes}       title="Bulk pricing"       body="Tiered discounts scale with order size. Deepest breaks at 2k+ units." />
                <FeatureRow Icon={ShieldCheck} title="Condition graded"   body="Five-grade system, hand-inspected. Grade mix agreed pre-dispatch." />
                <FeatureRow Icon={Truck}       title="UK-wide dispatch"   body="Pallet or parcel from our UK warehouse. International on request." />
                <FeatureRow Icon={BookOpen}    title="Millions of titles" body="Fiction, non-fiction, children's, academic and rare inventory." />
              </div>
            </Section>

            {/* Enquiry form + image */}
            <Section id="enquire" title="Get a quote" subtitle="Reply within one business day.">
              <div className="grid lg:grid-cols-2 gap-6 items-stretch">
                <div>
                  {submitted ? (
                    <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-black text-gray-900">Enquiry received</h3>
                          <p className="text-sm text-gray-700 mt-1">A member of our trade team will be in touch shortly at <b>{form.email}</b>.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="border border-gray-200 rounded-lg">
                      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
                        <SpecInput label="Company name" name="companyName" value={form.companyName} onChange={onChange} required />
                        <SpecInput label="Your name"     name="contactName" value={form.contactName} onChange={onChange} required />
                      </div>
                      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
                        <SpecInput label="Email"   name="email" type="email" value={form.email} onChange={onChange} required />
                        <SpecInput label="Phone"   name="phone" value={form.phone} onChange={onChange} />
                      </div>
                      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
                        <SpecInput label="Country" name="country" value={form.country} onChange={onChange} />
                        <SpecSelect label="Business type" name="businessType" value={form.businessType} onChange={onChange} options={BUSINESS_TYPES} />
                      </div>
                      <SpecInput label="Expected volume" name="expectedVolume" placeholder="e.g. 500 units / month" value={form.expectedVolume} onChange={onChange} bordered />
                      <SpecInput label="Categories or titles of interest" name="interests" placeholder="e.g. children's fiction, textbooks" value={form.interests} onChange={onChange} bordered />
                      <div className="p-5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Message</label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={onChange}
                          rows={4}
                          placeholder="Anything else we should know?"
                          className="w-full text-sm text-gray-900 placeholder-gray-400 border-0 p-0 focus:outline-none focus:ring-0 resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <p className="text-xs text-gray-500">By submitting, you agree to our trade privacy terms.</p>
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center gap-2 bg-[#0a1628] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#0a1628]/90 disabled:opacity-60 transition-colors"
                        >
                          {loading ? 'Sending…' : (<><Send className="w-4 h-4" /> Send enquiry</>)}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Warehouse image column */}
                <aside className="hidden lg:block">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 h-full min-h-[520px] sticky top-24">
                    <img
                      src="https://media.istockphoto.com/id/1520505898/photo/warehouse-industrial-and-logistics-companies-commercial-warehouse-huge-distribution-warehouse.jpg?s=612x612&w=0&k=20&c=9gw8FjFxgegp5Wv0dvZGIrevWSrMXEqhV0jm9HU89Mw="
                      alt="BritBooks warehouse — pallet-scale fulfilment"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-[#0a1628]/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="inline-flex items-center gap-1.5 bg-[#c9a84c] text-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-3">
                        Our warehouse
                      </div>
                      <h3 className="text-xl font-black leading-tight">Pallet-scale, ready to ship.</h3>
                      <p className="text-white/80 text-xs mt-2 leading-relaxed">
                        Every order is picked, condition-graded and packed at our UK warehouse — most quotes dispatch within 5 working days.
                      </p>
                      <div className="mt-4 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> Same-week dispatch</div>
                        <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> Barcode-tracked picks</div>
                        <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> UK-wide couriers</div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </Section>

            {/* Pricing */}
            <Section id="pricing" title="Volume pricing" subtitle="Indicative discount tiers off retail. Every quote is customised.">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <tr>
                      <th className="text-left px-5 py-3">Order size</th>
                      <th className="text-left px-5 py-3">Discount off retail</th>
                      <th className="text-left px-5 py-3">Typical lead time</th>
                      <th className="text-left px-5 py-3">Shipping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {PRICING.map(tier => (
                      <tr key={tier.units} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-bold text-gray-900">{tier.units} units</td>
                        <td className="px-5 py-4 text-[#0a1628] font-black">{tier.discount}</td>
                        <td className="px-5 py-4 text-gray-700">{tier.lead}</td>
                        <td className="px-5 py-4 text-gray-700">{tier.shipping}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Discounts apply to mixed condition-graded stock. Bespoke title selection may adjust the tier price — we quote per order.
              </p>
            </Section>

            {/* How it works */}
            <Section id="process" title="How it works" subtitle="From enquiry to delivery, in four steps.">
              <ol className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {HOW_IT_WORKS.map((step, i) => (
                  <li key={step.title} className="flex items-start gap-5 p-5">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-[#0a1628] text-white flex items-center justify-center font-black text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-base text-gray-900 flex items-center gap-2">
                        <step.Icon className="w-4 h-4 text-gray-400" /> {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Catalogue */}
            <Section id="catalogue" title="Catalogue" subtitle="Stock breakdown across our warehouse.">
              <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-gray-200">
                {CATEGORIES.map(cat => (
                  <div key={cat.label} className="border-r border-b border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <cat.Icon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{cat.count}</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{cat.label}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Testimonial */}
            <Section id="testimonial" title="What buyers say">
              <blockquote className="border-l-4 border-[#0a1628] pl-5 py-2 max-w-3xl">
                <p className="text-lg text-gray-800 leading-relaxed">
                  "Grading is consistent, dispatch is on time, and the trade team actually reads the emails. It's the easiest wholesale relationship we have."
                </p>
                <footer className="mt-4 text-sm text-gray-500">
                  <b className="text-gray-900">Sarah H.</b> · Buying Manager, Independent Bookshop Chain
                </footer>
              </blockquote>
            </Section>

            {/* FAQ */}
            <Section id="faq" title="Frequently asked">
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {FAQ.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
              </div>
            </Section>

            {/* Contact */}
            <Section id="contact" title="Contact the trade team">
              <div className="grid sm:grid-cols-2 gap-4">
                <a href="mailto:trade@britbooks.co.uk" className="border border-gray-200 rounded-lg p-5 hover:border-[#0a1628] transition-colors flex items-start gap-4">
                  <Mail className="w-5 h-5 text-[#0a1628] mt-0.5" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</div>
                    <div className="text-base font-bold text-gray-900 mt-0.5">trade@britbooks.co.uk</div>
                    <div className="text-xs text-gray-500 mt-1">Reply within one business day.</div>
                  </div>
                </a>
                <a href="tel:+441234567890" className="border border-gray-200 rounded-lg p-5 hover:border-[#0a1628] transition-colors flex items-start gap-4">
                  <Phone className="w-5 h-5 text-[#0a1628] mt-0.5" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phone</div>
                    <div className="text-base font-bold text-gray-900 mt-0.5">+44 1234 567890</div>
                    <div className="text-xs text-gray-500 mt-1">Mon–Fri, 9am–5pm UK time.</div>
                  </div>
                </a>
              </div>
            </Section>

          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

/* ───── Section wrapper ───── */
const Section: React.FC<{ id: string; title: string; subtitle?: string; children: React.ReactNode }> = ({
  id, title, subtitle, children,
}) => (
  <section id={id} className="scroll-mt-24">
    <header className="pb-4 mb-6 border-b border-gray-200">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Section</div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 mt-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </header>
    {children}
  </section>
);

/* ───── Feature row ───── */
const FeatureRow: React.FC<{ Icon: any; title: string; body: string }> = ({ Icon, title, body }) => (
  <div className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
    <div className="w-9 h-9 rounded-md bg-[#0a1628]/5 text-[#0a1628] flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <div className="font-black text-sm text-gray-900">{title}</div>
      <div className="text-xs text-gray-600 mt-1 leading-relaxed">{body}</div>
    </div>
  </div>
);

/* ───── Spec-sheet inputs ───── */
type SpecInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  bordered?: boolean;
};
const SpecInput: React.FC<SpecInputProps> = ({ label, name, value, onChange, type = 'text', required, placeholder, bordered }) => (
  <div className={`p-5 ${bordered ? 'border-b border-gray-200' : ''}`}>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full text-sm text-gray-900 placeholder-gray-400 border-0 p-0 focus:outline-none focus:ring-0"
    />
  </div>
);

type SpecSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
};
const SpecSelect: React.FC<SpecSelectProps> = ({ label, name, value, onChange, options }) => (
  <div className="p-5">
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

/* ───── FAQ row ───── */
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-bold text-gray-900">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{a}</div>}
    </div>
  );
};

export default WholesalePage;
