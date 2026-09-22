import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import supabase from '../utils/supabase';
import { callCheckout } from '../utils/checkoutApi';
import { decryptText } from '../utils/encryption';
import { COURIERS, ZONES, ZONE_PRICES, LALAMOVE_PICKUP, shippingFeeFor } from '../utils/shipping';
import { PAYMENT_PROVIDERS } from '../utils/payments';

const inputClass = (invalid) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 font-body text-sm text-[#14110D] placeholder:text-[#9A9488] focus:outline-none focus:ring-1 transition-colors ${
    invalid ? 'border-[#B8544A] focus:border-[#B8544A] focus:ring-[#B8544A]' : 'border-[#D8D2C4] focus:border-[#14110D] focus:ring-[#14110D]'
  }`;

const sectionHeading = 'font-body font-bold text-[15px] text-[#14110D]';

export default function Checkout() {
  const { cart, subtotal: cartSubtotal, clearCart } = useCart();
  const session = useContext(SessionContext);
  const navigate = useNavigate();
  const location = useLocation();

  // FIX: if we arrived via a "Buy Now" click, use that single item instead
  // of the persistent cart -- it was never added to the cart in the first place
  const buyNowItem = location.state?.buyNowItem || null;
  const items = buyNowItem ? [buyNowItem] : cart;
  const subtotal = buyNowItem ? buyNowItem.price * buyNowItem.quantity : cartSubtotal;

  // Delivery fields are uncontrolled (name + defaultValue, read via FormData on
  // submit); shipping method/zone, street validity and payment method drive
  // visible UI so they stay as state.
  const [profileDefaults, setProfileDefaults] = useState({ firstname: '', lastname: '', addressLine1: '' });
  const [streetValid, setStreetValid] = useState(true);
  const [shippingCourier, setShippingCourier] = useState('');
  const [shippingZone, setShippingZone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [placing, setPlacing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const shippingFee = shippingFeeFor(shippingCourier, shippingZone); // null until fully chosen
  const shippingReady = shippingCourier === 'lalamove' || (shippingCourier && shippingZone);
  const total = subtotal + (shippingFee ?? 0);

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    if (!buyNowItem && cart.length === 0) { navigate('/cartpage'); return; }

    supabase
      .from('profiles')
      .select('firstname, lastname, shipping_address')
      .eq('id', session.user.id)
      .single()
      .then(async ({ data }) => {
        let addressLine1 = '';
        if (data?.shipping_address) {
          try { addressLine1 = await decryptText(data.shipping_address); } catch { /* keep blank */ }
        }
        setProfileDefaults({
          firstname: data?.firstname ?? '',
          lastname: data?.lastname ?? '',
          addressLine1,
        });
        setLoadingProfile(false);
      });
  }, [session, cart.length, buyNowItem, navigate]);

  const validateStreet = (e) => setStreetValid(e.target.value.trim().length > 0);

  const selectCourier = (courierId) => {
    setShippingCourier(courierId);
    if (courierId === 'lalamove') setShippingZone('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    const street = (data.street || '').trim();
    if (!street) { setStreetValid(false); return; }
    if (!data.shipping_method) { alert('Please choose a shipping method'); return; }
    if (data.shipping_method !== 'lalamove' && !data.shipping_zone) { alert('Please select your shipping zone'); return; }
    if (!data.payment_method) { alert('Please select a payment method'); return; }

    setPlacing(true);
    try {
      // The server builds the order from item ids + quantities and prices it itself
      // (including shipping, from the same courier/zone here); online payments are
      // then completed on PayMongo's hosted page.
      const result = await callCheckout({
        action: 'create',
        payment_method: data.payment_method,
        shipping_method: data.shipping_method,
        shipping_zone: data.shipping_zone || null,
        items: items.map(item => ({ id: item.id, size: item.size, quantity: item.quantity })),
        shipping: {
          full_name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          phone: data.phone || '',
          address_line1: street,
          address_line2: data.aptNo || '',
          city: data.city || '',
          province: data.province || '',
          postal_code: data.zipCode || '',
        },
      });

      // Only clear the persistent cart if this order actually came from it
      if (!buyNowItem) clearCart();

      if (result.checkout_url) {
        window.location.assign(result.checkout_url);
        return; // keep the button disabled while the browser navigates away
      }
      navigate(`/order-confirmation/${result.order_id}`);
    } catch (err) {
      alert(err.message);
    }
    setPlacing(false);
  };

  if (loadingProfile) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal, distraction-free header -- just the logo and a way back, no nav/search/cart */}
      <div className="border-b border-[#E4DFD3]">
        <div className="max-w-6xl mx-auto relative flex items-center justify-center py-5 px-6">
          <Link
            to="/"
            className="absolute left-6 flex items-center gap-1.5 font-body text-sm text-[#6B6558] hover:text-[#14110D] transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">Back to home</span>
          </Link>
          <Link to="/">
            <img
              src="/images/LOGO.png"
              alt="ONLYCaps"
              className="h-16"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <span className="font-heading text-xl tracking-wider hidden text-[#14110D]">ONLYCAPS</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:divide-x lg:divide-[#E4DFD3]">
        {/* Left: contact + form */}
        <div className="order-2 lg:order-1 px-6 lg:px-14 py-10">
          <div className="max-w-md ml-auto">

            <div className="flex items-center gap-3 pb-5 mb-7 border-b border-[#E4DFD3]">
              <div className="w-8 h-8 rounded-full bg-[#F0ECE1] flex items-center justify-center font-body text-xs font-semibold text-[#14110D] shrink-0">
                {session?.user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="font-body text-sm text-[#14110D] truncate">{session?.user?.email}</span>
            </div>

            <form onSubmit={handleSubmit}>
              <h2 className={`${sectionHeading} mb-4`}>Delivery</h2>
              <div className="space-y-3 mb-8">
                <select disabled defaultValue="Philippines" className={`${inputClass(false)} text-[#6B6558] cursor-not-allowed`}>
                  <option>Philippines</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <input name="firstName" required autoComplete="given-name" placeholder="First name"
                    defaultValue={profileDefaults.firstname} className={inputClass(false)} />
                  <input name="lastName" required autoComplete="family-name" placeholder="Last name"
                    defaultValue={profileDefaults.lastname} className={inputClass(false)} />
                </div>

                <div>
                  <input name="street" required autoComplete="address-line1" placeholder="Street, building or landmark"
                    defaultValue={profileDefaults.addressLine1} onBlur={validateStreet} onChange={validateStreet}
                    className={inputClass(!streetValid)} />
                  {!streetValid && (
                    <p className="font-body text-xs text-[#B8544A] font-medium mt-1">Please enter your street address</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input name="aptNo" autoComplete="address-line2" placeholder="Apartment, unit (optional)" className={inputClass(false)} />
                  <input name="city" required autoComplete="address-level2" placeholder="City" className={inputClass(false)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input name="zipCode" required autoComplete="postal-code" placeholder="Postal code" className={inputClass(false)} />
                  <input name="province" required autoComplete="address-level1" placeholder="Province" className={inputClass(false)} />
                </div>

                <input name="phone" type="tel" required autoComplete="tel" placeholder="Phone number" className={inputClass(false)} />
              </div>

              <h2 className={`${sectionHeading} mb-3`}>Shipping method</h2>
              <div className="mb-8">
                <div className="grid grid-cols-3 gap-2.5">
                  {COURIERS.map(courier => {
                    const active = shippingCourier === courier.id;
                    return (
                      <label
                        key={courier.id}
                        className={`relative flex flex-col items-center justify-center gap-1.5 h-17 px-2 rounded-lg border bg-white cursor-pointer transition-colors ${
                          active ? 'border-[#14110D] ring-1 ring-[#14110D]' : 'border-[#D8D2C4] hover:border-[#B8B2A3]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping_method"
                          value={courier.id}
                          checked={active}
                          required
                          onChange={() => selectCourier(courier.id)}
                          className="sr-only"
                        />
                        <img
                          src={courier.logo}
                          alt={courier.name}
                          className="h-5 max-w-[85%] object-contain"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                        />
                        <span className="hidden font-body text-xs font-semibold text-[#14110D]">{courier.name}</span>
                        <span className="font-body text-[10px] text-[#6B6558] text-center leading-tight">{courier.eta}</span>
                      </label>
                    );
                  })}
                </div>

                {(shippingCourier === 'jnt' || shippingCourier === 'lbc') && (
                  <select
                    name="shipping_zone"
                    required
                    value={shippingZone}
                    onChange={e => setShippingZone(e.target.value)}
                    className={`${inputClass(false)} mt-3`}
                  >
                    <option value="" disabled>Select your zone…</option>
                    {ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.label} — ₱{ZONE_PRICES[z.id]}</option>
                    ))}
                  </select>
                )}

                {shippingCourier === 'lalamove' && (
                  <div className="mt-3 bg-[#F5F4F1] rounded-lg p-3.5 border border-[#E4DFD3]">
                    <p className="font-body text-xs font-semibold text-[#14110D] mb-1">You book the Lalamove rider</p>
                    <p className="font-body text-xs text-[#6B6558] leading-relaxed mb-2.5">
                      Same-day, priced by distance, so it isn't charged here. After placing this order, book a
                      rider in the Lalamove app using this pickup point — you pay Lalamove directly in the app.
                    </p>
                    <div className="font-body text-xs text-[#14110D] bg-white rounded-md p-2.5 border border-[#E4DFD3]">
                      <p className="font-semibold">{LALAMOVE_PICKUP.name}</p>
                      <p>{LALAMOVE_PICKUP.address}</p>
                      {LALAMOVE_PICKUP.phone && <p>{LALAMOVE_PICKUP.phone}</p>}
                    </div>
                  </div>
                )}
              </div>

              <h2 className={`${sectionHeading} mb-1`}>Payment</h2>
              <p className="font-body text-xs text-[#6B6558] mb-3">All transactions are secure and encrypted.</p>
              <div className="mb-8 rounded-lg border border-[#D8D2C4] overflow-hidden">
                {PAYMENT_PROVIDERS.map((opt, i) => {
                  const active = paymentMethod === opt.id;
                  return (
                    <div key={opt.id} className={i > 0 ? 'border-t border-[#D8D2C4]' : ''}>
                      <label
                        className={`flex items-center justify-between gap-3 px-4 py-3.5 bg-white cursor-pointer transition-colors ${
                          active ? 'ring-1 ring-inset ring-[#14110D]' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="payment_method"
                            value={opt.value}
                            checked={active}
                            required
                            onChange={() => setPaymentMethod(opt.id)}
                            className="accent-[#14110D] shrink-0"
                          />
                          <span className="font-body text-sm text-[#14110D] truncate">{opt.label}</span>
                        </span>
                        {opt.logos.length > 0 && (
                          <span className="flex items-center gap-1.5 shrink-0">
                            {opt.logos.map(src => (
                              <span key={src} className="h-6 px-1 flex items-center justify-center rounded border border-[#E4DFD3] bg-white">
                                <img src={src} alt="" className="h-3.5 max-w-9 object-contain" />
                              </span>
                            ))}
                          </span>
                        )}
                      </label>
                      {active && (
                        <p className="font-body text-xs text-[#6B6558] leading-relaxed bg-[#F5F4F1] px-4 py-3 text-center">
                          {opt.hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button type="submit" disabled={placing || !shippingReady}
                className="w-full py-3.5 bg-[#14110D] text-[#FAF8F4] rounded-lg font-body font-semibold text-sm hover:bg-[#2A241C] transition-colors disabled:opacity-50">
                {placing
                  ? 'Please wait...'
                  : !shippingReady
                    ? 'Choose a shipping method to continue'
                    : paymentMethod === 'cod' || !paymentMethod
                      ? `Place order — ₱${total}`
                      : `Continue to payment — ₱${total}`}
              </button>
            </form>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="order-1 lg:order-2 bg-[#FAFAF8] px-6 lg:px-14 py-10 border-b lg:border-b-0 border-[#E4DFD3]">
          <div className="max-w-md lg:sticky lg:top-10">
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={`${item.id}-${item.size}`} className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg bg-white border border-[#E4DFD3]" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#6B6558] text-white text-[11px] font-body font-semibold flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-[#14110D] truncate">{item.name}</p>
                    <p className="font-body text-xs text-[#6B6558]">Size {item.size}</p>
                  </div>
                  <span className="font-body text-sm text-[#14110D] shrink-0">₱{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-[#E4DFD3] font-body text-sm">
              <div className="flex justify-between text-[#6B6558]">
                <span>Subtotal</span><span className="text-[#14110D]">₱{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#6B6558]">
                <span>Shipping</span>
                <span className="text-[#14110D]">{shippingFee === null ? 'Enter shipping address' : shippingFee === 0 ? 'Paid via Lalamove app' : `₱${shippingFee}`}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-[#E4DFD3]">
                <span className="font-body text-sm font-medium text-[#14110D]">Total</span>
                <span className="font-heading text-xl text-[#14110D]">₱{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
