import api from './client';

export function startTryOn({ customerId, shirtFile, trouserFile }) {
  const form = new FormData();
  form.append('customerId', customerId);
  if (shirtFile)   form.append('shirtFile',   shirtFile);
  if (trouserFile) form.append('trouserFile', trouserFile);
  return api.post('/api/tryon/process', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export const getStatus   = (id) => api.get(`/api/tryon/status/${id}`);
export const markSent    = (id) => api.post(`/api/tryon/${id}/sent`);
export const todaysList  = ()   => api.get('/api/tryon/today');
