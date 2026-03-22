import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Login() {
  const { login } = useAuth();
  const { showNotification } = useCart();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }
    const result = login(email, password);
    if (result.success) {
      showNotification(`Welcome back, ${result.user.name}!`, 'success');
      setTimeout(() => navigate('/'), 1500);
    } else {
      showNotification('Invalid email or password', 'error');
    }
  };

  const fillCredentials = (e, pw) => {
    setEmail(e);
    setPassword(pw);
  };

  return (
    <div className="login-background font-body">
      {/* Return button */}
      <Link to="/" className="return-home-btn">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Return to Homepage
      </Link>

      <section className="w-full flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-heading text-center mb-2 tracking-wide uppercase">LOGIN</h2>
            <p className="text-gray-600 text-center mb-8">Access your ONLYCaps account</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember me</label>
              </div>
              <button
                type="submit"
                className="btn-hover w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition text-base border-none cursor-pointer"
              >
                SIGN IN
              </button>
            </form>

            {/* Quick accounts */}
            <div className="mt-8">
              <p className="text-sm text-gray-600 mb-3 text-center">Quick login with test accounts:</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="account-box gold" onClick={() => fillCredentials('john.doe@email.com', 'john123')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">👤 John</p>
                      <p className="text-xs text-gray-500">GOLD Member</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Click to use</span>
                  </div>
                </div>
                <div className="account-box silver" onClick={() => fillCredentials('jerro.smith@email.com', 'jerro456')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">👤 Jerro</p>
                      <p className="text-xs text-gray-500">SILVER Member</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">Click to use</span>
                  </div>
                </div>
                <div className="account-box bronze" onClick={() => fillCredentials('michael.wilson@email.com', 'michael789')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">👤 Michael</p>
                      <p className="text-xs text-gray-500">BRONZE Member</p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Click to use</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <Link to="/register" className="text-sm text-blue-600 hover:text-blue-800">
                Don't have an account? Register
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
