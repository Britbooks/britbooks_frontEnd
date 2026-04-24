"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  User, Lock, Bell, LogOut, Camera, ShieldCheck,
  Mail, Phone, Eye, EyeOff, Trash2, Activity,
  Check, AlertCircle, ChevronRight, Loader2, Star, BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { JwtPayload } from "../types/auth";
import SEOHead from '../components/SEOHead';
import { getUserReviews, deleteReview, Review } from '../services/reviewService';

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://britbooks-api-production-8ebd.up.railway.app";

type Tab = "profile" | "security" | "notifications" | "reviews";

/* ── My Reviews Tab ─────────────────────────────────────────────── */
const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={13}
        className={n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
      />
    ))}
  </div>
);

const MyReviewsTab: React.FC<{ userId: string | null; token: string | null }> = ({ userId, token }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async (p: number) => {
    if (!userId || !token) return;
    setLoading(true);
    try {
      const res = await getUserReviews(userId, token, p, 8);
      setReviews(res.reviews);
      setPage(res.page);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [userId, token]);

  const handleDelete = async (reviewId: string) => {
    if (!token) return;
    setDeletingId(reviewId);
    try {
      await deleteReview(reviewId, token);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      // silently ignore — toast shown by service
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) return (
    <div className="space-y-3 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
          <div className="h-3 w-1/3 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );

  if (reviews.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <BookOpen className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-500 mb-1">No reviews yet</p>
      <p className="text-xs text-gray-400 mb-4">Start reading and share your thoughts!</p>
      <Link to="/explore" className="text-xs font-bold text-[#0a1628] underline hover:no-underline">Browse books</Link>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 font-semibold pb-1">{total} review{total !== 1 ? "s" : ""}</p>

      {reviews.map((review) => {
        const listingId = typeof review.listing === "object" ? (review.listing as any)._id : review.listing;
        const bookTitle = typeof review.listing === "object" ? (review.listing as any).title : null;

        return (
          <div key={review._id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {bookTitle ? (
                  <Link
                    to={`/browse/${listingId}`}
                    className="text-sm font-bold text-[#0a1628] hover:underline truncate block"
                  >
                    {bookTitle}
                  </Link>
                ) : (
                  <Link
                    to={`/browse/${listingId}`}
                    className="text-sm font-bold text-[#0a1628] hover:underline"
                  >
                    View book →
                  </Link>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <StarDisplay rating={review.rating} />
                  <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                  {review.isVerifiedPurchase && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Verified</span>
                  )}
                  {!review.isApproved && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Pending</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(review._id)}
                disabled={deletingId === review._id}
                className="p-1.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 flex-shrink-0"
                title="Delete review"
              >
                {deletingId === review._id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {review.comment?.trim() || <span className="italic text-gray-300">No comment written</span>}
            </p>
          </div>
        );
      })}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => load(page - 1)} disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
            Previous
          </button>
          <span className="text-xs text-gray-400">{page} / {pages}</span>
          <button onClick={() => load(page + 1)} disabled={page === pages}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const AccountSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [userData, setUserData]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [status, setStatus]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [modal, setModal]         = useState<null | "logout" | "delete">(null);

  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength]       = useState(0);

  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext must be used within AuthProvider");
  const { auth, logout } = context;

  const [profile, setProfile] = useState({ name: "", email: "", phone: "", is2FA: false });
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [notifPrefs, setNotifPrefs] = useState({ orders: true, newsletter: false, security: true });

  useEffect(() => {
    const load = async () => {
      if (!auth.token) { setLoading(false); return; }
      try {
        const decoded = jwtDecode<JwtPayload>(auth.token);
        const res = await axios.get(`${API_URL}/api/users/${decoded.userId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        const d = res.data;
        setUserData(d);
        setProfile({ name: d.fullName || "", email: d.email || "", phone: d.phoneNumber || "", is2FA: d.is2FA || false });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [auth.token]);

  const calcStrength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  useEffect(() => { setStrength(calcStrength(password.next)); }, [password.next]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (password.next && password.next !== password.confirm) {
      setStatus({ ok: false, msg: "Passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      const body: any = { fullName: profile.name, phoneNumber: profile.phone, is2FA: profile.is2FA };
      if (password.next) body.password = password.next;
      const res = await axios.put(`${API_URL}/api/users/${userData._id}`, body, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setUserData(res.data);
      setStatus({ ok: true, msg: "Changes saved successfully." });
      setPassword({ next: "", confirm: "" });
    } catch (err: any) {
      setStatus({ ok: false, msg: err.response?.data?.message || "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  const navItems: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: "profile",       label: "Profile",       icon: User,        desc: "Name, email, phone"     },
    { id: "security",      label: "Security",      icon: Lock,        desc: "Password, 2FA"          },
    { id: "notifications", label: "Notifications", icon: Bell,        desc: "Email preferences"      },
    { id: "reviews",       label: "My Reviews",    icon: Star,        desc: "Your book reviews"      },
  ];

  /* ── Skeleton ── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <TopBar />
      {/* Mobile skeleton */}
      <div className="lg:hidden px-4 py-6 space-y-4">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
      {/* Desktop skeleton */}
      <div className="hidden lg:flex max-w-6xl mx-auto px-6 py-16 gap-8">
        <div className="w-64 shrink-0 space-y-3">
          {[80, 56, 56, 56].map((h, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl animate-pulse" style={{ height: h }} />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-[500px] bg-gray-200 rounded-3xl animate-pulse" />
        </div>
      </div>
      <Footer />
    </div>
  );

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <SEOHead title="Account Settings" description="Manage your BritBooks account settings and preferences." canonical="/settings" noindex={true} />
      <TopBar />

      {/* ══════════════════════════════════════════
          MOBILE HEADER (hidden on desktop)
      ══════════════════════════════════════════ */}
      <div className="lg:hidden bg-white border-b border-gray-100">
        {/* Avatar + user info */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-100">
              <img
                src={userData?.profilePicture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData?.fullName}`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center cursor-pointer shadow-sm hover:bg-red-700 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={() => {}} />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-base truncate">{userData?.fullName}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{userData?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <Activity className="w-2.5 h-2.5" /> Verified
            </span>
          </div>
          <button onClick={() => setModal("logout")}
            className="shrink-0 p-2.5 rounded-xl border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-colors group">
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>

        {/* Mobile tab bar */}
        <div className="flex border-t border-gray-100">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-bold transition-all border-b-2 ${
                activeTab === id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-12">
        {/* Desktop page title */}
        <div className="hidden lg:block mb-10">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-3xl font-black text-gray-900">Settings</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* ── SIDEBAR (desktop only) ── */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 space-y-3">
            {/* Avatar card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-100">
                  <img
                    src={userData?.profilePicture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData?.fullName}`}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center cursor-pointer shadow-sm hover:bg-red-700 transition-colors">
                  <Camera className="w-3 h-3 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={() => {}} />
                </label>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{userData?.fullName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{userData?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <Activity className="w-2.5 h-2.5" /> Verified
                </span>
              </div>
            </div>

            {/* Nav */}
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {navItems.map(({ id, label, icon: Icon, desc }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-gray-50 last:border-0 ${
                    activeTab === id
                      ? 'bg-red-50 border-l-2 border-l-red-600'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  }`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === id ? 'bg-red-600' : 'bg-gray-100'}`}>
                    <Icon className={`w-4 h-4 ${activeTab === id ? 'text-white' : 'text-gray-500'}`} />
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${activeTab === id ? 'text-red-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  {activeTab === id && <ChevronRight className="w-3.5 h-3.5 text-red-400 ml-auto shrink-0" />}
                </button>
              ))}

              <div className="border-t border-gray-100">
                <button onClick={() => setModal("logout")}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-50 transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
                    <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors" />
                  </span>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors">Sign out</p>
                </button>
              </div>
            </nav>

            {/* Danger zone */}
            <button onClick={() => setModal("delete")}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-semibold">
              <Trash2 className="w-4 h-4" /> Delete account
            </button>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <form onSubmit={handleSave} className="flex-1 min-w-0 w-full space-y-4">

            {/* Status banner */}
            {status && (
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-medium ${
                status.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {status.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {status.msg}
              </div>
            )}

            {/* ══ PROFILE TAB ══════════════════════════════ */}
            {activeTab === "profile" && (
              <>
                <Section title="Personal information" desc="Update your display name and contact details.">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Full name" icon={User}>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-3 focus:ring-red-50 transition-all placeholder:text-gray-300"
                        placeholder="Your full name"
                      />
                    </Field>

                    <Field label="Email address" icon={Mail} hint="Email cannot be changed. Contact support if needed.">
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed gap-2">
                        <input
                          type="email"
                          value={profile.email}
                          readOnly
                          className="flex-1 bg-transparent text-sm text-gray-400 outline-none cursor-not-allowed"
                        />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Locked</span>
                      </div>
                    </Field>

                    <Field label="Phone number" icon={Phone} className="sm:col-span-2">
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-3 focus:ring-red-50 transition-all placeholder:text-gray-300"
                        placeholder="+44 7123 456 789"
                      />
                    </Field>
                  </div>
                </Section>

                <SaveBar saving={saving} />
              </>
            )}

            {/* ══ SECURITY TAB ════════════════════════════ */}
            {activeTab === "security" && (
              <>
                {/* 2FA */}
                <Section title="Two-factor authentication" desc="Add an extra layer of security to your account.">
                  <div className="flex items-center justify-between p-5 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Authenticator app</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {profile.is2FA ? 'Enabled — your account is protected' : 'Disabled — click to enable'}
                        </p>
                      </div>
                    </div>
                    <Toggle checked={profile.is2FA} onChange={v => setProfile(p => ({ ...p, is2FA: v }))} />
                  </div>
                </Section>

                {/* Password */}
                <Section title="Change password" desc="Use a strong password with 8+ characters, numbers and symbols.">
                  <div className="space-y-4">
                    <Field label="New password" icon={Lock}>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          value={password.next}
                          onChange={e => setPassword({ ...password, next: e.target.value })}
                          className="w-full px-4 py-3 pr-12 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-3 focus:ring-red-50 transition-all placeholder:text-gray-300"
                          placeholder="New password"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password.next && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex gap-1">
                            {[1,2,3,4].map(i => (
                              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          <p className={`text-xs font-semibold ${strength >= 3 ? 'text-emerald-600' : strength === 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {strengthLabel[strength]}
                          </p>
                        </div>
                      )}
                    </Field>

                    <Field label="Confirm password" icon={Lock}>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={password.confirm}
                          onChange={e => setPassword({ ...password, confirm: e.target.value })}
                          className={`w-full px-4 py-3 pr-12 text-sm text-gray-800 bg-white border rounded-xl focus:outline-none focus:ring-3 transition-all placeholder:text-gray-300 ${
                            password.confirm && password.confirm !== password.next
                              ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
                              : 'border-gray-200 focus:border-red-400 focus:ring-red-50'
                          }`}
                          placeholder="Confirm new password"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password.confirm && password.confirm !== password.next && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords do not match</p>
                      )}
                    </Field>
                  </div>
                </Section>

                <SaveBar saving={saving} />
              </>
            )}

            {/* ══ NOTIFICATIONS TAB ═══════════════════════ */}
            {activeTab === "notifications" && (
              <>
                <Section title="Email notifications" desc="Choose which emails you'd like to receive from BritBooks.">
                  <div className="divide-y divide-gray-100">
                    {[
                      {
                        key: 'orders' as const,
                        icon: Activity,
                        title: 'Order updates',
                        desc: 'Dispatch confirmations, tracking info, and delivery notifications.',
                      },
                      {
                        key: 'newsletter' as const,
                        icon: Bell,
                        title: 'Weekly newsletter',
                        desc: 'New arrivals, curated picks, and literary recommendations.',
                      },
                      {
                        key: 'security' as const,
                        icon: ShieldCheck,
                        title: 'Security alerts',
                        desc: 'Login activity, password changes, and account security events.',
                      },
                    ].map(({ key, icon: Icon, title, desc }) => (
                      <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <span className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-gray-500" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 max-w-sm">{desc}</p>
                          </div>
                        </div>
                        <Toggle
                          checked={notifPrefs[key]}
                          onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </Section>

                <SaveBar saving={saving} />
              </>
            )}

            {/* ══ MY REVIEWS TAB ══════════════════════════ */}
            {activeTab === "reviews" && (
              <MyReviewsTab userId={auth.userId} token={auth.token} />
            )}
          </form>
        </div>

        {/* Mobile danger zone */}
        <div className="lg:hidden mt-6 pb-8">
          <button onClick={() => setModal("delete")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-semibold">
            <Trash2 className="w-4 h-4" /> Delete account
          </button>
        </div>
      </div>

      <Footer />

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
              modal === 'logout' ? 'bg-gray-100' : 'bg-red-50'
            }`}>
              {modal === 'logout'
                ? <LogOut className="w-5 h-5 text-gray-600" />
                : <Trash2 className="w-5 h-5 text-red-600" />
              }
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">
              {modal === 'logout' ? 'Sign out?' : 'Delete account?'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {modal === 'logout'
                ? 'You will be signed out of your account. You can always sign back in.'
                : 'This is permanent and cannot be undone. All your data will be deleted.'}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-7">
              <button onClick={() => setModal(null)}
                className="py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { if (modal === 'logout') logout(); setModal(null); }}
                className={`py-3 text-sm font-semibold rounded-xl transition-colors ${
                  modal === 'logout'
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}>
                {modal === 'logout' ? 'Sign out' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Reusable sub-components ─────────────────────────────── */
const Section = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-100">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Field = ({ label, icon: Icon, hint, className, children }: {
  label: string; icon: React.ElementType; hint?: string; className?: string; children: React.ReactNode;
}) => (
  <div className={`space-y-1.5 ${className ?? ''}`}>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      <Icon className="w-3.5 h-3.5" /> {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const SaveBar = ({ saving }: { saving: boolean }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="lg:hidden" />
    <button type="submit" disabled={saving}
      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-red-600 active:scale-[0.98] text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-60">
      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save changes'}
    </button>
  </div>
);

export default AccountSettingsPage;
