import axios from 'axios';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    // Backend üzerinden yükleme yapıyoruz
    const response = await axios.post(
      '/api/upload/image',
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

export const deleteImage = async (filename) => {
  // Yerel dosya silme işlemi için placeholder
  // Gerekirse backend'de silme endpoint'i oluşturulabilir
  
  if (!filename) return;
  
  try {
    console.log(`${filename} dosyası silinmesi gereken bir işlem.`);
    return true;
  } catch (error) {
    console.error('Resim silme hatası:', error);
    throw new Error('Resim silinirken bir hata oluştu');
  }
};

export const getFilenameFromUrl = (url) => {
  if (!url) return null;
  
  // Yerel dosya URL'sinden dosya adını çıkarma
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  
  return filename;
};
