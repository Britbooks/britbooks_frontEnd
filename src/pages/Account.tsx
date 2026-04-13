"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  User,
  Lock,
  Bell,
  LogOut,
  Camera,
  ShieldCheck,
  ArrowRight,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Trash2,
  Activity,
} from "lucide-react";
import TopBar from "../components/Topbar";
import Footer from "../components/footer";
import { JwtPayload } from "../types/auth";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://britbooks-api-production-8ebd.up.railway.app";

const AccountSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifs">("profile");
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState<null | "logout" | "delete">(null);

  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext must be used within AuthProvider");
  const { auth, logout } = context;

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    is2FA: false,
  });

  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });

  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.token) {
        setLoading(false);
        return;
      }
      try {
        const decoded = jwtDecode<JwtPayload>(auth.token);
        const res = await axios.get(`${API_URL}/api/users/${decoded.userId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        const data = res.data;

        setUserData(data);
        setProfileForm({
          name: data.fullName || "",
          email: data.email || "",
          phone: data.phoneNumber || "",
          is2FA: data.is2FA || false,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [auth.token]);

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(passwordForm.next));
  }, [passwordForm.next]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setStatus(null);

    if (passwordForm.next && passwordForm.next !== passwordForm.confirm) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      setUpdating(false);
      return;
    }

    try {
      const payload: any = {
        fullName: profileForm.name,
        email: profileForm.email,        // still sent but field is readonly
        phoneNumber: profileForm.phone,
        is2FA: profileForm.is2FA,
      };
      if (passwordForm.next) payload.password = passwordForm.next;

      const res = await axios.put(`${API_URL}/api/users/${userData._id}`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      setUserData(res.data);
      setStatus({ type: "success", msg: "Your account has been successfully updated." });
      setPasswordForm({ next: "", confirm: "" });
    } catch (err: any) {
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to update your account.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Profile picture selected:", e.target.files?.[0]);
  };

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-[#F8F5F0] font-sans text-zinc-900">
      <TopBar />
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row gap-16">
          <aside className="lg:w-80 shrink-0 space-y-10">
            <div className="bg-white rounded-3xl shadow shadow-zinc-200/70 p-10">
              <div className="mx-auto w-36 h-36 bg-gradient-to-br from-amber-100 to-stone-100 rounded-3xl animate-pulse" />
            </div>
            <div className="bg-white rounded-3xl shadow shadow-zinc-200/70 p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </aside>
          <div className="flex-1 max-w-3xl">
            <div className="h-12 w-80 bg-stone-100 rounded animate-pulse mb-6" />
            <div className="mt-16 h-[520px] bg-white rounded-3xl shadow shadow-zinc-200/70 animate-pulse" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8F5F0] font-sans text-zinc-900 overflow-hidden">
      <TopBar />

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-10">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl shadow-xl shadow-amber-950/5 border border-amber-100/60 p-10 transition-all hover:-translate-y-0.5">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-8 group">
                    <div className="w-36 h-36 rounded-3xl overflow-hidden shadow-inner border-8 border-white">
                      <img
                        src={
                          userData?.profilePicture ||
                          `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData?.fullName}`
                        }
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-white p-4 rounded-2xl shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all border border-amber-100">
                      <Camera size={20} className="text-amber-700" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                    </label>
                  </div>

                  <h2 className="text-3xl font-semibold tracking-tighter">{userData?.fullName}</h2>
                  <p className="text-amber-700/70 mt-1">{userData?.email}</p>

                  <div className="mt-6 flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-700 rounded-3xl text-sm font-medium shadow-sm">
                    <Activity size={16} className="animate-pulse" />
                    Verified Member
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="bg-white rounded-3xl shadow-xl shadow-amber-950/5 border border-amber-100/60 p-3">
                {[
                  { id: "profile", label: "Personal Profile", icon: User },
                  { id: "security", label: "Login & Security", icon: Lock },
                  { id: "notifs", label: "Preferences", icon: Bell },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`group w-full flex items-center gap-5 px-7 py-5 rounded-2xl text-left transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-zinc-900 to-black text-black shadow-inner"
                          : "hover:bg-amber-50/70 text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition-colors ${isActive ? "bg-white/10" : "group-hover:bg-white"}`}>
                        <Icon size={22} strokeWidth={isActive ? 2.8 : 2.2} />
                      </div>
                      <span className="font-medium tracking-tight">{item.label}</span>
                    </button>
                  );
                })}

                <div className="border-t border-amber-100 mt-8 pt-6 px-4">
                  <button
                    onClick={() => setIsModalOpen("logout")}
                    className="w-full flex items-center gap-5 px-7 py-5 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300"
                  >
                    <LogOut size={22} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
            <div className="mb-16">
              <div className="inline-flex items-center gap-2 text-xs tracking-[2px] font-medium text-amber-700/70 mb-3">
                ACCOUNT • SETTINGS
              </div>
              <h1 className="text-6xl font-semibold tracking-tighter text-balance">Your Profile</h1>
              <p className="mt-4 text-lg text-zinc-600 max-w-lg">
                Keep your information secure and up to date.
              </p>
            </div>

            {status && (
              <div
                className={`mb-12 px-8 py-6 rounded-3xl flex gap-5 items-start border transition-all duration-500 ${
                  status.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {status.type === "success" ? <ShieldCheck size={28} /> : <Trash2 size={28} />}
                <p className="text-[15px] leading-relaxed">{status.msg}</p>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-16">
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-3xl shadow-xl shadow-amber-950/5 border border-amber-100/60 p-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="uppercase text-xs tracking-widest font-medium text-amber-700/60 mb-10 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
                    Personal Information
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14">
                    {/* Full Name */}
                    <div className="space-y-2 group">
                      <label className="text-xs font-medium tracking-widest text-zinc-500">FULL NAME</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full border-b-2 border-zinc-200 focus:border-amber-700 bg-transparent pb-5 outline-none text-2xl transition-all placeholder-zinc-300"
                      />
                    </div>

                    {/* Email - READ ONLY */}
                    <div className="space-y-2 group">
                      <label className="text-xs font-medium tracking-widest text-zinc-500">EMAIL ADDRESS</label>
                      <div className="flex items-center border-b-2 border-zinc-200 bg-zinc-50 rounded-t-xl px-4 py-5 cursor-not-allowed">
                        <Mail size={24} className="text-amber-600 mr-4" />
                        <input
                          type="email"
                          value={profileForm.email}
                          readOnly
                          className="flex-1 bg-transparent outline-none text-2xl text-zinc-500 cursor-not-allowed"
                        />
                        <span className="text-xs font-medium text-amber-700/60 ml-2">Locked</span>
                      </div>
                      <p className="text-xs text-amber-700/60">Email cannot be changed. Contact support if needed.</p>
                    </div>

                    {/* Phone Number */}
                    <div className="md:col-span-2 space-y-2 group">
                      <label className="text-xs font-medium tracking-widest text-zinc-500">PHONE NUMBER</label>
                      <div className="flex border-b-2 border-zinc-200 focus-within:border-amber-700 pb-5">
                        <Phone size={24} className="text-amber-600 mr-4 mt-1" />
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="flex-1 bg-transparent outline-none text-2xl placeholder-zinc-300"
                          placeholder="+44 7123 456 789"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-white rounded-3xl shadow-xl shadow-amber-950/5 border border-amber-100/60 p-14 flex items-center justify-between">
                    <div className="flex gap-8">
                      <div className="shrink-0 p-6 bg-gradient-to-br from-amber-50 to-stone-100 rounded-3xl">
                        <ShieldCheck size={42} className="text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold tracking-tight">Two-Factor Authentication</h3>
                        <p className="text-zinc-600 mt-3 max-w-md">
                          Add an extra layer of protection to keep your literary collection safe.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileForm.is2FA}
                        onChange={() => setProfileForm((p) => ({ ...p, is2FA: !p.is2FA }))}
                        className="sr-only peer"
                      />
                      <div className="w-16 h-9 bg-zinc-200 rounded-full peer peer-checked:bg-emerald-600 transition-all duration-300" />
                      <div className="absolute left-1 top-1 bg-white w-7 h-7 rounded-full shadow transition-all duration-300 peer-checked:translate-x-7" />
                    </label>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xl shadow-amber-950/5 border border-amber-100/60 p-14">
                    <div className="uppercase text-xs tracking-widest font-medium text-amber-700/60 mb-10">Change Password</div>

                    <div className="space-y-12">
                      <div className="space-y-3">
                        <label className="text-xs font-medium tracking-widest text-zinc-500">NEW PASSWORD</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.next}
                            onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                            className="w-full border-b-2 border-zinc-200 focus:border-amber-700 bg-transparent pb-5 outline-none text-2xl"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-4 text-zinc-400 hover:text-amber-700 transition-colors"
                          >
                            {showNewPassword ? <EyeOff size={26} /> : <Eye size={26} />}
                          </button>
                        </div>
                        {passwordForm.next && (
                          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-700 ${
                                passwordStrength <= 1
                                  ? "bg-rose-500 w-1/4"
                                  : passwordStrength === 2
                                  ? "bg-amber-500 w-1/2"
                                  : passwordStrength === 3
                                  ? "bg-emerald-500 w-3/4"
                                  : "bg-emerald-600 w-full"
                              }`}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-medium tracking-widest text-zinc-500">CONFIRM PASSWORD</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                            className="w-full border-b-2 border-zinc-200 focus:border-amber-700 bg-transparent pb-5 outline-none text-2xl"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-4 text-zinc-400 hover:text-amber-700 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={26} /> : <Eye size={26} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === "notifs" && (
                <div className="bg-white rounded-3xl shadow-xl shadow-amber-950/5 border border-amber-100/60 p-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="uppercase text-xs tracking-widest font-medium text-amber-700/60 mb-12">Notification Preferences</div>

                  <div className="space-y-6">
                    {[
                      { title: "Order Despatch & Tracking", desc: "Real-time updates when your books leave the warehouse.", icon: Activity },
                      { title: "Weekly Curations", desc: "Curated selections of new arrivals and literary gems.", icon: Bell },
                      { title: "Security & Account Alerts", desc: "Notifications about login attempts and important changes.", icon: ShieldCheck },
                    ].map((item, i) => (
                      <label
                        key={i}
                        className="group flex justify-between p-9 border border-amber-100 hover:border-amber-200 rounded-3xl transition-all hover:shadow-md cursor-pointer"
                      >
                        <div className="flex gap-7">
                          <div className="mt-1 text-amber-600">
                            <item.icon size={28} />
                          </div>
                          <div>
                            <p className="font-semibold text-xl tracking-tight">{item.title}</p>
                            <p className="text-zinc-600 mt-2 pr-12">{item.desc}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={i !== 1}
                          className="mt-2 accent-amber-700 w-6 h-6 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-8 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen("delete")}
                  className="flex items-center gap-3 text-rose-600 hover:text-rose-700 font-medium transition-colors"
                >
                  <Trash2 size={20} />
                  Delete Account
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="group flex items-center gap-4 bg-gradient-to-r from-zinc-900 to-black text-black px-14 py-6 rounded-3xl font-medium text-lg shadow-2xl shadow-zinc-950/30 transition-all active:scale-[0.985]"
                >
                  {updating ? (
                    <>Saving<span className="animate-pulse">...</span></>
                  ) : (
                    <>
                      Save Changes
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-14 shadow-2xl">
            <h2 className="text-4xl font-semibold tracking-tighter mb-6">
              {isModalOpen === "logout" ? "Sign Out?" : "Delete Account"}
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              {isModalOpen === "logout"
                ? "We hope to see you again soon in the collection."
                : "This action is permanent and cannot be undone."}
            </p>

            <div className="mt-14 grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsModalOpen(null)}
                className="py-6 text-lg font-medium border border-zinc-200 hover:bg-zinc-50 rounded-3xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isModalOpen === "logout") logout();
                  setIsModalOpen(null);
                }}
                className={`py-6 text-lg font-medium rounded-3xl transition-all ${
                  isModalOpen === "logout"
                    ? "bg-zinc-900 text-black hover:bg-white"
                    : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
              >
                {isModalOpen === "logout" ? "Sign Out" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;