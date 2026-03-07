import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios, { AxiosError } from "axios";
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  user: { userId: string; fullName: string; email: string; role: string } | null;
  userId: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isVerified: boolean;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: "user" | "admin";
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterResponse {
  message: string;
  token: string;
  user: { userId: string; fullName: string; email: string; role: string };
}

interface LoginResponse {
  message: string;
  token: string;
}

interface VerifyFormData {
  code: string;
}

interface VerifyResponse {
  message: string;
  token: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    isVerified: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  wallet: {
    userId?: string;
    balance: number;
    currency: string;
    type: string;
  };
}

interface ApiError {
  message: string;
  error?: string;
}

interface AuthContextType {
  auth: AuthState;
  registerUser: (formData: RegisterFormData) => Promise<void>;
  login: (formData: LoginFormData) => Promise<void>;
  verifyRegistration: (formData: VerifyFormData) => Promise<void>;
  verifyLogin: (formData: VerifyFormData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "https://britbooks-api-production.up.railway.app/api/auth";
const API_USERS_URL = "https://britbooks-api-production.up.railway.app/api/users";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    loading: false,
    error: null,
    isVerified: false,
  });

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const decoded = jwtDecode<{ userId: string }>(storedToken);
          
          // Validate token by fetching user data
          setAuth((prev) => ({ ...prev, loading: true }));
          const response = await axios.get(
            `${API_USERS_URL}/${decoded.userId}`,
            { headers: { Authorization: `Bearer ${storedToken}` } }
          );

          setAuth({
            user: {
              userId: response.data._id,
              fullName: response.data.fullName,
              email: response.data.email,
              role: response.data.role,
            },
            token: storedToken,
            loading: false,
            error: null,
            isVerified: response.data.isVerified,
          });
          console.log('Restored auth state:', { user: response.data, token: storedToken });
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setAuth({
            user: null,
            token: null,
            loading: false,
            error: 'Invalid or expired token. Please log in again.',
            isVerified: false,
          });
        }
      } else {
        setAuth((prev) => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  const registerUser = async (formData: RegisterFormData) => {
    setAuth((prev) => ({ ...prev, loading: true, error: null }));
    console.log("Sending registration request to:", `${API_BASE_URL}/register`, "with data:", formData);
    try {
      const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/register`, formData);
      console.log("Registration response:", response.data);
      if (!response.data.token) {
        console.error("No token in registration response");
        setAuth((prev) => ({ ...prev, loading: false, error: "No token returned from server" }));
        return;
      }
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('authUser', JSON.stringify(response.data.user));
      setAuth((prev) => ({
        ...prev,
        loading: false,
        user: response.data.user,
        token: response.data.token,
        error: null,
      }));
      console.log("Auth state after registration:", { user: response.data.user, token: response.data.token });
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Registration error:", axiosError.response?.data || axiosError.message);
      setAuth((prev) => ({
        ...prev,
        loading: false,
        error: axiosError.response?.data?.message || "Registration failed",
      }));
    }
  };

  const login = async (formData: LoginFormData) => {
    setAuth((prev) => ({ ...prev, loading: true, error: null }));
    console.log("Sending login request to:", `${API_BASE_URL}/login`, "with data:", formData);
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/login`, formData);
      console.log("Login response:", response.data);
      if (!response.data.token) {
        console.error("No token in login response");
        setAuth((prev) => ({ ...prev, loading: false, error: "No token returned from server" }));
        return;
      }
      localStorage.setItem('authToken', response.data.token);
      // User data not available yet, will be set after verifyLogin
      setAuth((prev) => ({
        ...prev,
        loading: false,
        token: response.data.token,
        error: null,
      }));
      console.log("Auth state after login:", { token: response.data.token });
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Login error:", axiosError.response?.data || axiosError.message);
      setAuth((prev) => ({
        ...prev,
        loading: false,
        error: axiosError.response?.data?.message || "Login failed",
      }));
    }
  };

  const verifyRegistration = async (formData: VerifyFormData) => {
    setAuth((prev) => ({ ...prev, loading: true, error: null }));
    if (!auth.token) {
      console.error("Verification failed: No token available");
      setAuth((prev) => ({ ...prev, loading: false, error: "Token missing" }));
      return;
    }
    console.log("Sending registration verification request to:", `${API_BASE_URL}/verify-register`, "with code:", formData.code, "and token:", auth.token);
    try {
      const response = await axios.post<VerifyResponse>(
        `${API_BASE_URL}/verify-register`,
        { code: formData.code },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      console.log("Registration verification response:", response.data);
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('authUser', JSON.stringify({
        userId: response.data.user.userId,
        fullName: response.data.user.fullName,
        email: response.data.user.email,
        role: response.data.user.role,
      }));
      setAuth((prev) => ({
        ...prev,
        loading: false,
        user: {
          userId: response.data.user.userId,
          fullName: response.data.user.fullName,
          email: response.data.user.email,
          role: response.data.user.role,
        },
        token: response.data.token,
        isVerified: response.data.user.isVerified,
        error: null,
      }));
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Registration verification error:", axiosError.response?.data || axiosError.message);
      setAuth((prev) => ({
        ...prev,
        loading: false,
        error: axiosError.response?.data?.message || "Verification failed",
      }));
    }
  };

  const verifyLogin = async (formData: VerifyFormData) => {
    setAuth((prev) => ({ ...prev, loading: true, error: null }));
    if (!auth.token) {
      console.error("Login verification failed: No token available");
      setAuth((prev) => ({ ...prev, loading: false, error: "Token missing" }));
      return;
    }
    console.log("Sending login verification request to:", `${API_BASE_URL}/verify-login`, "with code:", formData.code, "and token:", auth.token);
    try {
      const response = await axios.post<VerifyResponse>(
        `${API_BASE_URL}/verify-login`,
        { code: formData.code },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      console.log("Login verification response:", response.data);
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('authUser', JSON.stringify({
        userId: response.data.user.userId,
        fullName: response.data.user.fullName,
        email: response.data.user.email,
        role: response.data.user.role,
      }));
      setAuth((prev) => ({
        ...prev,
        loading: false,
        user: {
          userId: response.data.user.userId,
          fullName: response.data.user.fullName,
          email: response.data.user.email,
          role: response.data.user.role,
        },
        token: response.data.token,
        isVerified: response.data.user.isVerified,
        error: null,
      }));
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Login verification error:", axiosError.response?.data || axiosError.message);
      setAuth((prev) => ({
        ...prev,
        loading: false,
        error: axiosError.response?.data?.message || "Login failed",
      }));
    }
  };

  const logout = () => {
    console.log("Logging out - resetting auth state");
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setAuth({
      user: null,
      token: null,
      loading: false,
      error: null,
      isVerified: false,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, registerUser, login, verifyRegistration, verifyLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};