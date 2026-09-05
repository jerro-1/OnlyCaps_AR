import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineCog, HiOutlineLogout, HiOutlineShieldCheck, HiOutlineClipboardList } from 'react-icons/hi';
import supabase from '../utils/supabase';
import { SessionContext } from '../context/SessionContext';

export default function ProfileMenu() {
  const session = useContext(SessionContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('firstname, lastname, email, role') // FIX: now also selects role
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  const initials =
    ((profile?.firstname?.[0] ?? '') + (profile?.lastname?.[0] ?? '')).toUpperCase() || 'AC';
  const fullName = profile ? `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim() : '';
  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else {
      setOpen(false);
      navigate('/');
    }
  };

  const menuItems = [
    { to: '/account', label: 'Profile', icon: HiOutlineUser },
    { to: '/orders', label: 'Orders', icon: HiOutlineClipboardList },
    { to: '/account', label: 'Settings', icon: HiOutlineCog },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-9 h-9 rounded-full bg-[#14110D] text-[#FAF8F4] flex items-center justify-center text-xs font-body font-semibold transition-all ${
          open
            ? 'ring-2 ring-[#A9824C] ring-offset-2 ring-offset-[#FAF8F4]'
            : 'hover:ring-2 hover:ring-[#D8D2C4] hover:ring-offset-2 hover:ring-offset-[#FAF8F4]'
        }`}
      >
        {initials}
      </button>

      <div
        className={`absolute right-0 mt-4 w-64 origin-top-right transition-all duration-150 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[#FAF8F4] border-t border-l border-[#E4DFD3] rotate-45" />

        <div className="relative bg-[#FAF8F4] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] border border-[#E4DFD3] overflow-hidden">

          <div className="px-5 py-4 bg-[#F0ECE1] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#14110D] text-[#FAF8F4] flex items-center justify-center text-xs font-body font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-[#14110D] truncate">
                {fullName || 'My account'}
              </p>
              <p className="font-body text-xs text-[#6B6558] truncate">
                {profile?.email || session?.user?.email}
              </p>
            </div>
          </div>

          <div className="py-1.5">
            {menuItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm font-body text-[#14110D] hover:bg-[#F0ECE1] transition-colors"
              >
                <Icon className="text-[#A9824C]" size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Admin-only: switch into the admin dashboard, without ever
              losing access to browsing the site as a customer would */}
          {isAdmin && (
            <>
              <div className="h-px bg-[#E4DFD3]" />
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm font-body font-medium text-[#A9824C] hover:bg-[#F5EEE2] transition-colors"
              >
                <HiOutlineShieldCheck size={16} />
                Admin dashboard
              </Link>
            </>
          )}

          <div className="h-px bg-[#E4DFD3]" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-body text-[#B8544A] hover:bg-[#F5E9E7] transition-colors text-left"
          >
            <HiOutlineLogout size={16} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}