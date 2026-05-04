import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Package, Globe, Clock, Mail, RefreshCw,
  ShieldCheck, CheckCircle, ArrowRight, ChevronDown, Zap,
} from 'lucide-react';
import TopBar from '../components/Topbar';
import Footer from '../components/footer';
import SEOHead from '../components/SEOHead';

/* ─────────────────────────────────────────────────────────── */
/*  Data                                                        */
/* ─────────────────────────────────────────────────────────── */

const shippingOptions = [
  {
    id: 'standard',
    Icon: Truck,
    label: 'Standard',
    speed: '3–5 Business Days',
    price: 'From £2.99',
    highlight: 'Free over £15',
    color: '#c9a84c',
    bullets: [
      'Dispatched within one business day',
      'Royal Mail or DPD tracked delivery',
      'Signature required on orders over £50',
      'Available to all UK mainland addresses',
    ],
  },
  {
    id: 'express',
    Icon: Zap,
    label: 'Express',
    speed: '1–2 Business Days',
    price: 'From £5.99',
    highlight: 'Order before 1 pm',
    color: '#e86c2c',
    bullets: [
      'Same-day dispatch Mon–Fri before 1 pm',
      'DPD delivery with a one-hour window',
      'Full end-to-end tracking included',
      'Available on the vast majority of stock',
    ],
  },
  {
    id: 'international',
    Icon: Globe,
    label: 'International',
    speed: '7–14 Business Days',
    price: 'Calculated at checkout',
    highlight: 'Ships worldwide',
    color: '#3b82f6',
    bullets: [
      'Europe, USA, Canada, Australia & more',
      'No hidden fees — cost shown at checkout',
      'Tracking provided where carrier allows',
      'Customs duties are the buyer\'s responsibility',
    ],
  },
];

const returnSteps = [
  {
    n: '01',
    Icon: Mail,
    title: 'Email us',
    body: <>Email <a href="mailto:support@britbooks.co.uk" className="text-[#c9a84c] font-semibold hover:underline">support@britbooks.co.uk</a> with your order number and reason for return.</>,
  },
  {
    n: '02',
    Icon: Package,
    title: 'Receive your RMA',
    body: "We will send a Return Merchandise Authorisation number and full packing instructions within one business day.",
  },
  {
    n: '03',
    Icon: RefreshCw,
    title: 'Ship it back',
    body: 'Pack the item securely, write the RMA number on the outside, and post within 14 days of receiving it.',
  },
  {
    n: '04',
    Icon: CheckCircle,
    title: 'Refund issued',
    body: 'Once we receive and inspect the item, your refund is processed in 5–7 business days.',
  },
];

const returnConditions = [
  'Books must be unused and in resalable condition.',
  'Return within 30 days of delivery.',
  'Include your order number or receipt.',
  'Personalised items cannot be returned.',
  'You cover return shipping unless the item was damaged or defective.',
  'Original outbound shipping costs are non-refundable.',
  'Items returned without an RMA number may face delays or refusal.',
];

/* ─────────────────────────────────────────────────────────── */
/*  Sub-components                                              */
/* ─────────────────────────────────────────────────────────── */

