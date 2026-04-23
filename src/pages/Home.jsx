import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShopButn from '../components/ShopButn';
import { FaceDetector } from '@mediapipe/tasks-vision';

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
            <p className="text-white text-base md:text-lg max-w-xl leading-relaxed mb-6 font-thin"
              style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
              Discover the perfect fit with our premium collection of<br />
              authentic fitted baseball caps and exclusive designs.
            </p>
            <Link
              to="/fitted-caps"
              className="btn-hover bg-white text-black px-8 py-3 md:px-10 md:py-4 rounded-full font-thin hover:bg-gray-200 transition text-sm md:text-base tracking-wide inline-block shadow-lg no-underline"
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
                <ShopButn>SHOP NOW</ShopButn >
              </div>
            </Link>

            {/* A-Frames */}
            <Link to="/a-frames" className="clickable-section relative grid-section-2 grid-border-bottom flex items-center justify-center p-10 no-underline">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="grid-text text-5xl md:text-6xl font-heading mb-6 tracking-wide text-white uppercase">A-FRAMES</h2>
                <ShopButn>SHOP NOW</ShopButn >
              </div>
            </Link>

            {/* Trucker */}
            <Link to="/trucker" className="clickable-section relative grid-section-3 grid-border-right flex items-center justify-center p-10 no-underline">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="grid-text text-5xl md:text-6xl font-heading mb-6 tracking-wide text-white uppercase">TRUCKER</h2>
                <ShopButn>SHOP NOW</ShopButn >
              </div>
            </Link>

            {/* More Stuff */}
            <Link to="/more-stuff" className="clickable-section relative grid-section-4 flex items-center justify-center p-10 no-underline">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="grid-text text-5xl md:text-6xl font-heading mb-6 tracking-wide text-white uppercase">MORE STUFF</h2>
                <ShopButn>SHOP NOW</ShopButn >
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
                <a href="#about" className="inline-block bg-black text-white px-10 py-4 rounded-full font-medium hover:bg-gray-800 transition text-base tracking-wide no-underline">
                  LEARN MORE
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact + Socials */}

      </div>
      <Footer />
    </>
  );
}
