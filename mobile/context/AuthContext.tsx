import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { router } from 'expo-router';
import { storage } from '../utils/storage';
import { setUnauthorizedHandler, setMemoryToken, clearMemoryToken } from '../services/api';
import {
  loginUser, registerUser, verifyLogin, verifyRegister,
  googleSocialLogin, facebookSocialLogin, verifyTotpLogin, resendOtpApi,
} from '../services/auth';
import { AuthState, User } from '../types';

type Action =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'AUTH_SUCCESS'; user: User; token: string }
  | { type: 'SET_PENDING'; token: string; flow: 'login' | 'register' }
  | { type: 'SET_PENDING_TOTP'; token: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  error: null,
  pendingToken: null,
  pendingFlow: null,
  pendingTotp: false,
};

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.user,
        token: action.token,
        loading: false,
        error: null,
        pendingToken: null,
        pendingFlow: null,
        pendingTotp: false,
      };
    case 'SET_PENDING':
      return { ...state, pendingToken: action.token, pendingFlow: action.flow, pendingTotp: false, loading: false };
    case 'SET_PENDING_TOTP':
      return { ...state, pendingToken: action.token, pendingFlow: 'totp', pendingTotp: true, loading: false };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  verifyTotp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook', token: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      try {
        const [token, user] = await Promise.all([storage.getToken(), storage.getUser<User>()]);
        if (token && user) {
          setMemoryToken(token);
          dispatch({ type: 'AUTH_SUCCESS', user, token });
        } else {
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      } catch {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    })();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await logout();
    });
  }, []);

  async function login(email: string, password: string) {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const data = await loginUser({ email, password });
      // Backend returns requiresTotp: true for accounts with 2FA enabled
      if (data.requiresTotp && data.token) {
        dispatch({ type: 'SET_PENDING_TOTP', token: data.token });
        router.push('/(auth)/totp');
      } else {
        dispatch({ type: 'SET_PENDING', token: data.token ?? data.userId, flow: 'login' });
        router.push('/(auth)/otp');
      }
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.response?.data?.message ?? 'Login failed' });
      throw e;
    }
  }

  async function register(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  }) {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await registerUser(data);
      dispatch({ type: 'SET_PENDING', token: res.token, flow: 'register' });
      router.push('/(auth)/otp');
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.response?.data?.message ?? 'Registration failed' });
      throw e;
    }
  }

  async function verifyOtp(code: string) {
    if (!state.pendingToken || !state.pendingFlow) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const fn = state.pendingFlow === 'login' ? verifyLogin : verifyRegister;
      const data = await fn(code, state.pendingToken);
      const user: User = data.user;
      await Promise.all([storage.saveToken(data.token), storage.saveUser(user)]);
      setMemoryToken(data.token);
      dispatch({ type: 'AUTH_SUCCESS', user, token: data.token });
      router.replace('/(tabs)/');
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.response?.data?.message ?? 'Invalid OTP' });
      throw e;
    }
  }

  async function verifyTotp(code: string) {
    if (!state.pendingToken) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const data = await verifyTotpLogin(code, state.pendingToken);
      const user: User = data.user ?? data.userDetails;
      await Promise.all([storage.saveToken(data.token), storage.saveUser(user)]);
      setMemoryToken(data.token);
      dispatch({ type: 'AUTH_SUCCESS', user, token: data.token });
      router.replace('/(tabs)/');
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.response?.data?.message ?? 'Invalid authenticator code' });
      throw e;
    }
  }

  async function resendOtp() {
    if (!state.pendingToken) return;
    try {
      await resendOtpApi(state.pendingToken);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.response?.data?.message ?? 'Failed to resend code' });
    }
  }

  async function socialLogin(provider: 'google' | 'facebook', token: string) {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const fn = provider === 'google' ? googleSocialLogin : facebookSocialLogin;
      const data = await fn(token);
      const user: User = data.user ?? data.userDetails;
      await Promise.all([storage.saveToken(data.token), storage.saveUser(user)]);
      setMemoryToken(data.token);
      dispatch({ type: 'AUTH_SUCCESS', user, token: data.token });
      router.replace('/(tabs)/');
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.response?.data?.message ?? `${provider} sign-in failed` });
      throw e;
    }
  }

  async function logout() {
    clearMemoryToken();
    await storage.clearAuth();
    dispatch({ type: 'LOGOUT' });
    router.replace('/(tabs)/');
  }

  function clearError() {
    dispatch({ type: 'SET_ERROR', error: null });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, verifyOtp, verifyTotp, resendOtp, socialLogin, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
