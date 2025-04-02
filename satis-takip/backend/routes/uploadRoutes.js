import express from 'express';
import { upload, uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Resim yükleme route'u
router.post('/image', protect, (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    // Multer hata vermezse kontrolcüyü çağır
    uploadImage(req, res);
  });
});

export default router;
