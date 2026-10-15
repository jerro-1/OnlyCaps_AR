import React from 'react'
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-base-100 border-t border-base-300" role="contentinfo">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4" aria-label="OnlyCaps Home">
              <img
                src="/images/LOGO.webp"
                alt="OnlyCaps"
                className="h-10 w-auto"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="font-bold text-xl tracking-tight text-base-content hidden">ONLYCAPS</span>
            </Link>
            <p className="text-base-content/60 text-sm leading-relaxed mb-6">
              Premium fitted caps and headwear for every style. 
              Quality, authenticity, and the perfect fit.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61578056421668"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OnlyCaps on Facebook"
                className="text-base-content/50 hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a
                href="https://www.instagram.com/__onlycaps/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OnlyCaps on Instagram"
                className="text-base-content/50 hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465.66.256 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.903 4.903 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.903 4.903 0 01-1.772-1.153 4.903 4.903 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.903 4.903 0 011.153-1.772A4.903 4.903 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.08 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OnlyCaps on Twitter"
                className="text-base-content/50 hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.523-12.245 10.025 10.025 0 002.457-2.551z"/></svg>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <nav aria-label="Shop">
            <h3 className="font-semibold text-base-content mb-4">Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/fitted-caps" className="text-base-content/60 hover:text-primary transition-colors text-sm">All Products</Link></li>
              <li><Link to="/fitted-caps" className="text-base-content/60 hover:text-primary transition-colors text-sm">Fitted Caps</Link></li>
              <li><Link to="/a-frames" className="text-base-content/60 hover:text-primary transition-colors text-sm">A-Frames</Link></li>
              <li><Link to="/trucker" className="text-base-content/60 hover:text-primary transition-colors text-sm">Trucker Caps</Link></li>
              <li><Link to="/more-stuff" className="text-base-content/60 hover:text-primary transition-colors text-sm">Accessories</Link></li>
            </ul>
          </nav>

          {/* Support Links */}
          <nav aria-label="Support">
            <h3 className="font-semibold text-base-content mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/sizing" className="text-base-content/60 hover:text-primary transition-colors text-sm">Size Guide</Link></li>
              <li><Link to="/#about" className="text-base-content/60 hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link to="/contact" className="text-base-content/60 hover:text-primary transition-colors text-sm">Contact</Link></li>
              <li><Link to="/faq" className="text-base-content/60 hover:text-primary transition-colors text-sm">FAQ</Link></li>
              <li><Link to="/shipping" className="text-base-content/60 hover:text-primary transition-colors text-sm">Shipping Info</Link></li>
            </ul>
          </nav>

          {/* Account & Contact */}
          <div>
            <h3 className="font-semibold text-base-content mb-4">Account</h3>
            <ul className="space-y-3 mb-8">
              <li><Link to="/login" className="text-base-content/60 hover:text-primary transition-colors text-sm">Sign In</Link></li>
              <li><Link to="/register" className="text-base-content/60 hover:text-primary transition-colors text-sm">Create Account</Link></li>
              <li><Link to="/orders" className="text-base-content/60 hover:text-primary transition-colors text-sm">Order History</Link></li>
              <li><Link to="/account" className="text-base-content/60 hover:text-primary transition-colors text-sm">My Account</Link></li>
            </ul>
            
            <h3 className="font-semibold text-base-content mb-4">Contact</h3>
            <address className="not-italic text-base-content/60 text-sm space-y-2">
              <div>📞 +1 (800) 555-0123</div>
              <div>✉️ hello@onlycaps.com</div>
              <div>🕒 Mon-Fri: 9AM - 6PM EST</div>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-base-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-base-content/50">
            <p>&copy; {currentYear} OnlyCaps. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4 md:justify-end">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/refunds" className="hover:text-primary transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;