import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useEffect } from 'react';

export function DashboardLayout() {
  const { store, loading, logout, refreshStore, authed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authed) navigate('/login', { replace: true });
  }, [loading, authed, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center font-body text-plum/60">
        Loading…
      </div>
    );
  }
  if (!authed) return null;

  return (
    <div className="min-h-screen bg-ivory flex">
      <Sidebar store={store} onLogout={logout} />
      <main className="flex-1 pb-20 sm:pb-0 min-w-0">
        <Outlet context={{ store, logout, refreshStore }} />
      </main>
      <BottomNav />
    </div>
  );
}
