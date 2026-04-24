import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { LanguageToggle } from './LanguageToggle';

const NAV = [
  { path: '/dashboard',              icon: '🏠', enKey: 'nav.home',        hi: 'होम' },
  { path: '/dashboard/customer/new', icon: '➕', enKey: 'nav.newCustomer', hi: 'ग्राहक जोड़ें' },
  { path: '/dashboard/catalogue',    icon: '💎', enKey: 'nav.catalogue',   hi: 'संग्रह' },
  { path: '/dashboard/customers',    icon: '👥', enKey: 'nav.customers',   hi: 'ग्राहक' },
  { path: '/dashboard/history',      icon: '📜', enKey: 'nav.history',     hi: 'इतिहास' },
  { path: '/dashboard/plan',         icon: '💳', enKey: 'nav.plan',        hi: 'प्लान' },
  { path: '/dashboard/settings',     icon: '⚙️', enKey: 'nav.settings',    hi: 'सेटिंग' },
];

export function Sidebar({ store, onLogout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  useEffect(() => { localStorage.setItem('sidebar_collapsed', collapsed); }, [collapsed]);

  const initials = (store?.owner_name || 'U').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className={`hidden sm:flex flex-col bg-warm-white border-r border-plum/10 transition-all ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}>
      {/* Logo + collapse */}
      <div className="h-14 flex items-center px-4 border-b border-plum/10 justify-between">
        {!collapsed && <span className="font-display text-plum text-[20px] tracking-tight">Dikhao</span>}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-plum/50 hover:text-plum text-sm"
          aria-label="Toggle sidebar"
        >{collapsed ? '→' : '←'}</button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body transition-colors ${
                isActive
                  ? 'bg-plum/10 text-plum'
                  : 'text-plum/55 hover:text-plum hover:bg-plum/5'
              }`
            }
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate">{t(item.enKey, item.enKey.replace('nav.', ''))}</span>
                <span className="block text-[10px] text-plum/35 truncate">{item.hi}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Store footer */}
      <div className="p-3 border-t border-plum/10">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-gold/30 text-plum font-body font-medium text-sm flex items-center justify-center flex-shrink-0">{initials}</div>
            <div className="min-w-0 flex-1">
              <div className="text-plum text-sm truncate">{store?.owner_name}</div>
              <div className="text-plum/50 text-xs truncate">{store?.store_name}</div>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-rose-gold/30 text-plum font-body font-medium text-sm flex items-center justify-center mx-auto">{initials}</div>
        )}
        {!collapsed && (
          <div className="flex items-center justify-between mt-3">
            <LanguageToggle />
            <button onClick={() => { onLogout(); navigate('/login'); }} className="text-plum/50 hover:text-plum text-xs">
              {t('nav.logout', 'Logout')}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
