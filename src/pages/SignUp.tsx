import React, { useState, useMemo, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { RegisterFormData, JwtPayload } from "../types/auth";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import {
  Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight, ArrowLeft,
  BookOpen, Star, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.522-3.447-11.019-8.158l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.018,35.258,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);
const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
  </svg>
);

/* ── Password strength ───────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (password.length > 5) s++;
    if (password.length > 7) s++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) s++;
    if (password.match(/[0-9]/)) s++;
    if (password.match(/[^a-zA-Z0-9]/)) s++;
    return s;
  }, [password]);

  const labels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];
  const barColors = [
    ["bg-gray-100", "bg-gray-100", "bg-gray-100", "bg-gray-100", "bg-gray-100"],
    ["bg-red-400", "bg-gray-100", "bg-gray-100", "bg-gray-100", "bg-gray-100"],
    ["bg-orange-400", "bg-orange-400", "bg-gray-100", "bg-gray-100", "bg-gray-100"],
    ["bg-yellow-400", "bg-yellow-400", "bg-yellow-400", "bg-gray-100", "bg-gray-100"],
    ["bg-blue-400", "bg-blue-400", "bg-blue-400", "bg-blue-400", "bg-gray-100"],
    ["bg-green-400", "bg-green-400", "bg-green-400", "bg-green-400", "bg-green-400"],
  ];
  const textColors = ["", "text-red-500", "text-orange-500", "text-yellow-600", "text-blue-500", "text-green-500"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {barColors[score].map((c, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${c}`} />
        ))}
      </div>
      <p className={`text-[10px] font-bold ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
}

/* ── OTP digit input ─────────────────────────────── */
function OtpInput({ onChange }: { onChange: (v: string) => void }) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const d = [...digits];
    d[i] = v.slice(-1);
    setDigits(d);
    onChange(d.join(""));
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const d = [...digits];
    pasted.split("").forEach((ch, i) => { d[i] = ch; });
    setDigits(d);
    onChange(d.join(""));
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-lg font-black rounded-xl border-2 outline-none transition-all ${
            digit
              ? "border-[#c9a84c] bg-[#c9a84c]/5 text-gray-900"
              : "border-gray-200 bg-gray-50 text-gray-900 focus:border-[#c9a84c]"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Input field wrapper ─────────────────────────── */
function Field({
  label, icon: Icon, error, children,
}: {
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {children}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── Main component ──────────────────────────────── */
const SignupPage = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "", email: "", phoneNumber: "", password: "", confirmPassword: "", role: "user",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext must be used within AuthProvider");
  const { auth, registerUser, verifyRegistration } = context;
  const { loading, error, token } = auth;
  const navigate = useNavigate();

  useEffect(() => {
    if (token && !showVerificationModal) setShowVerificationModal(true);
  }, [token, showVerificationModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(null);
    localStorage.setItem("signupEmail", e.target.name === "email" ? e.target.value : formData.email);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) { setFormError("Full name is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setFormError("Please enter a valid email address."); return false; }
    if (!/^\+[1-9]\d{1,14}$/.test(formData.phoneNumber)) { setFormError("Enter a valid phone number (e.g. +441234567890)."); return false; }
    if (formData.password.length < 8) { setFormError("Password must be at least 8 characters."); return false; }
    if (formData.password !== formData.confirmPassword) { setFormError("Passwords do not match."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateForm()) { toast.error(formError || "Please correct the form errors."); return; }
    try {
      await registerUser({ ...formData, role: "user" });
      localStorage.setItem("signupEmail", formData.email);
    } catch { toast.error("Registration failed. Please try again."); }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode || !/^\d{6}$/.test(verifyCode)) { toast.error("Please enter a valid 6-digit code."); return; }
    if (!token) { toast.error("No authentication token available."); setShowVerificationModal(false); return; }
    try {
      await verifyRegistration({ code: verifyCode });
      if (!auth.error) {
        setShowVerificationModal(false);
        setVerifyCode("");
        localStorage.removeItem("signupEmail");
        toast.success("Account created! Welcome to BritBooks.");
        navigate("/");
      } else { toast.error(auth.error || "Verification failed."); }
    } catch { toast.error("Verification failed. Please try again."); }
  };

  const handleCloseModal = () => { setShowVerificationModal(false); setVerifyCode(""); localStorage.removeItem("signupEmail"); };

  const emailDisplay = (() => {
    let email = localStorage.getItem("signupEmail") || formData.email;
    if (token) { try { const d = jwtDecode<JwtPayload>(token); email = d.email || email; } catch {} }
    return email || "your email";
  })();

  const inputCls = (pl = "pl-11") =>
    `w-full ${pl} pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10 transition-all`;

  return (
    <div className="min-h-screen flex font-sans">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" } }} />

      {/* ── LEFT BRAND PANEL ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #0a1628 0%, #0f2040 55%, #0a1628 100%)" }}
      >
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: "#c9a84c", filter: "blur(80px)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-[0.05]" style={{ background: "#c9a84c", filter: "blur(60px)", transform: "translate(-30%, 30%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ border: "1px solid #c9a84c" }} />

        {/* Back link */}
        <div className="relative z-10 p-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-xs font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to BritBooks
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-16 -mt-8">
          <Link to="/">
            <img src="/logobrit.png" alt="BritBooks" className="h-10 object-contain mb-12 brightness-0 invert" />
          </Link>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
            Join 2 million<br />book lovers.
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-12 max-w-xs">
            Create your free account and explore hundreds of thousands of books at amazing prices.
          </p>

          {/* Benefits list */}
          <div className="space-y-4 mb-12">
            {[
              "Free delivery on orders over £10",
              "30-day no-hassle returns",
              "Exclusive member-only deals",
              "Track orders in real time",
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.15)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#c9a84c" }} />
                </div>
                <span className="text-white/60 text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex -space-x-2">
              {["MK", "JR", "AL", "SH"].map((initials, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0a1628] flex items-center justify-center text-[9px] font-black"
                  style={{ background: `hsl(${i * 40 + 200}, 60%, 45%)`, color: "white" }}>
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-[#c9a84c] text-[#c9a84c]" />)}
              </div>
              <p className="text-white/50 text-[10px]">Loved by 2M+ readers worldwide</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-8 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[11px] text-white/30">Your data is always safe with us</span>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4">
          <Link to="/"><img src="/logobrit.png" alt="BritBooks" className="h-8 object-contain" /></Link>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 py-8 lg:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[420px]"
          >
            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Create account</h2>
              <p className="text-gray-400 text-sm">Join BritBooks and start your reading journey</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {(error || formError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium"
                >
                  {error || formError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <Field label="Full name" icon={User}>
                <input
                  type="text" name="fullName" placeholder="John Smith"
                  value={formData.fullName} onChange={handleChange} required disabled={loading}
                  className={inputCls()}
                />
              </Field>

              {/* Email */}
              <Field label="Email" icon={Mail}>
                <input
                  type="email" name="email" placeholder="you@example.com"
                  value={formData.email} onChange={handleChange} required disabled={loading}
                  className={inputCls()}
                />
              </Field>

              {/* Phone */}
              <Field label="Phone number" icon={Phone}>
                <input
                  type="text" name="phoneNumber" placeholder="+441234567890"
                  value={formData.phoneNumber} onChange={handleChange} required disabled={loading}
                  className={inputCls()}
                />
              </Field>

              {/* Password */}
              <Field label="Password" icon={Lock}>
                <input
                  type={passwordVisible ? "text" : "password"} name="password" placeholder="Min. 8 characters"
                  value={formData.password} onChange={handleChange} required disabled={loading}
                  className={`${inputCls()} pr-12`}
                />
                <button type="button" onClick={() => setPasswordVisible(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <PasswordStrength password={formData.password} />
              </Field>

              {/* Confirm password */}
              <Field label="Confirm password" icon={Lock}>
                <input
                  type={confirmVisible ? "text" : "password"} name="confirmPassword" placeholder="Repeat password"
                  value={formData.confirmPassword} onChange={handleChange} required disabled={loading}
                  className={`${inputCls()} pr-12`}
                />
                <button type="button" onClick={() => setConfirmVisible(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {confirmVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-60"
                style={{ background: "#c9a84c", color: "#0a1628" }}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" /> Creating account…</>
                  : <>Create Account <ArrowRight className="w-4 h-4" /></>
                }
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-medium">or sign up with</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileTap={{ scale: 0.97 }} type="button"
                onClick={() => toast("Google sign-up coming soon")}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">
                <GoogleIcon /> Google
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} type="button"
                onClick={() => toast("Facebook sign-up coming soon")}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1877f2] hover:bg-[#166de0] text-sm font-bold text-white transition-colors">
                <FacebookIcon /> Facebook
              </motion.button>
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="font-black text-gray-900 hover:text-[#c9a84c] transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── VERIFICATION MODAL ───────────────────────────── */}
      <AnimatePresence>
        {showVerificationModal && (
          <>
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleCloseModal}
            />

            {/* Mobile sheet */}
            <motion.div key="mobile-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-7 shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-7" />
              <VerifyPanel
                emailDisplay={emailDisplay}
                handleVerifySubmit={handleVerifySubmit}
                handleCloseModal={handleCloseModal}
                loading={loading}
                setVerifyCode={setVerifyCode}
                verifyCode={verifyCode}
              />
            </motion.div>

            {/* Desktop modal */}
            <motion.div key="desktop-modal"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
                <VerifyPanel
                  emailDisplay={emailDisplay}
                  handleVerifySubmit={handleVerifySubmit}
                  handleCloseModal={handleCloseModal}
                  loading={loading}
                  setVerifyCode={setVerifyCode}
                  verifyCode={verifyCode}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Shared verify panel ─────────────────────────── */
function VerifyPanel({ emailDisplay, handleVerifySubmit, handleCloseModal, loading, setVerifyCode, verifyCode }: any) {
  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-[#c9a84c]" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Verify your email</h2>
          <p className="text-sm text-gray-400 mt-1">
            We sent a 6-digit code to<br />
            <span className="font-bold text-gray-700">{emailDisplay}</span>
          </p>
        </div>
        <button onClick={handleCloseModal}
          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <span className="text-gray-500 text-sm font-bold">✕</span>
        </button>
      </div>

      <form onSubmit={handleVerifySubmit} className="space-y-5">
        <OtpInput onChange={setVerifyCode} />

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || verifyCode.length < 6}
          className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50"
          style={{ background: "#c9a84c", color: "#0a1628" }}
        >
          {loading ? "Verifying…" : "Confirm & Create Account"}
        </motion.button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        Didn't receive the code?{" "}
        <button type="button" className="font-bold text-gray-700 hover:text-[#c9a84c] transition-colors">
          Resend
        </button>
      </p>
    </>
  );
}

export default SignupPage;
