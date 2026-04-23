import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL;

export const sendOtp = (data) =>
  axios.post(`${BASE}/api/waitlist/send-otp`, data);

export const verifyOtp = (mobile, otp) =>
  axios.post(`${BASE}/api/waitlist/verify-otp`, { mobile, otp });

export const resendOtp = (mobile) =>
  axios.post(`${BASE}/api/waitlist/resend-otp`, { mobile });
