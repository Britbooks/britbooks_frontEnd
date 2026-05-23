import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { AuthState, RegisterFormData, RegisterResponse, VerifyFormData, VerifyResponse, ApiError } from "../types/auth";

const API_BASE_URL = "https://britbooks-api-production.up.railway.app/api/auth";

export const registerUser = createAsyncThunk<RegisterResponse, RegisterFormData, { rejectValue: ApiError }>(
  "auth/registerUser",
  async (formData, { rejectWithValue }) => {
    try {
      console.log("Sending registration request to:", `${API_BASE_URL}/register`, "with data:", formData);
      const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/register`, formData);
      console.log("Registration response:", response.data);
      if (!response.data.token) {
        console.error("No token in registration response");
        return rejectWithValue({ message: "No token returned from server" });
      }
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Registration error:", axiosError.response?.data || axiosError.message);
      return rejectWithValue(axiosError.response?.data || { message: "Registration failed" });
    }
  }
);

export const verifyRegistration = createAsyncThunk<VerifyResponse, VerifyFormData, { rejectValue: ApiError }>(
  "auth/verify-register",
  async (formData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.error("Verification failed: No token available");
        return rejectWithValue({ message: "Token missing" });
      }
      console.log("Sending verification request to:", `${API_BASE_URL}/verify-register`, "with code:", formData.code, "and token:", token);
      const response = await axios.post<VerifyResponse>(
        `${API_BASE_URL}/verify-register`,
        { code: formData.code },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Verification response:", response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Verification error:", axiosError.response?.data || axiosError.message);
      return rejectWithValue(axiosError.response?.data || { message: "Verification failed" });
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isVerified: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      console.log("Resetting auth state");
      state.user = null;
      state.token = null;
      state.error = null;
      state.isVerified = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log("Register pending");
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log("Register fulfilled payload:", action.payload);
        console.log("Setting state.token to:", action.payload.token);
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        console.log("State after fulfilled:", state);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
        console.log("Register rejected:", action.payload);
      })
      .addCase(verifyRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isVerified = action.payload.user.isVerified;
      })
      .addCase(verifyRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Verification failed";
        console.log("Verify rejected:", action.payload);
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;