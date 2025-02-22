import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import config from '../config/config.js';

// JWT Token oluşturma
const generateToken = (id) => {
    try {
        return jwt.sign({ id }, config.jwtSecret, {
            expiresIn: '30d',
        });
    } catch (error) {
        console.error('Token generation error:', error);
        throw error;
    }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
        res.status(401);
        throw new Error('Geçersiz kullanıcı adı veya şifre');
    }

    if (!user.isActive) {
        res.status(403);
        throw new Error('Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.');
    }

    if (await user.matchPassword(password)) {
        // Son giriş tarihini güncelle
        user.lastLogin = Date.now();
        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            permissions: user.permissions,
            isActive: user.isActive,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Geçersiz kullanıcı adı veya şifre');
    }
});

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName, role, permissions } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
        res.status(400);
        throw new Error('Bu kullanıcı adı veya email zaten kullanımda');
    }

    const user = await User.create({
        username,
        email,
        password,
        fullName,
        role,
        permissions
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            permissions: user.permissions
        });
    } else {
        res.status(400);
        throw new Error('Geçersiz kullanıcı bilgileri');
    }
});

// @desc    Kullanıcı bilgilerini getir
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            permissions: user.permissions
        });
    } else {
        res.status(404);
        throw new Error('Kullanıcı bulunamadı');
    }
});

// @desc    Tüm kullanıcıları getir
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @desc    Kullanıcı sil
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.remove();
        res.json({ message: 'Kullanıcı silindi' });
    } else {
        res.status(404);
        throw new Error('Kullanıcı bulunamadı');
    }
});

// @desc    Kullanıcı güncelle
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.fullName = req.body.fullName || user.fullName;
        user.role = req.body.role || user.role;
        user.permissions = req.body.permissions || user.permissions;
        user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            role: updatedUser.role,
            permissions: updatedUser.permissions,
            isActive: updatedUser.isActive
        });
    } else {
        res.status(404);
        throw new Error('Kullanıcı bulunamadı');
    }
});

export {
    loginUser,
    registerUser,
    getUserProfile,
    getUsers,
    deleteUser,
    updateUser
};
