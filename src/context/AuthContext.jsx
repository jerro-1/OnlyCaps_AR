import { createContext, useContext, useState } from 'react';
import React from 'react';

const AuthContext = createContext(null);

export const USERS = [
  {
    email: 'john.doe@email.com',
    password: 'john123',
    name: 'John',
    fullName: 'John Doe',
    memberSince: 'January 2024',
    rank: 'GOLD',
    avatar: 'J',
    orders: 15,
    wishlist: 8,
    reviews: 3,
  },
  {
    email: 'jerro.smith@email.com',
    password: 'jerro456',
    name: 'Jerro',
    fullName: 'Jerro Smith',
    memberSince: 'March 2024',
    rank: 'SILVER',
    avatar: 'J',
    orders: 8,
    wishlist: 12,
    reviews: 5,
  },
  {
    email: 'michael.wilson@email.com',
    password: 'michael789',
    name: 'Michael',
    fullName: 'Michael Wilson',
    memberSince: 'June 2024',
    rank: 'BRONZE',
    avatar: 'M',
    orders: 3,
    wishlist: 5,
    reviews: 1,
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('onlycaps_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (email, password) => {
    const found = USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const userData = { ...found, isLoggedIn: true, loginTime: new Date().toISOString() };
      delete userData.password;
      localStorage.setItem('onlycaps_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    }
    return { success: false };
  };

  const logout = () => {
    localStorage.removeItem('onlycaps_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
