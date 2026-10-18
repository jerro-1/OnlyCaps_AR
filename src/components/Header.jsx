import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartSidebar from './CartSidebar';
import { SessionContext } from '../context/SessionContext';
import ProfileMenu from './ProfileMenu';
import { useContext, useState } from 'react';
import { BsCart2, BsSearch, BsX, BsList, BsBag } from 'react-icons/bs';

export default function Header() {
  const { totalItems, setCartOpen } = useCart();
  const session = useContext(SessionContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to check if a path is active
  const isActive = path => {
    if (path === '/') return location.pathname === '/';
    if (path === '/#about') return location.hash === '#about' || location.pathname === '/about';
    return location.pathname.startsWith(path);
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  // Active link styles
  const activeLinkClass =
    'text-primary font-semibold relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary';
  const inactiveLinkClass = 'text-base-content hover:text-primary transition-colors';

  return (
    <>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <nav
        className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Mobile menu"
      >
        <ul className="space-y-4">
          <li>
            <Link
              to="/"
              className={`block text-lg font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/fitted-caps"
              className={`block text-lg font-medium transition-colors ${isActive('/fitted-caps') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/fitted-caps') ? 'page' : undefined}
            >
              Shop All
            </Link>
          </li>
          <li>
            <Link
              to="/fitted-caps"
              className={`block text-lg font-medium transition-colors ${isActive('/fitted-caps') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/fitted-caps') ? 'page' : undefined}
            >
              Fitted Caps
            </Link>
          </li>
          <li>
            <Link
              to="/a-frames"
              className={`block text-lg font-medium transition-colors ${isActive('/a-frames') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/a-frames') ? 'page' : undefined}
            >
              A-Frames
            </Link>
          </li>
          <li>
            <Link
              to="/trucker"
              className={`block text-lg font-medium transition-colors ${isActive('/trucker') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/trucker') ? 'page' : undefined}
            >
              Trucker
            </Link>
          </li>
          <li>
            <Link
              to="/more-stuff"
              className={`block text-lg font-medium transition-colors ${isActive('/more-stuff') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/more-stuff') ? 'page' : undefined}
            >
              More Stuff
            </Link>
          </li>
          <li>
            <Link
              to="/sizing"
              className={`block text-lg font-medium transition-colors ${isActive('/sizing') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/sizing') ? 'page' : undefined}
            >
              Size Guide
            </Link>
          </li>
          <li>
            <Link
              to="/#about"
              className={`block text-lg font-medium transition-colors ${isActive('/#about') ? 'text-primary' : 'text-base-content hover:text-primary'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/#about') ? 'page' : undefined}
            >
              About Us
            </Link>
          </li>
        </ul>

        <div className="mt-8 pt-8 border-t border-base-300">
          {!session && (
            <Link
              to="/login"
              className="block w-full text-center py-3 px-4 bg-primary text-primary-content rounded-lg font-medium hover:bg-primary/90 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
          {session && (
            <div className="space-y-2">
              <Link
                to="/account"
                className="block w-full text-center py-3 px-4 border border-base-300 rounded-lg font-medium text-base-content hover:bg-base-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Account
              </Link>
              <Link
                to="/orders"
                className="block w-full text-center py-3 px-4 border border-base-300 rounded-lg font-medium text-base-content hover:bg-base-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-base-300">
        <nav
          className="container h-16 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-base-content hover:text-primary transition-colors"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <BsList className="h-6 w-6" />
          </button>

          {/* Logo - Left on mobile, Center on desktop */}
          <Link to="/" className="flex items-center flex-1 md:flex-none" aria-label="OnlyCaps Home">
            <img
              src="/images/LOGO.webp"
              alt="OnlyCaps"
              className="h-10 md:h-12 w-auto"
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
            />
            <span className="font-bold text-xl md:text-2xl tracking-tight text-base-content hidden">
              ONLYCAPS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            <ul className="flex items-center gap-6 list-none m-0 p-0">
              <li>
                <Link
                  to="/fitted-caps"
                  className={isActive('/fitted-caps') ? activeLinkClass : inactiveLinkClass}
                  aria-current={isActive('/fitted-caps') ? 'page' : undefined}
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  to="/sizing"
                  className={isActive('/sizing') ? activeLinkClass : inactiveLinkClass}
                  aria-current={isActive('/sizing') ? 'page' : undefined}
                >
                  Size Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className={isActive('/#about') ? activeLinkClass : inactiveLinkClass}
                  aria-current={isActive('/#about') ? 'page' : undefined}
                >
                  Abouts
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search Button - Mobile */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 text-base-content hover:text-primary transition-colors"
              aria-label="Search"
            >
              <BsSearch className="h-5 w-5" />
            </button>

            {/* Auth / Profile */}
            <div className="hidden md:flex md:items-center md:gap-4">
              {!session && (
                <Link
                  to="/login"
                  className="text-sm font-medium text-base-content hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
              )}
              {session && <ProfileMenu />}
            </div>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-base-content hover:text-primary transition-colors"
              aria-label={`Shopping cart${totalItems > 0 ? ` with ${totalItems} items` : ''}`}
            >
              <BsBag className="h-5 w-5 md:h-6 md:w-6" />
              {session && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Search Bar - Mobile */}
        {searchOpen && (
          <div className="md:hidden border-t border-base-300 px-4 py-3 bg-white">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 border border-base-300 rounded-lg text-sm text-base-content placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 text-base-content hover:text-primary transition-colors"
                aria-label="Close search"
              >
                <BsX className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </header>
    </>
  );
}
