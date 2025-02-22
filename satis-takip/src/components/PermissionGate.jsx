import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Result } from 'antd';

const PermissionGate = ({ permission, children }) => {
    const { hasPermission } = useAuth();

    if (!hasPermission(permission)) {
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

export default PermissionGate;
