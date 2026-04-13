import { Link } from 'react-router-dom';
import Header from '../components/Header';


export default function Home() {
  return (
    <>
      <Header />
      <div className="bg-black text-white font-body pt-16">

        {/* Hero Section */}
        <section className="relative flex items-center w-full hero-short hero-background" style={{ marginTop: 0 }}>
          <div className="flex flex-col justify-center items-start px-10 md:px-20 w-full md:w-2/3 lg:w-1/2 h-full relative z-10">
            <h1 className="float-heading text-7xl md:text-8xl lg:text-9xl font-heading mb-4 tracking-wide text-white uppercase leading-tight"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              FITTED CAPS
            </h1>
            <p className="text-white text-base md:text-lg max-w-xl leading-relaxed mb-6"
              style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
              Discover the perfect fit with our premium collection of of<br />
              authentic fitted baseball caps and exclusive designs.
            </p>
            <Link
              to="/fitted-caps"
              className="btn-hover bg-white text-black px-8 py-3 md:px-10 md:py-4 rounded-full font-medium hover:bg-gray-200 transition text-sm md:text-base tracking-wide inline-block shadow-lg no-underline"
            >
              SHOP COLLECTION
            </Link>
          </div>
        </section>

        {/* Divider */}
        <div className="section-divider bg-white" />

        {/* 4-Grid Sections */}
        <section className="w-full dissolve-section">
          <div className="grid grid-cols-2 grid-rows-2 h-screen">
            {/* Fitted Caps */}
            <Link to="/fitted-caps" className="clickable-section relative grid-section-1 grid-border-right grid-border-bottom flex items-center justify-center p-10 no-underline">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="grid-text text-5xl md:text-6xl font-heading mb-6 tracking-wide text-white uppercase">FITTED CAPS</h2>
                <div className="grid-btn btn-hover bg-white text-black px-8 py-3 rounded-full font-medium text-sm tracking-wide inline-block">SHOP NOW</div>
              </div>
            </Link>

            {/* A-Frames */}
            <Link to="/a-frames" className="clickable-section relative grid-section-2 grid-border-bottom flex items-center justify-center p-10 no-underline">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="grid-text text-5xl md:text-6xl font-heading mb-6 tracking-wide text-white uppercase">A-FRAMES</h2>
                <div className="grid-btn btn-hover bg-white text-black px-8 py-3 rounded-full font-medium text-sm tracking-wide inline-block">SHOP NOW</div>
              </div>
            </Link>

            {/* Trucker */}
            <Link to="/trucker" className="clickable-section relative grid-section-3 grid-border-right flex items-center justify-center p-10 no-underline">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="grid-text text-5xl md:text-6xl font-heading mb-6 tracking-wide text-white uppercase">TRUCKER</h2>
                <div className="grid-btn btn-hover bg-white text-black px-8 py-3 rounded-full font-medium text-sm tracking-wide inline-block">SHOP NOW</div>
              </div>
            </Link>

            {/* More Stuff */}
            <Link to="/more-stuff" className="clickable-section relative grid-section-4 flex items-center justify-center p-10 no-underline">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="grid-text text-5xl md:text-6xl font-heading mb-6 tracking-wide text-white uppercase">MORE STUFF</h2>
                <div className="grid-btn btn-hover bg-white text-black px-8 py-3 rounded-full font-medium text-sm tracking-wide inline-block">SHOP NOW</div>
              </div>
            </Link>
          </div>
        </section>

        {/* Divider */}
        <div className="section-divider" />

        {/* About Section */}
        <section id="about" className="about-background min-h-screen flex items-center py-20 dissolve-section">
          <div className="container mx-auto px-4 md:px-20 relative z-10">
            <div className="flex justify-end">
              <div className="w-full md:w-1/2 lg:w-1/2">
                <h2 className="font-heading text-black uppercase mb-12 tracking-wide"
                  style={{ fontSize: '5rem', lineHeight: 1.1, letterSpacing: 2 }}>
                  ABOUT US
                </h2>
                <p className="text-black text-lg md:text-xl leading-relaxed mb-6">
                  Founded in 2024, ONLYCaps was born from a simple passion: providing the perfect fitted cap for every head. What started as a small collection of premium MLB fitted caps has grown into a curated destination for headwear enthusiasts.
                </p>
                <p className="text-black text-lg md:text-xl leading-relaxed mb-10">
                  We believe that a cap isn't just an accessory—it's a statement. Whether you're repping your favorite team, expressing your personal style, or looking for that perfect everyday fit, ONLYCaps delivers quality, authenticity, and style.
                </p>
                <a href="#" className="inline-block bg-black text-white px-10 py-4 rounded-full font-medium hover:bg-gray-800 transition text-base tracking-wide no-underline">
                  LEARN MORE
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact + Socials */}
        <div className="contact-socials-section dissolve-section">
          <div className="inner w-full max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-10">
              {/* Contact */}
              <div className="flex-1">
                <h3 className="contact-title">CONTACT</h3>
                <div className="contact-info">📞 +1 (800) 555-0123</div>
                <div className="contact-info">✉️ hello@onlycaps.com</div>
                <div className="contact-info">📍 123 Cap Street, Fashion District</div>
                <div className="contact-info">🕒 Mon-Fri: 9AM - 6PM EST</div>
              </div>

              <div className="hidden md:block w-px h-32 bg-white/30 mx-12" />

              {/* Socials */}
              <div className="flex-1">
                <h3 className="contact-title">SOCIALS</h3>
                <div className="social-icons">
                  {/* Facebook */}
                  <a href="#" className="social-icon">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  {/* Instagram */}
                  <a href="#" className="social-icon">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465.66.256 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.903 4.903 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.903 4.903 0 01-1.772-1.153 4.903 4.903 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.903 4.903 0 011.153-1.772A4.903 4.903 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.08 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                    </svg>
                  </a>
                  {/* Twitter/X */}
                  <a href="#" className="social-icon">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.523-12.245 10.025 10.025 0 002.457-2.551z" />
                    </svg>
                  </a>
                  {/* LinkedIn */}
                  <a href="#" className="social-icon">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z" />
                    </svg>
                  </a>
                  {/* GitHub */}
                  <a href="#" className="social-icon">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387.6.113.82-.26.82-.58 0-.287-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.39-1.335-1.76-1.335-1.76-1.09-.746.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.418-1.306.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.698.83.578C20.565 21.795 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
                <div className="mt-6">
                  <p className="text-gray-400 text-sm">Follow us for latest drops</p>
                  <p className="text-gray-400 text-sm mt-1">@onlycaps_official</p>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center border-t border-gray-700 pt-6">
              <p className="text-gray-500 text-sm">© 2024 ONLYCaps. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
