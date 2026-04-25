import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import OtpInput from "../components/OtpInput";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://britbooks-api-production-8ebd.up.railway.app";

type Step = "email" | "reset" | "done";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep]           = useState<Step>("email");
  const [email, setEmail]         = useState("");
  const [userId, setUserId]       = useState("");
  const [code, setCode]           = useState("");
  const [newPwd, setNewPwd]       = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const calcStrength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = calcStrength(newPwd);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  /* ── Step 1: send forgot-password email ── */
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setUserId(data.userId ?? data.data?.userId ?? "");
      toast.success(data.message ?? "Verification link sent.");
      setStep("reset");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify code + set new password ── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    if (newPwd.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        userId,
        code,
        newPassword: newPwd,
      });
      setStep("done");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" } }} />

      {/* ── LEFT BRAND PANEL ── */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #0a1628 0%, #0f2040 55%, #0a1628 100%)" }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: "#c9a84c", filter: "blur(80px)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-[0.05]" style={{ background: "#c9a84c", filter: "blur(60px)", transform: "translate(-30%,30%)" }} />

        <div className="relative z-10 p-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-white/70 text-xs font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to BritBooks
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-16 -mt-8">
          <Link to="/">
            <img src="/logobrit3.png" alt="BritBooks" className="h-10 object-contain mb-12 brightness-0 invert" />
          </Link>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
            Reset your<br />password.
          </h1>
          <p className="text-white text-base leading-relaxed max-w-xs">
            Enter your email and we'll send a verification code to get you back into your account.
          </p>

          <div className="mt-12 text-white space-y-4">
            {[
              { n: "1", label: "Enter your email" },
              { n: "2", label: "Enter the verification code" },
              { n: "3", label: "Set a new password" },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}>
                  {n}
                </div>
                <p className="text-sm text-white font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-8 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
          <span className="text-[11px] text-white">Secured with 256-bit SSL encryption</span>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4">
          <Link to="/">
            <img src="/logobrit.png" alt="BritBooks" className="h-8 object-contain" />
          </Link>
          <Link to="/login" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0">
          <div className="w-full max-w-[400px]">

            <AnimatePresence mode="wait">

              {/* ── STEP 1: Email ── */}
              {step === "email" && (
                <motion.div key="email"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <p className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest mb-2">Forgot password</p>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Reset your password</h2>
                    <p className="text-gray-400 text-sm">Enter the email address linked to your account and we'll send you a verification code.</p>
                  </div>

                  {error && (
                    <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSendCode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setError(null); }}
                          placeholder="you@example.com"
                          required
                          disabled={loading}
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10 transition-all"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      style={{ background: "#c9a84c", color: "#0a1628" }}
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                        : <>Send reset code <ArrowRight className="w-4 h-4" /></>
                      }
                    </motion.button>
                  </form>

                  <p className="text-center text-sm text-gray-400 mt-7">
                    Remember your password?{" "}
                    <Link to="/login" className="font-black text-gray-900 hover:text-[#c9a84c] transition-colors">Sign in</Link>
                  </p>
                </motion.div>
              )}

              {/* ── STEP 2: Code + New password ── */}
              {step === "reset" && (
                <motion.div key="reset"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <p className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest mb-2">Step 2 of 2</p>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Set new password</h2>
                    <p className="text-gray-400 text-sm">
                      Enter the verification code sent to{" "}
                      <span className="font-bold text-gray-700">{email}</span> and choose a new password.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleReset} className="space-y-5">
                    {/* OTP */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Verification code</label>
                      <OtpInput value={code} onChange={setCode} />
                    </div>

                    {/* New password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">New password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPwd ? "text" : "password"}
                          value={newPwd}
                          onChange={e => { setNewPwd(e.target.value); setError(null); }}
                          placeholder="New password"
                          disabled={loading}
                          className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10 transition-all"
                        />
                        <button type="button" onClick={() => setShowPwd(v => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPwd && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex gap-1">
                            {[1,2,3,4].map(i => (
                              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : "bg-gray-200"}`} />
                            ))}
                          </div>
                          <p className={`text-xs font-semibold ${strength >= 3 ? "text-emerald-600" : strength === 2 ? "text-yellow-600" : "text-red-500"}`}>
                            {strengthLabel[strength]}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Confirm new password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPwd}
                          onChange={e => { setConfirmPwd(e.target.value); setError(null); }}
                          placeholder="Confirm password"
                          disabled={loading}
                          className={`w-full pl-11 pr-12 py-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition-all ${
                            confirmPwd && confirmPwd !== newPwd
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border-gray-200 focus:border-[#c9a84c] focus:ring-[#c9a84c]/10"
                          }`}
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPwd && confirmPwd !== newPwd && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords do not match</p>
                      )}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading || code.length < 6 || newPwd !== confirmPwd}
                      className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      style={{ background: "#c9a84c", color: "#0a1628" }}
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                        : <>Reset password <ArrowRight className="w-4 h-4" /></>
                      }
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => { setStep("email"); setError(null); setCode(""); }}
                      className="w-full text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
                    >
                      ← Use a different email
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 3: Done ── */}
              {step === "done" && (
                <motion.div key="done"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-3">Password reset!</h2>
                  <p className="text-gray-400 text-sm mb-8">
                    Your password has been updated successfully. You can now sign in with your new password.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/login")}
                    className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ background: "#c9a84c", color: "#0a1628" }}
                  >
                    Sign in now <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
