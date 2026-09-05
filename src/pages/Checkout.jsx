import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import supabase from '../utils/supabase';
import { decryptText } from '../utils/encryption';
import Header from '../components/Header';
import BgImg from '../components/BgImg';
import Footer from '../components/Footer';

const SHIPPING_FEE = 75;

const PAYMENT_OPTIONS = [
  { id: 'gcash', label: 'GCash' },
  { id: 'card', label: 'Credit / Debit Card' },
  { id: 'cod', label: 'Cash on Delivery' },
];

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

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [placing, setPlacing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const total = subtotal + SHIPPING_FEE;

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    if (!buyNowItem && cart.length === 0) { navigate('/cartpage'); return; }

    supabase
      .from('profiles')
      .select('firstname, lastname, shipping_address')
      .eq('id', session.user.id)
      .single()
      .then(async ({ data }) => {
        if (data?.firstname || data?.lastname) {
          setFullName(`${data.firstname ?? ''} ${data.lastname ?? ''}`.trim());
        }
        if (data?.shipping_address) {
          try { setAddressLine1(await decryptText(data.shipping_address)); } catch {}
        }
        setLoadingProfile(false);
      });
  }, [session, cart.length, buyNowItem, navigate]);

  const handlePlaceOrder = async () => {
    if (!fullName.trim()) { alert('Please enter your full name'); return; }
    if (!phone.trim()) { alert('Please enter a phone number'); return; }
    if (!addressLine1.trim()) { alert('Please enter your address'); return; }
    if (!city.trim()) { alert('Please enter your city'); return; }
    if (!province.trim()) { alert('Please enter your province'); return; }
    if (!postalCode.trim()) { alert('Please enter your postal code'); return; }
    if (!paymentMethod) { alert('Please select a payment method'); return; }

    setPlacing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          total,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid',
          full_name: fullName,
          phone,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          province,
          postal_code: postalCode,
          shipping_fee: SHIPPING_FEE,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        user_id: session.user.id,
        product_id: item.id,
        name: item.name,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // FIX: only clear the persistent cart if this order actually came from
      // it -- a Buy Now purchase never touched the cart, so there's nothing to clear
      if (!buyNowItem) clearCart();

      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loadingProfile) return null;

  return (
    <BgImg>
      <Header />
      <div className="container mx-auto px-6 pt-28 pb-16 max-w-3xl">
        <p className="text-[#A9824C] text-xs tracking-[0.2em] font-body mb-2">Checkout</p>
        <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-wide text-white mb-8">
          Review &amp; place order
        </h1>

        <div className="bg-[#FAF8F4] rounded-2xl p-7 mb-5">
          <h2 className="font-heading text-lg uppercase tracking-wide text-[#14110D] mb-4">Order items</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={`${item.id}-${item.size}`} className="flex justify-between font-body text-sm">
                <span className="text-[#4A453B]">{item.name} · Size {item.size} × {item.quantity}</span>
                <span className="text-[#14110D] font-medium">₱{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E4DFD3] mt-4 pt-4 space-y-2">
            <div className="flex justify-between font-body text-sm text-[#6B6558]">
              <span>Subtotal</span><span>₱{subtotal}</span>
            </div>
            <div className="flex justify-between font-body text-sm text-[#6B6558]">
              <span>Shipping</span><span>₱{SHIPPING_FEE}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-[#E4DFD3]">
              <span className="font-body text-sm text-[#6B6558]">Total</span>
              <span className="font-heading text-xl text-[#14110D]">₱{total}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#FAF8F4] rounded-2xl p-7 mb-5">
          <h2 className="font-heading text-lg uppercase tracking-wide text-[#14110D] mb-5">Delivery information</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-body text-xs text-[#6B6558] mb-1.5">Full name</label>
              <input
                required
                autoComplete="name"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border-b border-[#D8D2C4] bg-transparent py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-[#6B6558] mb-1.5">Phone number</label>
              <input
                required
                autoComplete="tel"
                placeholder="09XX XXX XXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border-b border-[#D8D2C4] bg-transparent py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-body text-xs text-[#6B6558] mb-1.5">Address line 1</label>
              <input
                required
                autoComplete="address-line1"
                placeholder="Unit / house no., street, barangay"
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                className="w-full border-b border-[#D8D2C4] bg-transparent py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-body text-xs text-[#6B6558] mb-1.5">Address line 2 <span className="text-[#B8B2A3]">(optional)</span></label>
              <input
                autoComplete="address-line2"
                placeholder="Landmark, unit number, etc."
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                className="w-full border-b border-[#D8D2C4] bg-transparent py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-[#6B6558] mb-1.5">City</label>
              <input
                required
                autoComplete="address-level2"
                placeholder="Antipolo"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full border-b border-[#D8D2C4] bg-transparent py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-[#6B6558] mb-1.5">Province</label>
              <input
                required
                autoComplete="address-level1"
                placeholder="Rizal"
                value={province}
                onChange={e => setProvince(e.target.value)}
                className="w-full border-b border-[#D8D2C4] bg-transparent py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-[#6B6558] mb-1.5">Postal code</label>
              <input
                required
                autoComplete="postal-code"
                placeholder="1870"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                className="w-full border-b border-[#D8D2C4] bg-transparent py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#FAF8F4] rounded-2xl p-7 mb-8">
          <h2 className="font-heading text-lg uppercase tracking-wide text-[#14110D] mb-4">Payment method</h2>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map(opt => (
              <label key={opt.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors font-body text-sm ${
                  paymentMethod === opt.id ? 'border-[#A9824C] bg-[#F5EEE2] text-[#14110D]' : 'border-[#E4DFD3] text-[#4A453B] hover:border-[#D8D2C4]'
                }`}>
                {opt.label}
                <input type="radio" name="payment" value={opt.id} checked={paymentMethod === opt.id}
                  onChange={(e) => setPaymentMethod(e.target.value)} className="accent-[#A9824C]" />
              </label>
            ))}
          </div>
        </div>

        <button onClick={handlePlaceOrder} disabled={placing}
          className="w-full py-4 bg-[#14110D] text-[#FAF8F4] rounded-full font-body font-medium text-sm hover:bg-[#2A241C] transition-colors disabled:opacity-50">
          {placing ? 'Placing order...' : `Place order — ₱${total}`}
        </button>
      </div>
      <Footer />
    </BgImg>
  );
}