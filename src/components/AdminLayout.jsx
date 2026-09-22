import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import supabase from '../utils/supabase';
import { SessionContext } from '../context/SessionContext';
import {
  HiOutlineChartBar, HiOutlineCube, HiOutlineArchive,
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineCreditCard,
  HiOutlineDocumentReport, HiOutlineLogout, HiOutlineArrowLeft,
} from 'react-icons/hi';

const INK = '#16181D';
const MUTED = '#6B6B66';
const ACCENT = '#00BFFF';
const ACCENT_TINT = '#EAF9FE';
const BORDER = '#EBEBE8';
const CANVAS = '#FAFAF8';

export default function AdminLayout({ children }) {
  const session = useContext(SessionContext);
  const [checkingRole, setCheckingRole] = useState(true);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkRole = async () => {
      if (!session) { navigate('/login'); return; }
      const { data, error } = await supabase
        .from('profiles').select('firstname, lastname, role').eq('id', session.user.id).single();
      if (error || data?.role !== 'admin') { navigate('/'); return; }
      setProfile(data);
      setCheckingRole(false);
    };
    checkRole();
  }, [session, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CANVAS }}>
        <p className="text-sm" style={{ color: MUTED }}>Checking access...</p>
      </div>
    );
  }
  if (!profile) return null;

  const initials = ((profile.firstname?.[0] ?? '') + (profile.lastname?.[0] ?? '')).toUpperCase() || 'A';
  const displayName = profile.firstname || 'Admin';

  const navItems = [
    { to: '/admin', label: 'Data Analytics', icon: HiOutlineChartBar },
    { to: '/admin/products', label: 'Product Management', icon: HiOutlineCube },
    { to: '/admin/inventory', label: 'Inventory Management', icon: HiOutlineArchive },
    { to: '/admin/customers', label: 'Customers', icon: HiOutlineUsers },
    { to: '/admin/orders', label: 'Orders', icon: HiOutlineClipboardList },
    { to: '/admin/payments', label: 'Payments', icon: HiOutlineCreditCard },
    { to: '/admin/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: CANVAS }}>
      {/* Sidebar -- light, not dark */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r" style={{ borderColor: BORDER }}>
        <div className="px-5 pt-5 flex justify-center border-b" style={{ borderColor: BORDER }}>
          <Link to="/">
            <img
              src="/images/LOGO.png"
              alt="ONLYCaps"
              className="h-16"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <span className="font-heading text-lg tracking-wider hidden" style={{ color: INK }}>ONLYCAPS</span>
          </Link>
        </div>
        <div className="px-5 py-6 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
            style={{ backgroundColor: ACCENT_TINT, color: ACCENT === '#00BFFF' ? '#0090BD' : ACCENT }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: MUTED }}>Signed in as</p>
            <p className="text-sm font-medium truncate" style={{ color: INK }}>{displayName}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={active
                  ? { backgroundColor: ACCENT_TINT, color: '#0090BD' }
                  : { color: MUTED }
                }
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: BORDER }}>
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: MUTED }}>
            <HiOutlineArrowLeft size={17} />
            Back to site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-red-50 hover:text-red-600 transition-colors text-left"
            style={{ color: MUTED }}
          >
            <HiOutlineLogout size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 flex-shrink-0" style={{ borderColor: BORDER }}>
          <p className="text-sm font-medium" style={{ color: MUTED }}>Admin</p>
          <input
            placeholder="Search..."
            className="border rounded-lg px-3.5 py-1.5 text-sm w-56 focus:outline-none focus:ring-2"
            style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
          />
        </header>

        <main className="admin-content flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}