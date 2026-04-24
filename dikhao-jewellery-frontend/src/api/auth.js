import api from './client';

export const sendOtp    = (mobile)                          => api.post('/api/auth/send-otp',   { mobile });
export const verifyOtp  = (mobile, otp, extra = {})         => api.post('/api/auth/verify-otp', { mobile, otp, ...extra });
export const me         = ()                                => api.get('/api/auth/me');
export const logout     = ()                                => api.post('/api/auth/logout');
