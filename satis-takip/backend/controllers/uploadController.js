import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';

// Doğru __dirname değerini almak için
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: 'dp4t73ywe', 
  api_key: '164151982898828',
  api_secret: 'ZW7N4-x6KMKxggctYDDQag4KSZk'
});

// Multer için depolama alanı oluşturma
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = join(__dirname, '../uploads');
    // uploads klasörünün varlığını kontrol et, yoksa oluştur
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + getExtension(file.originalname));
  }
});

// Dosya uzantısını alma yardımcı fonksiyonu
const getExtension = (filename) => {
  return filename.substring(filename.lastIndexOf('.'));
};

// Upload fonksiyonu
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Sadece resim dosyaları yükleyebilirsiniz!'), false);
    }
    cb(null, true);
  }
}).single('image');

// Resim yükleme controller'ı
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir resim yükleyin' });
    }

    // Dosya yolunu al
    const filePath = req.file.path;

    // Cloudinary'ye yükle
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'satis-takip',
      use_filename: true
    });

    // Geçici dosyayı sil
    fs.unlinkSync(filePath);

    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id
    });
    
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    res.status(500).json({
      message: 'Resim yüklenirken bir hata oluştu',
      error: error.message
    });
  }
};
