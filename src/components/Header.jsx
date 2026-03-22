import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartPopup from './CartPopup';
import supabase from "../utils/supabase";
import { SessionContext } from "../context/SessionContext";
import HeaderNavLink from './HeaderNavLink';
import React, { useEffect, useContext, useState } from "react";


export default function Header() {
  const { totalItems, setCartOpen } = useCart();
  const session = useContext(SessionContext);


  let navigate = useNavigate();




  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    if (!session) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles") // your table
        .select("firstname, lastname") // match your column names exactly
        .eq("id", session.user.id) // make sure this is the same column as in your table
        .single();

      if (error) {
        console.log("Error fetching profile:", error.message);
      } else if (data) {
        // get first letters of firstname and lastname
        const initials =
          (data.firstname?.[0] ?? "") + (data.lastname?.[0] ?? "");
       //  setProfileInitials(initials.toUpperCase());
      }
    };
    fetchProfile();
  }, [session]);

  return (
    <>
      <header className="w-full bg-white shadow-sm fixed top-0 z-50 py-3">
        <nav className="flex justify-between items-center navbar-padding">
          {/* Left Nav */}
          <ul className="flex gap-8 text-base tracking-wide font-medium list-none m-0 p-0">
            <li><Link to="/" className="nav-link">HOME</Link></li>
            <li><a href="#" className="nav-link">SHOP</a></li>
            <li><a href="#" className="nav-link">FITTING RECOMMENDATION</a></li>
          </ul>

          {/* Center Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link to="/">
              <img src="/images/LOGO.png" alt="ONLYCaps" className="logo-img"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              <span className="font-heading text-2xl tracking-wider hidden">ONLYCAPS</span>
            </Link>
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-6">
            <ul className="flex gap-6 text-base tracking-wide font-medium mr-4 list-none m-0 p-0">
              <li><a href="#about" className="nav-link">ABOUT</a></li>

              {session && (
              <li><HeaderNavLink to="/account" linkText="ACCOUNT" /></li>
              )}
              <li><a href="#" className="nav-link">CAP MEASUREMENT</a></li>
            </ul>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <Link to="/login" className="profile-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              <button className="relative cursor-pointer bg-transparent border-none p-0" onClick={() => setCartOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="cart-count-badge">{totalItems}</span>
                )}
              </button>
            </div>

            {/* Auth buttons */}
            {session && (
              <div className="flex items-center gap-3">

                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition border-none cursor-pointer"
                >
                  LOGOUT
                </button>

              </div>

            )}
            {!session && (
              <Link
                to="/login"
                className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition no-underline"
              >
                LOGIN
              </Link>
            )}
          </div>
        </nav>
      </header>

      <CartPopup />
    </>
  );
}
