import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API base URL'ini ayarla
axios.defaults.baseURL = 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Sayfa yenilendiğinde localStorage'dan kullanıcı bilgilerini al
        const userFromStorage = localStorage.getItem('user');
        if (userFromStorage) {
            const parsedUser = JSON.parse(userFromStorage);
            
            // Kullanıcı pasif durumdaysa oturumu sonlandır
            if (!parsedUser.isActive) {
                logout();
                return;
            }
            
            setUser(parsedUser);
            // Axios için default Authorization header'ı ayarla
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/login', { username, password });
            const userData = response.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            navigate('/');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Giriş başarısız'
            };
        } finally {
            setLoading(false);
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
        localStorage.removeItem('user');
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
        loading
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
