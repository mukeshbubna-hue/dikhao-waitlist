import api from './client';

export const addToShortlist = ({ customerId, productId, tryOnImageUrl }) =>
  api.post('/api/shortlists/add-item', { customerId, productId, tryOnImageUrl });

export const removeFromShortlist = ({ customerId, productId }) =>
  api.post('/api/shortlists/remove-item', { customerId, productId });

export const getActiveShortlist = (customerId) =>
  api.get('/api/shortlists/active', { params: { customerId } });

// Backend is the single source of truth for the wa.me URL + message template.
// This endpoint has no side effects — call it on mount to pre-fetch the URL
// so the <a href> is ready before the user taps (iOS popup-block safe).
export const getShortlistWhatsApp = (shortlistId) =>
  api.post(`/api/shortlists/${shortlistId}/whatsapp`);

export const markShortlistSent = (shortlistId) =>
  api.post(`/api/shortlists/${shortlistId}/mark-sent`);
