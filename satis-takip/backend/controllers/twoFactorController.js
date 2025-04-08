import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

// @desc    2FA için gizli anahtar oluştur
// @route   POST /api/auth/2fa/generate
// @access  Private
const generateSecret = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  // Eğer kullanıcının zaten 2FA etkinleştirilmişse hata döndür
  if (user.twoFactorEnabled) {
    res.status(400);
    throw new Error('İki faktörlü kimlik doğrulama zaten etkinleştirilmiş');
  }

  // Gizli anahtar oluştur
  const secret = speakeasy.generateSecret({
    name: `SatisTakip:${user.email}`
  });

  // Gizli anahtarı geçici olarak sakla (tam etkinleştirme için doğrulamadan sonra kalıcı olarak saklanacak)
  user.twoFactorSecret = secret.base32;
  await user.save();

  // QR kodu oluştur
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  res.status(200).json({
    message: 'İki faktörlü kimlik doğrulama için gizli anahtar oluşturuldu',
    secret: secret.base32,
    qrCodeUrl: qrCodeUrl
  });
});

// @desc    2FA'yı doğrula ve etkinleştir
// @route   POST /api/auth/2fa/verify
// @access  Private
const verifyAndEnableTwoFactor = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  // Eğer kullanıcının gizli anahtarı yoksa hata döndür
  if (!user.twoFactorSecret) {
    res.status(400);
    throw new Error('Önce bir gizli anahtar oluşturmalısınız');
  }

  // Token'ı doğrula
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1 // 30 saniyelik bir pencere
  });

  if (!verified) {
    res.status(400);
    throw new Error('Geçersiz doğrulama kodu');
  }

  // Yedek kodları oluştur
  const backupCodes = generateBackupCodes();

  // 2FA'yı etkinleştir
  user.twoFactorEnabled = true;
  user.backupCodes = backupCodes.map(code => ({ code, used: false }));
  await user.save();

  res.status(200).json({
    message: 'İki faktörlü kimlik doğrulama etkinleştirildi',
    backupCodes: backupCodes
  });
});

// @desc    2FA'yı devre dışı bırak
// @route   POST /api/auth/2fa/disable
// @access  Private
const disableTwoFactor = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  // Şifreyi doğrula
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Geçersiz şifre');
  }

  // Eğer 2FA etkinleştirilmemişse hata döndür
  if (!user.twoFactorEnabled) {
    res.status(400);
    throw new Error('İki faktörlü kimlik doğrulama zaten devre dışı');
  }

  // Token'ı doğrula
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1
  });

  if (!verified) {
    res.status(400);
    throw new Error('Geçersiz doğrulama kodu');
  }

  // 2FA'yı devre dışı bırak
  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  user.backupCodes = [];
  await user.save();

  res.status(200).json({
    message: 'İki faktörlü kimlik doğrulama devre dışı bırakıldı'
  });
});

// @desc    Giriş için 2FA doğrulama
// @route   POST /api/auth/2fa/login
// @access  Public
const verifyTwoFactorLogin = asyncHandler(async (req, res) => {
  const { userId, token, isBackupCode } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  let verified = false;

  if (isBackupCode) {
    // Yedek kod doğrulama
    const backupCode = user.backupCodes.find(
      (code) => code.code === token && !code.used
    );

    if (backupCode) {
      verified = true;
      // Yedek kodu kullanıldı olarak işaretle
      backupCode.used = true;
      await user.save();
    }
  } else {
    // TOTP doğrulama
    verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1
    });
  }

  if (!verified) {
    res.status(400);
    throw new Error('Geçersiz doğrulama kodu');
  }

  // Son giriş zamanını güncelle
  user.lastLogin = Date.now();
  await user.save();

  res.status(200).json({
    message: 'İki faktörlü kimlik doğrulama başarılı',
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
});

// @desc    Yeni yedek kodlar oluştur
// @route   POST /api/auth/2fa/backup-codes
// @access  Private
const regenerateBackupCodes = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  // Şifreyi doğrula
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Geçersiz şifre');
  }

  // Eğer 2FA etkinleştirilmemişse hata döndür
  if (!user.twoFactorEnabled) {
    res.status(400);
    throw new Error('İki faktörlü kimlik doğrulama etkinleştirilmemiş');
  }

  // Yedek kodları oluştur
  const backupCodes = generateBackupCodes();
  user.backupCodes = backupCodes.map(code => ({ code, used: false }));
  await user.save();

  res.status(200).json({
    message: 'Yeni yedek kodlar oluşturuldu',
    backupCodes: backupCodes
  });
});

// Yedek kodlar için yardımcı fonksiyon
const generateBackupCodes = () => {
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push(code);
  }
  return backupCodes;
};

export {
  generateSecret,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin,
  regenerateBackupCodes
};
