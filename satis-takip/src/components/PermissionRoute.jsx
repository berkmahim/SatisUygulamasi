import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Result, Spin } from 'antd';

const PermissionRoute = ({ permission, children }) => {
    const { user, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (permission && !hasPermission(permission)) {
        return (
            <Result
                status="403"
                title="Yetkisiz Erişim"
                subTitle="Bu sayfaya erişim yetkiniz bulunmamaktadır."
            />
        );
    }

    return children;
};

export default PermissionRoute;
