import api from './client';

export const addToShortlist = ({ customerId, productId, tryOnImageUrl }) =>
  api.post('/api/shortlists/add-item', { customerId, productId, tryOnImageUrl });

export const removeFromShortlist = ({ customerId, productId }) =>
  api.post('/api/shortlists/remove-item', { customerId, productId });

export const getActiveShortlist = (customerId) =>
  api.get('/api/shortlists/active', { params: { customerId } });

export const getShortlistWhatsApp = (shortlistId) =>
  api.post(`/api/shortlists/${shortlistId}/whatsapp`);

export const markShortlistSent = (shortlistId) =>
  api.post(`/api/shortlists/${shortlistId}/mark-sent`);

// Single source of truth for the WhatsApp share URL. Used on both the
// Catalogue page and the try-on result page so the messaging stays in sync.
export function buildWhatsAppUrl({ shortlistId, customer, store, apiBase }) {
  if (!shortlistId || !customer || !apiBase) return null;
  const viewUrl   = `${apiBase}/view/shortlist/${shortlistId}`;
  const storeName = store?.store_name || 'our store';
  const name      = customer.name || 'you';
  const msg =
`Hi ${name}! Here are your selections from ${storeName}.

View, share with family, and come by when ready:
${viewUrl}

Link valid for 5 days.

Powered by Dikhao ✨`;
  const digits = (customer.mobile || '').replace(/\D/g, '');
  const phone = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
