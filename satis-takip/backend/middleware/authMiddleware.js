import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
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
            console.error(error);
            res.status(401);
            throw new Error('Token geçersiz');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Yetkilendirme token\'ı bulunamadı');
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        throw new Error('Admin yetkisi gerekli');
    }
};

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
