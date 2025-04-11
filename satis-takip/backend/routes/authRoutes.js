import express from 'express';
import {
    loginUser,
    registerUser,
    getUserProfile,
    getUsers,
    deleteUser,
    updateUser
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', protect, admin, registerUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, getUsers); // Tüm kullanıcıların erişebilmesi için admin kısıtlamasını kaldırıyoruz
router.delete('/users/:id', protect, admin, deleteUser);
router.put('/users/:id', protect, admin, updateUser);

export default router;
