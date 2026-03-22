import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Register() {
  const { showNotification } = useCart();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }
    // In a real app this would hit an API. For now we just show success.
    showNotification('Registration successful! Please log in.', 'success');
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className="page-bg-register font-body">
      <div className="login-card p-12 shadow-xl relative z-10">
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src="/images/LOGO.png"
              alt="ONLY CAPS"
              className="h-24 mx-auto mb-6"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </Link>
          <h1 className="font-heading text-5xl tracking-wide text-gray-900 mt-4">REGISTER NOW!</h1>
          <p className="font-body text-gray-700 text-lg mt-2 tracking-wide">JOIN THE DROP. GET DEALS FIRST.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="font-body text-sm font-semibold tracking-wider text-gray-700 block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-white border-2 border-gray-300 font-body text-gray-800 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
              placeholder="EMAIL"
              required
            />
          </div>
          <div>
            <label className="font-body text-sm font-semibold tracking-wider text-gray-700 block mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white border-2 border-gray-300 font-body text-gray-800 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
              placeholder="PASSWORD"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-heading text-2xl py-5 tracking-widest hover:bg-black transition mt-8 border-none cursor-pointer"
          >
            Register
          </button>
        </form>

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="font-body text-sm font-semibold tracking-wider text-gray-700 border-b-2 border-gray-700 pb-1 hover:text-black hover:border-black no-underline"
          >
            ALREADY HAVE AN ACCOUNT? LOGIN
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-300 text-center">
          <p className="font-body text-xs tracking-widest text-gray-500">ONLY CAPS © 2025 · GEAR DROP</p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="font-body text-xs tracking-wider text-gray-500 hover:text-gray-700 no-underline">
            ← BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
