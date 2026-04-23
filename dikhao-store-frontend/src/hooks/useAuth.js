import { useEffect, useState } from 'react';
import { me } from '../api/auth';

export function useAuth() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dikhao_token');
    if (!token) { setLoading(false); return; }
    me()
      .then(res => setStore(res.data.store))
      .catch(() => localStorage.removeItem('dikhao_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, store) {
    localStorage.setItem('dikhao_token', token);
    setStore(store);
  }
  function logout() {
    localStorage.removeItem('dikhao_token');
    setStore(null);
  }

  return { store, loading, login, logout, authed: !!store };
}
