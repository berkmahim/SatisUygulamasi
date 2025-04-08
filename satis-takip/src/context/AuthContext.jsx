import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd';

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

  // Axios interceptor for token expiry
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // API isteği sırasında herhangi bir hata oluşursa
        if (error.response) {
          // 401 Unauthorized hatası - token süresi dolmuş veya geçersiz
          if (error.response.status === 401) {
            // Eğer zaten login sayfasında değilsek, logout işlemi gerçekleştir
            if (window.location.pathname !== '/login') {
              // Kullanıcıya bilgi mesajı göster
              console.log('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
              
              // Yerel depolamadan kullanıcı verilerini temizle
              localStorage.removeItem('user');
              localStorage.removeItem('userToken');
              
              // Axios headers'dan authorization token'ı temizle
              delete axios.defaults.headers.common['Authorization'];
              
              // Uygulama state'ini temizle
              setUser(null);
              setToken(null);
              
              // Kullanıcıya görsel bildirim göster
              message.warning({
                content: 'Oturum süreniz doldu. Giriş ekranına yönlendiriliyorsunuz...',
                duration: 3,  // 3 saniye göster
                onClose: () => {
                  // Mesaj kapandıktan sonra kullanıcıyı login sayfasına yönlendir
                  navigate('/login', { 
                    state: { 
                      message: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' 
                    } 
                  });
                }
              });
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // Component unmount olduğunda interceptor'u temizle
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  useEffect(() => {
    // Sayfa yenilendiğinde localStorage'dan kullanıcı bilgilerini al
    const userFromStorage = localStorage.getItem('user');
    const tokenFromStorage = localStorage.getItem('userToken');
    if (userFromStorage && tokenFromStorage) {
      const parsedUser = JSON.parse(userFromStorage);
      
      // Kullanıcı pasif durumdaysa oturumu sonlandır
      if (!parsedUser.isActive) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
        return;
      }
      
      setUser(parsedUser);
      setToken(tokenFromStorage);
      // Axios için default Authorization header'ı ayarla
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`;
    }
    setLoading(false);
  }, [navigate]);

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

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions[permission];
  };

  const value = {
    user,
    login,
    logout: () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login');
    },
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
