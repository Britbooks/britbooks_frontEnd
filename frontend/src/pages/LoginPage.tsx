import React, { useState, useEffect, useRef, useContext } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (r: { access_token: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
    FB?: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (callback: (r: { authResponse?: { accessToken: string } }) => void, options: { scope: string }) => void;
    };
    fbAsyncInit?: () => void;
  }
}
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { LoginFormData, JwtPayload } from "../types/auth";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";
import AuthBrandPanel from "../components/AuthBrandPanel";
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


/* ── OTP digit input ─────────────────────────────── */
function OtpInput({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete?: () => void }) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const d = [...digits];
    d[i] = v.slice(-1);
    setDigits(d);
    onChange(d.join(""));
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (v && i === 5 && d.every(Boolean)) {
      setTimeout(() => onComplete?.(), 300);
    }
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
    if (pasted.length === 6) {
      setTimeout(() => onComplete?.(), 300);
    }
  };

  return (
    <div className="flex gap-3 justify-center my-2">
      {digits.map((digit, i) => (
        <motion.div
          key={i}
          animate={digit ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.18 }}
        >
          <input
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-12 h-16 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all duration-200 ${
              digit
                ? 'border-[#c9a84c] bg-[#c9a84c] text-[#0a1628] shadow-lg shadow-[#c9a84c]/30'
                : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#c9a84c] focus:bg-white focus:shadow-[0_0_0_3px_rgba(201,168,76,0.15)]'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────── */
const LoginPage = () => {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const navigate = useNavigate();
  const context = useContext(AuthContext);
  const location = useLocation();

  if (!context) throw new Error("AuthContext must be used within AuthProvider");
  const { auth, login, verifyLogin, verifyTotp, loginWithSocial } = context;
  const { loading, error, token } = auth;
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const googleTokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);
  const googleCallbackRef = useRef<(accessToken: string) => void>(() => {});

  useEffect(() => {
    if (token && !auth.pendingTotp && !showVerificationModal && !auth.isVerified) setShowVerificationModal(true);
  }, [token, auth.pendingTotp, showVerificationModal, auth.isVerified]);

  // Keep Google callback ref fresh so it always captures latest navigate/loginWithSocial
  useEffect(() => {
    googleCallbackRef.current = async (accessToken: string) => {
      setSocialLoading('google');
      try {
        await loginWithSocial('google', accessToken);
        toast.success('Signed in with Google!');
        navigate(location.state?.from || '/', { replace: true });
      } catch {
        toast.error('Google sign-in failed. Please try again.');
      } finally {
        setSocialLoading(null);
      }
    };
  }, [loginWithSocial, navigate, location.state]);

  // Load Google Identity Services SDK and init OAuth2 token client
  useEffect(() => {
    function initGIS() {
      if (!window.google || googleTokenClientRef.current) return;
      googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: (r) => {
          if (r.error || !r.access_token) {
            setSocialLoading(null);
            if (r.error !== 'access_denied') toast.error('Google sign-in failed. Please try again.');
            return;
          }
          googleCallbackRef.current(r.access_token);
        },
      });
    }

    if (document.getElementById('google-gsi-script')) {
      if (window.google) initGIS();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGIS;
    document.head.appendChild(script);
  }, []);

  // ── Load Facebook JS SDK
  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
    };
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleGoogleLogin = () => {
    if (!googleTokenClientRef.current) { toast.error('Google not loaded. Please refresh.'); return; }
    googleTokenClientRef.current.requestAccessToken();
  };

  const handleFacebookLogin = () => {
    if (!window.FB) { toast.error('Facebook not loaded. Please refresh.'); return; }
    setSocialLoading('facebook');
    window.FB.login((response) => {
      if (response.authResponse?.accessToken) {
        loginWithSocial('facebook', response.authResponse.accessToken)
          .then(() => {
            toast.success('Signed in with Facebook!');
            navigate(location.state?.from || '/', { replace: true });
          })
          .catch(() => toast.error('Facebook sign-in failed. Please try again.'))
          .finally(() => setSocialLoading(null));
      } else {
        setSocialLoading(null);
        toast.error('Facebook sign-in was cancelled.');
      }
    }, { scope: 'public_profile,email' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(null);
    localStorage.setItem("loginEmail", e.target.name === "email" ? e.target.value : formData.email);
  };

  const validateForm = (): boolean => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setFormError("Please enter a valid email address."); return false; }
    if (formData.password.length < 8) { setFormError("Password must be at least 8 characters long."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateForm()) { toast.error(formError || "Please correct the form errors."); return; }
    try {
      await login(formData);
      localStorage.setItem("loginEmail", formData.email);
    } catch { toast.error("Login failed. Please try again."); }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode || !/^\d{6}$/.test(verifyCode)) { toast.error("Please enter a valid 6-digit code."); return; }
    if (!token) { toast.error("No authentication token available."); setShowVerificationModal(false); return; }
    try {
      await verifyLogin({ code: verifyCode });
      if (!auth.error) {
        setShowVerificationModal(false);
        setVerifyCode("");
        localStorage.removeItem("loginEmail");
        toast.success("Welcome back!");
        navigate(location.state?.from || "/", { replace: true });
      } else { toast.error(auth.error || "Verification failed."); }
    } catch { toast.error("Verification failed. Please try again."); }
  };

  const handleCloseModal = () => { setShowVerificationModal(false); setVerifyCode(""); localStorage.removeItem("loginEmail"); };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || !/^\d{6}$/.test(totpCode)) { toast.error("Please enter a valid 6-digit code."); return; }
    try {
      await verifyTotp(totpCode);
      if (!auth.error) {
        setTotpCode("");
        localStorage.removeItem("loginEmail");
        toast.success("Welcome back!");
        navigate(location.state?.from || "/", { replace: true });
      } else { toast.error(auth.error || "Authenticator verification failed."); }
    } catch { toast.error("Authenticator verification failed. Please try again."); }
  };

  const emailDisplay = (() => {
    let email = localStorage.getItem("loginEmail") || formData.email;
    if (token) { try { const d = jwtDecode<JwtPayload>(token); email = d.email || email; } catch {} }
    return email || "your email";
  })();

  return (
    <div className="h-screen w-full flex font-sans overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" } }} />

      <AuthBrandPanel variant="login" />

      {/* ── RIGHT FORM PANEL (fills remaining 30%) ───────── */}
      <div className="flex-1 flex flex-col bg-white border-l border-gray-100 overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4">
          <Link to="/">
            <img src="/logobrit.png" alt="BritBooks" className="h-16 object-contain" />
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>

        {/* Form vertically centered in the right panel */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {/* Heading */}
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-500 text-base">Sign in to your BritBooks account</p>
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
            <motion.form
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" name="email" placeholder="you@example.com"
                    value={formData.email} onChange={handleChange} required disabled={loading}
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10 transition-all"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: "#c9a84c" }}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={passwordVisible ? "text" : "password"} name="password" placeholder="••••••••"
                    value={formData.password} onChange={handleChange} required disabled={loading}
                    className="w-full pl-11 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10 transition-all"
                  />
                  <button type="button" onClick={() => setPasswordVisible(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover="hover"
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-60 relative overflow-hidden"
                  style={{ background: loading ? '#d4b860' : 'linear-gradient(135deg, #c9a84c, #e8c96a)', color: '#0a1628' }}
                >
                  <motion.div
                    className="absolute inset-0 -skew-x-12 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
                    variants={{ hover: { x: ['-100%', '200%'] } }}
                    transition={{ duration: 0.55 }}
                  />
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" /> Signing in…</>
                    : <>Sign In <ArrowRight className="w-4 h-4" /></>
                  }
                </motion.button>
              </motion.div>
            </motion.form>

            {/* Divider + social + link — flow right after the form */}
            <div className="mt-6">
              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Social */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={!!socialLoading || loading}
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors disabled:opacity-60"
                >
                  {socialLoading === 'google'
                    ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <GoogleIcon />
                  }
                  Google
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={!!socialLoading || loading}
                  onClick={handleFacebookLogin}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors disabled:opacity-60"
                >
                  {socialLoading === 'facebook'
                    ? <div className="w-4 h-4 border-2 border-gray-300 border-t-[#1877F2] rounded-full animate-spin" />
                    : <FacebookIcon />
                  }
                  Facebook
                </motion.button>
              </div>

              {/* Link to signup */}
              <p className="text-center text-base text-gray-400">
                Don't have an account?{" "}
                <Link to="/signup" className="font-black text-gray-900 hover:text-[#c9a84c] transition-colors">
                  Create one free
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── TOTP MODAL ───────────────────────────────────── */}
      <AnimatePresence>
        {auth.pendingTotp && (
          <>
            <motion.div key="totp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />

            {/* Mobile sheet */}
            <motion.div key="totp-mobile"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-7 shadow-2xl">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-7" />
              <TotpContent totpCode={totpCode} setTotpCode={setTotpCode} handleTotpSubmit={handleTotpSubmit} loading={loading} />
            </motion.div>

            {/* Desktop modal */}
            <motion.div key="totp-desktop"
              initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
                <TotpContent totpCode={totpCode} setTotpCode={setTotpCode} handleTotpSubmit={handleTotpSubmit} loading={loading} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── VERIFICATION MODAL ───────────────────────────── */}
      <AnimatePresence>
        {showVerificationModal && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
              onClick={handleCloseModal}
            />

            {/* Mobile sheet */}
            <motion.div
              key="mobile-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-7 shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-7" />
              <VerifyContent
                emailDisplay={emailDisplay}
                verifyCode={verifyCode}
                setVerifyCode={setVerifyCode}
                handleVerifySubmit={handleVerifySubmit}
                handleCloseModal={handleCloseModal}
                loading={loading}
              />
            </motion.div>

            {/* Desktop modal */}
            <motion.div
              key="desktop-modal"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
                <VerifyContent
                  emailDisplay={emailDisplay}
                  verifyCode={verifyCode}
                  setVerifyCode={setVerifyCode}
                  handleVerifySubmit={handleVerifySubmit}
                  handleCloseModal={handleCloseModal}
                  loading={loading}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Shared verify content ───────────────────────── */
function VerifyContent({ emailDisplay, verifyCode, setVerifyCode, handleVerifySubmit, handleCloseModal, loading }: any) {
  const [resendTimer, setResendTimer] = React.useState(60);
  const [canResend, setCanResend] = React.useState(false);

  React.useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  return (
    <div>
      {/* Top row: close button */}
      <div className="flex justify-end mb-4">
        <button onClick={handleCloseModal}
          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <span className="text-gray-500 text-sm font-bold">✕</span>
        </button>
      </div>

      {/* Icon */}
      <div className="text-center mb-6">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex w-20 h-20 rounded-3xl items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))' }}
        >
          <Mail className="w-9 h-9 text-[#c9a84c]" />
        </motion.div>
        <h2 className="text-2xl font-black text-gray-900">Check your inbox</h2>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="font-bold text-gray-800">{emailDisplay}</span>
        </p>
      </div>

      <form onSubmit={handleVerifySubmit} className="space-y-5">
        <OtpInput value={verifyCode} onChange={setVerifyCode} onComplete={() => !loading && handleVerifySubmit({ preventDefault: () => {} } as any)} />

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || verifyCode.length < 6}
          className="w-full py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96a)', color: '#0a1628' }}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" />Verifying…</span>
            : 'Confirm & Sign In'
          }
        </motion.button>
      </form>

      <div className="flex items-center justify-center gap-1.5 mt-5 text-xs">
        <span className="text-gray-400">Didn't receive it?</span>
        {canResend
          ? <button type="button" onClick={() => { setResendTimer(60); setCanResend(false); }}
              className="font-bold text-[#c9a84c] hover:underline">Resend now</button>
          : <span className="text-gray-400">Resend in <span className="font-bold text-gray-700">{resendTimer}s</span></span>
        }
      </div>
    </div>
  );
}

/* ── TOTP modal content ──────────────────────────── */
function TotpContent({ totpCode, setTotpCode, handleTotpSubmit, loading }: {
  totpCode: string;
  setTotpCode: (v: string) => void;
  handleTotpSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-flex w-20 h-20 rounded-3xl items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}
        >
          <ShieldCheck className="w-9 h-9 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-black text-gray-900">Authenticator code</h2>
        <p className="text-sm text-gray-400 mt-2">
          Open your authenticator app and enter<br />the 6-digit code for BritBooks.
        </p>
      </div>
      <form onSubmit={handleTotpSubmit} className="space-y-5">
        <OtpInput value={totpCode} onChange={setTotpCode} />
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || totpCode.length < 6}
          className="w-full py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96a)', color: '#0a1628' }}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" />Verifying…</span>
            : 'Confirm & Sign In'
          }
        </motion.button>
      </form>
    </div>
  );
}

export default LoginPage;
