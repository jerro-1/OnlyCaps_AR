import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Notification from './components/Notification';
import Home from './pages/Home';
import FittedCaps from './pages/FittedCaps';
import AFrames from './pages/AFrames';
import Trucker from './pages/Trucker';
import MoreStuff from './pages/MoreStuff';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppInner />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppInner() {
  return (
    <>
      <Header />
      <Notification />
      <main style={{ paddingTop: '72px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fitted-caps" element={<FittedCaps />} />
          <Route path="/a-frames" element={<AFrames />} />
          <Route path="/trucker" element={<Trucker />} />
          <Route path="/more-stuff" element={<MoreStuff />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </>
  );
}
