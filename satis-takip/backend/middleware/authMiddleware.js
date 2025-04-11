import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import config from '../config/config.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, config.jwtSecret);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            // Token hatalarını daha ayrıntılı kontrol edelim
            if (error.name === 'TokenExpiredError') {
                // Token süresi dolmuş - daha az detaylı hata log'u
                console.log('Token süresi doldu. Kullanıcı yeniden giriş yapmalı.');
            } else if (error.name === 'JsonWebTokenError') {
                // Geçersiz token formatı
                console.log('Geçersiz token formatı: ' + error.message);
            } else {
                // Diğer JWT hataları
                console.log('Token doğrulama hatası: ' + error.message);
            }
            
            res.status(401);
            throw new Error('Oturum süresi doldu, lütfen tekrar giriş yapın');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Yetkilendirme token\'ı bulunamadı');
    }
});

// Admin middleware - admin rolüne sahip kullanıcılar için
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        // Admin kullanıcıları için tüm yetkileri aktif edelim
        req.user.permissions = {
            projectManagement: true,
            salesManagement: true,
            customerManagement: true,
            paymentManagement: true,
            reportManagement: true,
            userManagement: true,
            paymentOverdueNotification: true
        };
        next();
    } else {
        res.status(401);
        throw new Error('Admin yetkisi gerekli');
    }
};

// Belirli bir yetki kontrolü yapan middleware
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (req.user && (req.user.role === 'admin' || req.user.permissions[permission])) {
            next();
        } else {
            res.status(401);
            throw new Error('Bu işlem için yetkiniz yok');
        }
    };
};

export { protect, admin, checkPermission };
