import { NavLink } from 'react-router-dom';

const ITEMS = [
  { path: '/dashboard',              icon: '🏠', en: 'Home',      hi: 'होम' },
  { path: '/dashboard/customer/new', icon: '➕', en: 'Onboard',   hi: 'जोड़ें' },
  { path: '/dashboard/catalogue',    icon: '💎', en: 'Catalogue', hi: 'संग्रह' },
  { path: '/dashboard/customers',    icon: '👥', en: 'Customers', hi: 'ग्राहक' },
];

export function BottomNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-warm-white/95 backdrop-blur border-t border-plum/10 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `py-2 text-center transition-colors font-body ${
                isActive ? 'text-plum' : 'text-plum/50'
              }`
            }
          >
            <div className="text-lg leading-none">{item.icon}</div>
            <div className="text-[10px] mt-1">{item.en}</div>
            <div className="text-[9px] text-plum/35">{item.hi}</div>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
