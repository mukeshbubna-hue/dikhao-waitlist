import api from './client';

export const startJewelleryTryOn = ({ customerId, productId }) =>
  api.post('/api/tryon-jewellery', { customerId, productId });

export const getJewelleryTryOn = (id) =>
  api.get(`/api/tryon-jewellery/${id}`);

export const todaysJewelleryTryOns = () =>
  api.get('/api/tryon-jewellery/today');
