import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import supabase from '../utils/supabase';
import { SessionContext } from '../context/SessionContext';
import {
  HiOutlineChartBar, HiOutlineCube, HiOutlineArchive,
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineCreditCard,
  HiOutlineDocumentReport, HiOutlineLogout, HiOutlineArrowLeft,
} from 'react-icons/hi';

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
      <div className="min-h-screen bg-[#F2F0EA] flex items-center justify-center">
        <p className="font-body text-sm text-[#6B6558]">Checking access...</p>
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
    <div className="flex min-h-screen bg-[#F2F0EA]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#14110D] text-[#FAF8F4] flex-shrink-0 flex flex-col">
        <div className="px-6 py-8 flex flex-col items-center text-center border-b border-white/10">
          <div className="w-14 h-14 rounded-full bg-[#5EC4D6] text-[#0D0D0D] flex items-center justify-center font-heading text-lg font-bold mb-3">
            {initials}
          </div>
          <p className="font-body text-xs text-[#B8B2A3]">Welcome,</p>
          <p className="font-body text-sm font-semibold text-[#FAF8F4]">{displayName}</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                  active
                    ? 'bg-[#5EC4D6] text-[#0D0D0D] font-semibold'
                    : 'text-[#D8D2C4] hover:bg-white/5 hover:text-[#5EC4D6]'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-[#B8B2A3] hover:bg-white/5 hover:text-[#FAF8F4] transition-colors"
          >
            <HiOutlineArrowLeft size={17} />
            Back to site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-[#C97A6D] hover:bg-white/5 transition-colors text-left"
          >
            <HiOutlineLogout size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E4DFD3] flex items-center justify-between px-8 flex-shrink-0">
          <p className="font-body text-sm font-medium text-[#6B6558]">Admin Dashboard</p>
          <div className="flex items-center gap-4">
            <input
              placeholder="Search..."
              className="border border-[#E4DFD3] rounded-full px-4 py-1.5 text-sm font-body w-56 focus:outline-none focus:border-[#5EC4D6]"
            />
            <div className="w-8 h-8 rounded-full bg-[#5EC4D6] text-[#0D0D0D] flex items-center justify-center font-body text-xs font-semibold">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}