const ShippingCard = ({
  opt,
  open,
  toggle,
}: {
  opt: (typeof shippingOptions)[0];
  open: boolean;
  toggle: () => void;
}) => (
  <div
    className="bg-white rounded-2xl border border-[#e8e0d0] overflow-hidden shadow-sm transition-shadow hover:shadow-md"
    style={{ borderTop: `3px solid ${opt.color}` }}
  >
    {/* Always-visible header */}
    <div className="px-6 pt-6 pb-4 flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${opt.color}18` }}
      >
        <opt.Icon className="w-5 h-5" style={{ color: opt.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: opt.color }}>
            {opt.label}
          </span>
          <span className="text-[10px] font-bold text-[#0a1628]/40 bg-[#f5f0e8] border border-[#e8e0d0] rounded-full px-2.5 py-0.5">
            {opt.speed}
          </span>
        </div>
        <p className="text-lg font-black text-[#0a1628] leading-tight">{opt.price}</p>
        <p className="text-xs text-[#0a1628]/50 mt-0.5">{opt.highlight}</p>
      </div>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="shrink-0 mt-0.5 w-7 h-7 rounded-full border border-[#e8e0d0] flex items-center justify-center text-[#0a1628]/30 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>

    {/* Expandable detail */}
    <div
      className="overflow-hidden transition-all duration-300"
      style={{ maxHeight: open ? '400px' : '0px' }}
    >
      <div className="px-6 pb-6 border-t border-[#e8e0d0] pt-4">
        <ul className="space-y-2.5">
          {opt.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#0a1628]/70">
              <span
                className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${opt.color}18`, border: `1px solid ${opt.color}40` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.color }} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────── */
/*  Page                                                        */
/* ─────────────────────────────────────────────────────────── */

const ShippingReturnsPage: React.FC = () => {
  const [openCard, setOpenCard] = useState<string | null>('standard');

  const toggle = (id: string) => setOpenCard(prev => (prev === id ? null : id));

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#f5f0e8' }}>
      <SEOHead
        title="Shipping & Returns"
        description="Learn about BritBooks shipping options, delivery times, and our hassle-free 30-day returns policy for all book orders."
        canonical="/shipping-returns"
      />
      <TopBar />

      {/* ── Hero ── */}
      <header className="bg-[#0a1628] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 80px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 80px)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-5 pt-14 pb-20 text-center">
          <div className="inline-flex items-center gap-2 border border-[#c9a84c]/25 bg-[#c9a84c]/8 rounded-full px-4 py-1.5 mb-5">
            <Truck className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-xs text-[#c9a84c] font-semibold tracking-wide">UK &amp; International Delivery</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-4">
            Shipping &amp; <span className="text-black">Returns</span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-sm mx-auto mb-10">
            Everything you need to know — from choosing a delivery option to starting a return.
          </p>

          {/* Trust stats row */}
          <div className="inline-grid grid-cols-3 divide-x divide-white/10 border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
            {[
              { label: 'Free shipping', value: 'Over £15' },
              { label: 'Next-day dispatch', value: 'Order by 1 pm' },
              { label: 'Easy returns', value: '30-Day window' },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-4 text-center">
                <p className="text-black font-black text-base sm:text-lg leading-none">{value}</p>
                <p className="text-black text-[11px] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* wave divider */}
        <div
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{ backgroundColor: '#f5f0e8', clipPath: 'ellipse(55% 100% at 50% 100%)' }}
        />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 pb-20 space-y-14">

        {/* ── Delivery Options ── */}
        <section>
          <div className="mb-6">
            <p className="text-[10px] font-black text-[#0a1628]/40 uppercase tracking-widest mb-1.5">Delivery Options</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0a1628]">How fast will my order arrive?</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {shippingOptions.map(opt => (
              <ShippingCard
                key={opt.id}
                opt={opt}
                open={openCard === opt.id}
                toggle={() => toggle(opt.id)}
              />
            ))}
          </div>

          {/* Dispatch note */}
          <div className="mt-5 flex items-start gap-3 bg-white border border-[#e8e0d0] rounded-xl px-4 py-3.5 shadow-sm">
            <Clock className="w-4 h-4 text-[#0a1628]/40 mt-0.5 shrink-0" />
            <p className="text-sm text-[#0a1628]/60">
              <strong className="text-[#0a1628]">Dispatch cut-off:</strong> orders placed before 1 pm Monday–Friday are dispatched the same day. Orders placed after 1 pm or on weekends are dispatched the next business day.
            </p>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[#e8e0d0]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0a1628]/30">Returns Policy</span>
          <div className="flex-1 h-px bg-[#e8e0d0]" />
        </div>

        {/* ── Returns ── */}
        <section className="space-y-8">
          <div>
            <p className="text-[10px] font-black text-[#0a1628]/40 uppercase tracking-widest mb-1.5">30-Day Hassle-Free Returns</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0a1628]">Need to return something?</h2>
            <p className="text-[#0a1628]/55 text-sm mt-2 max-w-xl">
              Return most unused books within 30 days of delivery for a full refund or exchange. Items must be in their original, resalable condition.
            </p>
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {returnSteps.map((step, idx) => (
              <div key={step.n} className="bg-white rounded-2xl border border-[#e8e0d0] p-5 shadow-sm relative">
                {/* connector line on desktop */}
                {idx < returnSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2 w-4 h-px bg-[#e8e0d0] z-10" />
                )}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0a1628] flex items-center justify-center">
                    <step.Icon className="w-4 h-4 text-[#c9a84c]" />
                  </div>
                  <span className="text-[10px] font-black text-[#0a1628]/25 tracking-widest">{step.n}</span>
                </div>
                <p className="font-bold text-[#0a1628] text-sm mb-1.5">{step.title}</p>
                <p className="text-xs text-[#0a1628]/55 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

          {/* Start a Return CTA */}
          <a
            href="mailto:support@britbooks.co.uk"
            className="inline-flex items-center gap-2.5 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            <Mail className="w-4 h-4" />
            Start a Return
            <ArrowRight className="w-4 h-4" />
          </a>

          {/* Conditions */}
          <div className="bg-white border border-[#e8e0d0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#f5f0e8] border border-[#e8e0d0] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#0a1628]/50" />
              </div>
              <h3 className="font-bold text-[#0a1628] text-sm">Return Conditions</h3>
            </div>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {returnConditions.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#0a1628]/65">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <div className="bg-[#0a1628] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest mb-1.5">Still unsure?</p>
            <p className="text-black font-bold text-base leading-snug">
              Our team is happy to help with any shipping or returns query.
            </p>
            <p className="text-white/40 text-sm mt-1">Usually replies within a few hours on business days.</p>
          </div>
          <Link
            to="/contact"
            className="shrink-0 inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] text-sm font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            <Mail className="w-4 h-4" />
            Contact Us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default ShippingReturnsPage;
