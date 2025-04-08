import express from 'express';
import {
  generateSecret,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin,
  regenerateBackupCodes
} from '../controllers/twoFactorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// İki faktörlü kimlik doğrulama ayarları
router.post('/generate', protect, generateSecret);
router.post('/verify', protect, verifyAndEnableTwoFactor);
router.post('/disable', protect, disableTwoFactor);
router.post('/backup-codes', protect, regenerateBackupCodes);

// İki faktörlü kimlik doğrulama giriş
router.post('/login', verifyTwoFactorLogin);

export default router;
