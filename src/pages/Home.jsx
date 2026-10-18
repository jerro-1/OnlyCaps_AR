import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CategoryPreview from '../components/CategoryPreview';
import { useEffect, useState, useContext } from 'react';
import supabase from '../utils/supabase';
import { SessionContext } from '../context/SessionContext';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, full_name, price, image, category')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) {
          console.error('Error fetching featured products:', error);
        } else if (data) {
          setFeaturedProducts(data);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero Section - Clean and Simple */}
        <section className="section bg-base-100">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center py-12 md:py-20">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content tracking-tight mb-6 leading-tight">
                Premium Fitted Caps
              </h1>
              <p className="text-lg md:text-xl text-base-content/70 mb-8 max-w-2xl mx-auto leading-relaxed">
                Discover the perfect fit with our curated collection of authentic fitted baseball
                caps and exclusive designs.
              </p>
              <Link
                to="/fitted-caps"
                className="inline-flex items-center gap-2 btn btn-primary btn-premium btn-lg btn-fluid"
              >
                Shop Collection
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="divider mx-auto max-w-screen-xl" />

        {/* Categories Section */}
        <section className="section">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-3">
                Shop by Category
              </h2>
              <p className="text-base-content/60">Find your perfect style</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <CategoryLink
                title="Fitted Caps"
                description="Classic fitted styles"
                href="/fitted-caps"
                icon="🧢"
              />
              <CategoryLink
                title="A-Frames"
                description="Structured 5-panel caps"
                href="/a-frames"
                icon="🏗️"
              />
              <CategoryLink
                title="Trucker"
                description="Mesh back classics"
                href="/trucker"
                icon="🚛"
              />
              <CategoryLink
                title="More Stuff"
                description="Accessories & more"
                href="/more-stuff"
                icon="📦"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="divider mx-auto max-w-screen-xl" />

        {/* Featured Products */}
        <section className="section bg-base-100">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-2">
                  Featured Products
                </h2>
                <p className="text-base-content/60">Latest drops and best sellers</p>
              </div>
              <Link to="/fitted-caps" className="btn btn-ghost mt-4 md:mt-0">
                View All
                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="product-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="aspect-square loading-skeleton" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 loading-skeleton" />
                      <div className="h-4 w-1/2 loading-skeleton" />
                      <div className="h-5 w-24 loading-skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-base-content/60">No products available at the moment.</p>
              </div>
            ) : (
              <div className="product-grid">
                {featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <hr className="divider mx-auto max-w-screen-xl" />

        {/* About Section - Simple */}
        <section className="section">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-6">
                About OnlyCaps
              </h2>
              <div className="prose text-base-content/70 space-y-4">
                <p>
                  Founded with a simple passion: providing the perfect fitted cap for every head.
                  What started as a small collection of premium fitted caps has grown into a curated
                  destination for headwear enthusiasts.
                </p>
                <p>
                  We believe that a cap isn't just an accessory—it's a statement. Whether you're
                  repping your favorite team, expressing your personal style, or looking for that
                  perfect everyday fit, OnlyCaps delivers quality, authenticity, and style.
                </p>
              </div>
              <Link to="/#about" className="mt-8 inline-flex items-center gap-2 btn btn-outline">
                Learn More
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter Signup - Simple */}
        <section className="section bg-base-100">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-base-content mb-3">
                Stay Updated
              </h3>
              <p className="text-base-content/60 mb-6">
                Get notified about new drops and exclusive offers.
              </p>
              <form
                className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
                onSubmit={e => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 input py-3"
                  required
                />
                <button type="submit" className="btn btn-primary px-6 py-3 whitespace-nowrap">
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-base-content/50 mt-3">No spam, unsubscribe anytime.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

// Simple category link component
function CategoryLink({ title, description, href, icon }) {
  return (
    <Link
      to={href}
      className="card p-6 text-center hover:border-primary hover:shadow-lg transition-all duration-200 group"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-base-content mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-base-content/60">{description}</p>
    </Link>
  );
}

// Simple product card for homepage
function ProductCard({ product }) {
  const formatPrice = price => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Link
      to={`/product/${product.product_id ?? product.id}`}
      className="card overflow-hidden block h-full"
    >
      <div className="relative aspect-square bg-base-100 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.full_name ?? product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-300">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 left-3 badge badge-info text-xs">
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-base-content line-clamp-1 mb-1">
          {product.full_name ?? product.name}
        </h3>
        <p className="text-lg font-bold text-base-content">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
