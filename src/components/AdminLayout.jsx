import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import supabase from '../utils/supabase';
import { SessionContext } from '../context/SessionContext';
import {
  HiOutlineChartBar, HiOutlineCube, HiOutlineArchive,
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineCreditCard,
  HiOutlineDocumentReport, HiOutlineLogout, HiOutlineArrowLeft,
} from 'react-icons/hi';

const CYAN = '#9CE1F0';
const BLACK = '#000000';

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="font-sans text-sm text-gray-500">Checking access...</p>
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
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ backgroundColor: BLACK }}>
        <div className="px-6 py-8 flex flex-col items-center text-center border-b border-white/10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-3"
            style={{ backgroundColor: CYAN, color: BLACK }}
          >
            {initials}
          </div>
          <p className="text-xs text-white/60">Welcome,</p>
          <p className="text-sm font-semibold text-white">{displayName}</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors"
                style={active
                  ? { backgroundColor: CYAN, color: BLACK }
                  : { color: 'rgba(255,255,255,0.7)' }
                }
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-white/60 hover:text-[#9CE1F0] transition-colors">
            <HiOutlineArrowLeft size={17} />
            Back to site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-white/60 hover:text-[#9CE1F0] transition-colors text-left"
          >
            <HiOutlineLogout size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b-2 border-black flex items-center justify-between px-8 flex-shrink-0">
          <p className="font-bold text-sm uppercase tracking-wide text-black">Admin Dashboard</p>
          <div className="flex items-center gap-4">
            <input
              placeholder="Search..."
              className="border-2 border-black rounded-full px-4 py-1.5 text-sm w-56 focus:outline-none"
              style={{ borderColor: BLACK }}
            />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: CYAN, color: BLACK }}>
              {initials}
            </div>
          </div>
        </header>

        <main className="admin-content flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}