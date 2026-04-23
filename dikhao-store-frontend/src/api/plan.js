import api from './client';
export const checkPlan = () => api.get('/api/plan/check');
