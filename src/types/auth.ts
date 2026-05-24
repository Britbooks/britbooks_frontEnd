export interface RegisterFormData {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    role: "user" | "admin";
  }
  
  export interface LoginFormData {
    email: string;
    password: string;
  }
  
  export interface RegisterResponse {
    message: string;
    token: string;
    user: {
      userId: string;
      fullName: string;
      email: string;
      role: string;
    };
  }
  
  export interface LoginResponse {
    message: string;
    token: string;
  }
  
  export interface VerifyFormData {
    code: string;
  }
  
  export interface VerifyResponse {
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
  
  export interface ApiError {
    message: string;
    error?: string;
  }
  
  export interface AuthState {
    user: RegisterResponse["user"] | VerifyResponse["user"] | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    isVerified: boolean;
  }
  
  export interface JwtPayload {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    hashedPassword: string;
    role: string;
    iat: number;
    exp: number;
  }