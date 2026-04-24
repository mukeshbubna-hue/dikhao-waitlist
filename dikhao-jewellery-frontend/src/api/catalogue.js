import api from './client';

export const listProducts = (params = {}) =>
  api.get('/api/catalogue', { params });

export function createProduct({ photoFile, price, category }) {
  const form = new FormData();
  form.append('photoFile', photoFile);
  form.append('price', price);
  form.append('category', category);
  return api.post('/api/catalogue', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const updateProduct = (id, patch) => api.patch(`/api/catalogue/${id}`, patch);
export const deleteProduct = (id)        => api.delete(`/api/catalogue/${id}`);
