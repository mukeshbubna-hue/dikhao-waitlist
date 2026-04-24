import api from './client';

export function upsertCustomer({ name, mobile, photoFile }) {
  const form = new FormData();
  form.append('name', name);
  form.append('mobile', mobile);
  if (photoFile) form.append('photoFile', photoFile);
  return api.post('/api/customers', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export const searchByMobile = (mobile) => api.get('/api/customers/search', { params: { mobile } });
export const getCustomer    = (id)     => api.get(`/api/customers/${id}`);
export const listCustomers  = ()       => api.get('/api/customers');
