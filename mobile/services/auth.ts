import axios from 'axios';
import { ENDPOINTS } from '../constants/Api';

const authClient = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function registerUser(data: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}) {
  const res = await authClient.post(ENDPOINTS.auth.register, { ...data, role: 'user' });
  return res.data;
}

export async function loginUser(data: { email: string; password: string }) {
  const res = await authClient.post(ENDPOINTS.auth.login, data);
  return res.data;
}

export async function verifyRegister(code: string, token: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.verifyRegister,
    { code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function verifyLogin(code: string, token: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.verifyLogin,
    { code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function verifyTotpLogin(code: string, pendingToken: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.twoFa.login,
    { code },
    { headers: { Authorization: `Bearer ${pendingToken}` } }
  );
  return res.data;
}

export async function fetchUserProfile(userId: string, token: string) {
  const res = await authClient.get(ENDPOINTS.users.profile(userId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function googleSocialLogin(idToken: string) {
  const res = await authClient.post(ENDPOINTS.auth.googleAuth, { idToken });
  return res.data;
}

export async function facebookSocialLogin(accessToken: string) {
  const res = await authClient.post(ENDPOINTS.auth.facebookAuth, { accessToken });
  return res.data;
}

export async function resendOtpApi(token: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.resendOtp,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function forgotPasswordApi(email: string) {
  const res = await authClient.post(ENDPOINTS.auth.forgotPassword, { email });
  return res.data;
}

export async function resetPasswordApi(userId: string, code: string, newPassword: string) {
  const res = await authClient.post(ENDPOINTS.auth.resetPassword, { userId, code, newPassword });
  return res.data;
}

export async function changePasswordApi(currentPassword: string, newPassword: string, token: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.changePassword,
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function setup2FAApi(token: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.twoFa.setup,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data as { secret: string; qrCode: string };
}

export async function enable2FAApi(code: string, token: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.twoFa.enable,
    { code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function disable2FAApi(code: string, token: string) {
  const res = await authClient.post(
    ENDPOINTS.auth.twoFa.disable,
    { code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
