import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API base URL'ini ayarla
axios.defaults.baseURL = 'http://localhost:5000';

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  updateUserInfo: () => {},
  isAuthenticated: false,
  loading: true,
  hasPermission: () => false
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Sayfa yenilendiğinde localStorage'dan kullanıcı bilgilerini al
    const userFromStorage = localStorage.getItem('user');
    const tokenFromStorage = localStorage.getItem('userToken');
    if (userFromStorage && tokenFromStorage) {
      const parsedUser = JSON.parse(userFromStorage);
      
      // Kullanıcı pasif durumdaysa oturumu sonlandır
      if (!parsedUser.isActive) {
        logout();
        return;
      }
      
      setUser(parsedUser);
      setToken(tokenFromStorage);
      // Axios için default Authorization header'ı ayarla
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`;
    }
    setLoading(false);
  }, []);

  const login = async (userData, token) => {
    if (!userData || !token) {
      return { success: false, error: 'Geçersiz kullanıcı bilgileri' };
    }

    try {
      setToken(token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 2FA kontrolü - etkinleştirilmemişse ayarlar sayfasına yönlendir
      if (!userData.twoFactorEnabled) {
        navigate('/settings');
      } else {
        navigate('/');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Giriş başarısız' };
    }
  };

  const updateUserInfo = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
    // LocalStorage'ı da güncelle
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...storedUser,
      ...updatedUserData
    }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions[permission];
  };

  const value = {
    user,
    login,
    logout,
    hasPermission,
    updateUserInfo,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
