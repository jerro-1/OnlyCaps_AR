import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartPopup from './CartPopup';
import supabase from "../utils/supabase";
import { SessionContext } from "../context/SessionContext";
import HeaderNavLink from './HeaderNavLink';
import React, { useState, useEffect, useContext } from "react";
import { BsCart2 } from "react-icons/bs";
import { NavLink } from "react-router-dom";
import { VscAccount } from "react-icons/vsc";


export default function Header() {
  const { totalItems, setCartOpen } = useCart();
  const session = useContext(SessionContext);
  const navigate = useNavigate();
  const [profileInitials, setProfileInitials] = useState("");

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
        setProfileInitials(initials.toUpperCase());
      }
    };

    fetchProfile();
  }, [session]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
    } else {
      navigate("/");
    }
  };


  return (
    <>
      <header className="w-full bg-white shadow-sm fixed top-0 z-50 py-3">
        <nav className="flex justify-between items-center navbar-padding">
          {/* Left Nav */}
          <ul className="flex gap-8 text-base tracking-wide font-medium list-none m-0 p-0">
            <li><HeaderNavLink to="/" linkText="HOME" /></li>
            <li><HeaderNavLink to="/shop" linkText="SHOP" /></li>
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
              <li><HeaderNavLink to="/" linkText="ABOUT" /></li>
              {session && <li><HeaderNavLink to="/account" linkText="ACCOUNT" /></li>}
              <li><HeaderNavLink to="/cap-measurement" linkText="CAP MEASUREMENT" /></li>
            </ul>

            {/* Icons */}

            <div className="flex items-center gap-4">

              {!session && (
                <Link to="/login" className="profile-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}

              {/* testProfile */}
              {session && (
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar bg-[#003a2f] text-[#b38a2c] flex items-center justify-center font-bold">

                    {profileInitials || "AC"}

                  </div>
                  <ul
                    tabIndex="-1"
                    className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                    <li>
                      <a className="justify-between">
                        Profile
                        <span className="badge">New</span>
                      </a>
                    </li>
                    <li><a>Settings</a></li>
                    <li><a>Logout</a></li>
                  </ul>
                </div>
              )}

              <NavLink to="/cartpage" className="relative">
                <BsCart2 className="h-6 w-6 text-gray-700" />

                {/* 👈 Only show cart count if user is logged in */}
                {session && totalItems > 0 && (
                  <span className="cart-count-badge">{totalItems}</span>
                )}
              </NavLink>
            </div>

            {/* Auth buttons */}
            {session ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition border-none cursor-pointer"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition no-underline"
              >
                LOGIN
              </Link>
            )}
          </div>
        </nav >
      </header >

      <CartPopup />
    </>
  );
}