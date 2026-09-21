import { Routes, Route } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from "react";
import { CartProvider } from './context/CartContext';
import { SessionContext } from './context/SessionContext';
import supabase from './utils/supabase';
import "./App.css";

// Home loads eagerly (first paint); everything else is split into its own
// chunk and fetched on demand so the first visit downloads far less JS.
import Home from './pages/Home';

const FittedCaps = lazy(() => import('./pages/FittedCaps'));
const AFrames = lazy(() => import('./pages/AFrames'));
const Trucker = lazy(() => import('./pages/Trucker'));
const MoreStuff = lazy(() => import('./pages/MoreStuff'));
const Login = lazy(() => import('./pages/Login'));
const RegisterEmail = lazy(() => import('./pages/RegisterEmail'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const MFASetup = lazy(() => import('./pages/MFASetup'));
const MFAVerify = lazy(() => import('./pages/MFAVerify'));
const Account = lazy(() => import('./pages/Account'));
const Orders = lazy(() => import('./pages/Orders'));
const CartPage = lazy(() => import('./pages/CartPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const CapMeasurement = lazy(() => import('./pages/CapMeasurement'));
const FaceTracker = lazy(() => import('./pages/FaceTracker'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

// Global widgets
import ChatBotWidget from './components/ChatBotWidget';
import Notification from './components/Notification';

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
      <div className="try-on-spinner" />
    </div>
  );
}

export default function App() {
  return <AppInner />;
}

function AppInner() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={session}>
      <CartProvider>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public / guest-accessible */}
          <Route path="/" element={<Home />} />
          <Route path="/fitted-caps" element={<FittedCaps />} />
          <Route path="/a-frames" element={<AFrames />} />
          <Route path="/trucker" element={<Trucker />} />
          <Route path="/more-stuff" element={<MoreStuff />} />
          <Route path="/sizing" element={<CapMeasurement />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/face-tracker" element={<FaceTracker />} />

          {/* Auth flow */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-email" element={<RegisterEmail />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/mfa-setup" element={<MFASetup />} />
          <Route path="/mfa-verify" element={<MFAVerify />} />

          {/* Requires login */}
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/cartpage" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Admin only -- each page checks role itself via AdminLayout */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Routes>
        </Suspense>

        {/* Chatbot floats on every page, guest-accessible (panel note #35) */}
        <ChatBotWidget />
        <Notification />
      </CartProvider>
    </SessionContext.Provider>
  );
}