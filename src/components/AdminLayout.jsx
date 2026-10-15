import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import supabase from '../utils/supabase';
import { SessionContext } from '../context/SessionContext';
import {
  HiOutlineChartBar, HiOutlineCube, HiOutlineArchive,
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineCreditCard,
  HiOutlineDocumentReport, HiOutlineLogout, HiOutlineArrowLeft,
  HiOutlineMenu
} from 'react-icons/hi';

export default function AdminLayout({ children }) {
  const session = useContext(SessionContext);
  const [checkingRole, setCheckingRole] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading-skeleton h-8 w-32" />
      </div>
    );
  }
  if (!profile) return null;

  const initials = ((profile.firstname?.[0] ?? '') + (profile.lastname?.[0] ?? '')).toUpperCase() || 'A';
  const displayName = profile.firstname || 'Admin';

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: HiOutlineChartBar },
    { to: '/admin/products', label: 'Products', icon: HiOutlineCube },
    { to: '/admin/inventory', label: 'Inventory', icon: HiOutlineArchive },
    { to: '/admin/customers', label: 'Customers', icon: HiOutlineUsers },
    { to: '/admin/orders', label: 'Orders', icon: HiOutlineClipboardList },
    { to: '/admin/payments', label: 'Payments', icon: HiOutlineCreditCard },
    { to: '/admin/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  ];

  return (
    <div className="flex min-h-screen bg-base-100">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} role="navigation" aria-label="Admin navigation">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <Link to="/" className="flex items-center" aria-label="OnlyCaps Home">
            <img
              src="/images/LOGO.webp"
              alt="OnlyCaps"
              className="h-10 w-auto"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-base-content/60 hover:text-base-content hover:bg-base-200 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 bg-primary/10 text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/50">Signed in as</p>
              <p className="text-sm font-medium truncate text-base-content">{displayName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-base-300 space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-base-200 transition-colors text-base-content/70"
          >
            <HiOutlineArrowLeft size={17} />
            Back to Site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-error/10 hover:text-error transition-colors text-base-content/70 text-left"
          >
            <HiOutlineLogout size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Menu Button */}
        <header className="md:hidden h-16 bg-white border-b border-base-300 flex items-center justify-between px-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-base-content hover:text-primary hover:bg-base-200 rounded-lg transition-colors"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            <HiOutlineMenu className="h-6 w-6" />
          </button>
          <span className="text-sm font-medium text-base-content">Admin</span>
          <div className="w-10" />
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-base-300 flex items-center justify-between px-6 flex-shrink-0">
          <span className="text-sm font-medium text-base-content/60">Admin Dashboard</span>
          <input
            placeholder="Search..."
            className="input w-64"
            type="search"
            aria-label="Search"
          />
        </header>

        <main className="admin-main flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}