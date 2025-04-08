import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { message } from 'antd';

const PermissionRoute = ({ children, permission, adminOnly }) => {
  const { user, hasPermission } = useAuth();

  // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
  if (!user) {
    return <Navigate to="/login" />;
  }

  // adminOnly özelliği varsa ve kullanıcı admin değilse erişimi reddet
  if (adminOnly && user.role !== 'admin') {
    message.error('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
    return <Navigate to="/" />;
  }

  // Belirli bir yetki gerekiyorsa ve kullanıcıda yoksa erişimi reddet
  if (permission && !hasPermission(permission)) {
    message.error('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
    return <Navigate to="/" />;
  }

  // Yetki kontrolleri geçildiyse içeriği göster
  return children;
};

export default PermissionRoute;
