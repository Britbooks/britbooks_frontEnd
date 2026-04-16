import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { LoginFormData, JwtPayload } from "../types/auth";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Mail, Lock, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.522-3.447-11.019-8.158l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.018,35.258,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);
const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
  </svg>
);

const LoginPage = () => {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const navigate = useNavigate();
  const context = useContext(AuthContext);
  const location = useLocation();

  if (!context) throw new Error("AuthContext must be used within AuthProvider");
  const { auth, login, verifyLogin, logout } = context;
  const { loading, error, token } = auth;

  useEffect(() => {
    if (token && !showVerificationModal && !auth.isVerified) setShowVerificationModal(true);
  }, [token, showVerificationModal, auth.isVerified]);

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
        toast.success("Login verified successfully!");
        navigate(location.state?.from || "/", { replace: true });
      } else { toast.error(auth.error || "Verification failed."); }
    } catch { toast.error("Verification failed. Please try again."); }
  };

  const handleCloseModal = () => { setShowVerificationModal(false); setVerifyCode(""); localStorage.removeItem("loginEmail"); };

  const emailDisplay = (() => {
    let email = localStorage.getItem("loginEmail") || formData.email;
    if (token) { try { const d = jwtDecode<JwtPayload>(token); email = d.email || email; } catch {} }
    return email || "your email";
  })();

  return (
    <>
      <Toaster position="top-right" />
      <TopBar />

      {/* ══════════════════════════════════════
          MOBILE LOGIN
      ══════════════════════════════════════ */}
      <div className="sm:hidden min-h-screen bg-gray-50 flex flex-col">

        {/* Hero header */}
        <div className="relative px-6 pt-10 pb-14 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0a1628 0%,#1a2d4f 100%)' }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: '#c9a84c', filter: 'blur(40px)' }} />
          <Link to="/">
            <img src="/logobrit.png" alt="BritBooks" className="h-10 object-contain mb-6"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </Link>
          <h1 className="text-2xl font-black text-white mb-1">Welcome back</h1>
          <p className="text-white/60 text-sm">Sign in to your BritBooks account</p>
        </div>

        {/* Form card */}
        <div className="flex-1 px-5 -mt-6 relative z-10">
          <div className="bg-white rounded-3xl p-6 shadow-xl" style={{ boxShadow: '0 8px 40px rgba(10,22,40,0.12)' }}>

            {(error || formError) && (
              <div className="mb-4 px-4 py-3 bg-red-50 rounded-2xl text-red-600 text-xs font-medium">
                {error || formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" name="email" placeholder="Email address"
                  value={formData.email} onChange={handleChange} required disabled={loading}
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none border border-gray-100 focus:border-[#c9a84c] transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={passwordVisible ? "text" : "password"} name="password" placeholder="Password"
                  value={formData.password} onChange={handleChange} required disabled={loading}
                  className="w-full pl-11 pr-12 py-4 bg-gray-50 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none border border-gray-100 focus:border-[#c9a84c] transition-colors"
                />
                <button type="button" onClick={() => setPasswordVisible(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: '#c9a84c' }}>
                  Forgot password?
                </Link>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#c9a84c', color: '#000' }}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Signing in…</>
                ) : (
                  <> Sign In <ArrowRight size={15} /></>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => toast("Google login coming soon")}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-700">
                <GoogleIcon /> Google
              </button>
              <button type="button" onClick={() => toast("Facebook login coming soon")}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1877f2] text-xs font-bold text-white">
                <FacebookIcon /> Facebook
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              Don't have an account?{' '}
              <Link to="/signup" className="font-black" style={{ color: '#0a1628' }}>Register</Link>
            </p>
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* ══════════════════════════════════════
          DESKTOP LOGIN — unchanged
      ══════════════════════════════════════ */}
      <div className="hidden sm:flex bg-gray-100 min-h-screen items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md p-8 md:p-12 rounded-xl shadow-lg">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center">
              <img src="/logobrit.png" alt="BritBooks Logo" className="w-20 object-contain" style={{ height: "62px" }} />
            </div>
          </div>
          {(error || formError) && <div className="text-red-500 text-center mb-4">{error || formError}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required disabled={loading} />
            </div>
            <div className="relative">
              <input type={passwordVisible ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required disabled={loading} />
              <button type="button" onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-red-600" disabled={loading}>
                {passwordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</Link>
            </div>
            <button type="submit" disabled={loading}
              className={`w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-900 transition-all duration-300 flex items-center justify-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
              {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Loading...</> : "Login"}
            </button>
          </form>
          <div className="mt-8 space-y-4">
            <div className="flex space-x-4">
              <button type="button" onClick={() => toast("Google login not implemented yet")}
                className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors space-x-2" disabled={loading}>
                <GoogleIcon /><span>Continue with Google</span>
              </button>
              <button type="button" onClick={() => toast("Facebook login not implemented yet")}
                className="w-full flex items-center justify-center py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors space-x-2" disabled={loading}>
                <FacebookIcon /><span>Continue with Facebook</span>
              </button>
            </div>
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-600">Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-blue-600 hover:underline">Register Here</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Verification modal — shared, works on both */}
      <AnimatePresence>
        {showVerificationModal && (
          <>
            <motion.div key="vbg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50" onClick={handleCloseModal} />

            {/* Mobile: bottom sheet */}
            <motion.div key="vsheet"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6"
              style={{ boxShadow: '0 -12px 40px rgba(0,0,0,0.15)' }}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Verify your login</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Code sent to {emailDisplay}</p>
                </div>
                <button onClick={handleCloseModal} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleVerifySubmit}>
                <input type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value)}
                  placeholder="Enter 6-digit code" maxLength={6} required
                  className="w-full px-4 py-4 bg-gray-50 rounded-2xl text-center text-2xl font-black tracking-[0.5em] text-gray-900 outline-none border border-gray-100 focus:border-[#c9a84c] transition-colors mb-4" />
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl font-black text-sm disabled:opacity-60"
                  style={{ background: '#c9a84c', color: '#000' }}>
                  {loading ? "Verifying…" : "Confirm Code"}
                </motion.button>
              </form>
            </motion.div>

            {/* Desktop: centred modal */}
            <motion.div key="vmodal"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4"
            >
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Verify Your Login</h2>
                  <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Enter the 6-digit code sent to {emailDisplay}.</p>
                <form onSubmit={handleVerifySubmit}>
                  <input type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value)}
                    className="w-full px-3 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-red-500 mb-4"
                    placeholder="Enter 6-digit code" maxLength={6} required />
                  <button type="submit" disabled={loading}
                    className={`w-full bg-red-600 text-white py-3 rounded-md font-semibold hover:bg-red-700 transition-all ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
};

export default LoginPage;
