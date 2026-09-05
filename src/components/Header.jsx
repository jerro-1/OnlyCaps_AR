import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartPopup from './CartPopup';
import supabase from "../utils/supabase";
import { SessionContext } from "../context/SessionContext";
import HeaderNavLink from './HeaderNavLink';
import ProfileMenu from './ProfileMenu';
import React, { useContext, useState } from "react";
import { BsCart2, BsSearch, BsX } from "react-icons/bs";
import { NavLink } from "react-router-dom";

export default function Header() {
  const { totalItems } = useCart();
  const session = useContext(SessionContext);
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="h-20 w-full bg-[#FAF8F4]/95 backdrop-blur-sm border-b border-[#E4DFD3] fixed top-0 z-50">
        {/* Changed 'max-w-7xl mx-auto' to 'w-full' to allow full width stretching */}
        <nav className="flex justify-between items-center h-full w-full px-6 lg:px-12">

          <ul className="flex gap-8 list-none m-0 p-0">
            <li><HeaderNavLink to="/" linkText="Home" /></li>
            <li><HeaderNavLink to="/fitted-caps" linkText="Shop" /></li>
          </ul>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link to="/">
              <img src="/images/LOGO.png" alt="ONLYCaps" className="h-8"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              <span className="font-heading text-xl tracking-wider hidden text-[#14110D]">ONLYCAPS</span>
            </Link>
          </div>

          <div className="flex items-center gap-7">
            <ul className="flex gap-7 list-none m-0 p-0">
              <li><HeaderNavLink to="/" linkText="About" /></li>
              <li><HeaderNavLink to="/sizing" linkText="Size Guide" /></li>
            </ul>

            <div className="flex items-center gap-5">
              <div className="flex items-center">
                {searchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-40 bg-transparent border-b border-[#14110D] text-sm text-[#14110D] placeholder-[#14110D]/50 focus:outline-none px-1 py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      className="text-[#14110D] hover:text-[#A9824C] transition-colors"
                      aria-label="Close search"
                    >
                      <BsX className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="text-[#14110D] hover:text-[#A9824C] transition-colors"
                    aria-label="Open search"
                  >
                    <BsSearch className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!session && (
                <Link to="/login" className="text-[#14110D] hover:text-[#A9824C] transition-colors" aria-label="Sign in">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}

              {session && <ProfileMenu />}

              <NavLink to="/cartpage" className="relative text-[#14110D] hover:text-[#A9824C] transition-colors">
                <BsCart2 className="h-5 w-5" />
                {session && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#A9824C] text-[#FAF8F4] text-[10px] font-body font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </NavLink>
            </div>
          </div>
        </nav>
      </header>

      <CartPopup />
    </>
  );
}