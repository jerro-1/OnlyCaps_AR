import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { SessionContext } from './context/SessionContext';
import { useEffect, useState } from "react";
import Header from './components/Header';
import Main from './components/Main';
import Notification from './components/Notification';
import Home from './pages/Home';
import FittedCaps from './pages/FittedCaps';
import AFrames from './pages/AFrames';
import Trucker from './pages/Trucker';
import MoreStuff from './pages/MoreStuff';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import "./App.css";
import supabase from './utils/supabase';
import React from 'react';
import CartPage from './pages/CartPage';
import RegisterEmail from './pages/RegisterEmail';
import VerifyEmail from './pages/VerifyEmail';
import Orders from './pages/Orders';
import Admin from './pages/Admin';




export default function App() {
  return (

    <AuthProvider>
      <AppInner />
    </AuthProvider>

  );
}

function AppInner() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    // call unsubscribe to remove the callback
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log("session from app.jsx", session);
  }, [session]);


  return (
    <SessionContext.Provider value={session}>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fitted-caps" element={<FittedCaps />} />
          <Route path="/a-frames" element={<AFrames />} />
          <Route path="/trucker" element={<Trucker />} />
          <Route path="/more-stuff" element={<MoreStuff />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route path="/cartpage" element={<CartPage />} />
          <Route path="/register-email" element={<RegisterEmail />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </CartProvider>
    </SessionContext.Provider>
  );
}
