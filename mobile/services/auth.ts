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

export async function fetchUserProfile(userId: string, token: string) {
  const res = await authClient.get(ENDPOINTS.users.profile(userId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
