import { NavLink } from 'react-router-dom';

const ITEMS = [
  { path: '/dashboard',              icon: '🏠', en: 'Home',     hi: 'होम' },
  { path: '/dashboard/customer/new', icon: '➕', en: 'New',      hi: 'नया' },
  { path: '/dashboard/customers',    icon: '👥', en: 'Customers',hi: 'ग्राहक' },
  { path: '/dashboard/plan',         icon: '💳', en: 'Plan',     hi: 'प्लान' },
];

export function BottomNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-navy/95 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `py-2 text-center transition-colors ${isActive ? 'text-brand-gold' : 'text-white/50'}`
            }
          >
            <div className="text-lg leading-none">{item.icon}</div>
            <div className="text-[10px] mt-1">{item.en}</div>
            <div className="text-[9px] text-white/35">{item.hi}</div>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
