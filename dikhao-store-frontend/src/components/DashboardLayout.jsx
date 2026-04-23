import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useEffect } from 'react';

export function DashboardLayout() {
  const { store, loading, logout, authed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authed) navigate('/login', { replace: true });
  }, [loading, authed, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/60">Loading…</div>;
  if (!authed) return null;

  return (
    <div className="min-h-screen bg-brand-navy flex">
      <Sidebar store={store} onLogout={logout} />
      <main className="flex-1 pb-20 sm:pb-0 overflow-y-auto">
        <Outlet context={{ store, logout }} />
      </main>
      <BottomNav />
    </div>
  );
}
