import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = 'dp4t73ywe';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // Cloudinary'de preset oluşturabilirsiniz veya API anahtarınızı kullanabilirsiniz

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    // Backend üzerinden yükleme yapıyoruz
    const response = await axios.post(
      'http://localhost:5000/api/upload/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data.url;
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    throw new Error('Resim yüklenirken bir hata oluştu');
  }
};

export const deleteImage = async (publicId) => {
  // Eğer bir görüntüyü silmek isterseniz, bu fonksiyonu kullanabilirsiniz
  // NOT: Bu işlem için imzalı API anahtarlarına ihtiyaç duyacaksınız
  // ve güvenlik nedeniyle sunucu tarafında yapılması önerilir
  
  if (!publicId) return;
  
  try {
    // Bu işlemi genellikle backend üzerinden yapmanız önerilir
    console.log(`${publicId} ID'li görüntü silinmesi gereken bir işlem.`);
    return true;
  } catch (error) {
    console.error('Resim silme hatası:', error);
    throw new Error('Resim silinirken bir hata oluştu');
  }
};

export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  // Cloudinary URL'sinden public ID çıkarma
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  
  return publicId;
};
