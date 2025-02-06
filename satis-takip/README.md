# Satış Takip Sistemi

İnşaat projelerinin satış ve tahsilat süreçlerini yönetmek için geliştirilmiş web tabanlı bir yönetim sistemi.

## Özellikler

### Proje Yönetimi
- Çoklu proje desteği
- Her proje için blok ve daire yönetimi
- Proje bazlı raporlama ve analiz
- Blok bazlı satış durumu takibi

### Satış Yönetimi
- Müşteri bilgileri yönetimi
- Daire satış işlemleri
- Ödeme planı oluşturma
- Taksit takibi
- Satış sözleşmesi oluşturma

### Tahsilat Takibi
- Ödeme planı takibi
- Tahsilat kaydı
- Gecikmiş ödemeler takibi
- Ödeme durumu raporları

### Raporlama
- Genel satış istatistikleri
  - Toplam satış sayısı ve tutarı
  - Tahsil edilen tutar
  - Bekleyen tahsilat
  - Gecikmiş ödemeler
- Aylık satış grafikleri
- Ödeme durumu dağılımı
- Proje bazlı satış raporları
- Blok bazlı doluluk oranları

### Kullanıcı Arayüzü
- Modern ve kullanıcı dostu tasarım
- Responsive tasarım (mobil uyumlu)
- Kolay navigasyon
- Gelişmiş arama ve filtreleme özellikleri

## Teknolojiler

### Frontend
- React
- Vite
- TailwindCSS
- Chart.js
- Axios
- React Router
- React Icons
- date-fns

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS
- dotenv

## Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/yourusername/satis-takip.git
cd satis-takip
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. .env dosyasını oluşturun:
```bash
cp .env.example .env
```

4. .env dosyasını düzenleyin:
```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

5. Uygulamayı başlatın:
```bash
npm run dev
```

## Kullanım

1. Proje Oluşturma:
   - "Projeler" sayfasından "Yeni Proje" butonuna tıklayın
   - Proje bilgilerini girin
   - Blokları ve daireleri ekleyin

2. Satış İşlemi:
   - Proje detayından ilgili bloğu seçin
   - Satılacak daireyi seçin
   - Müşteri bilgilerini girin
   - Ödeme planını oluşturun
   - Satış sözleşmesini oluşturun

3. Tahsilat Takibi:
   - "Ödemeler" sayfasından tüm ödemeleri görüntüleyin
   - Yeni tahsilat ekleyin
   - Gecikmiş ödemeleri takip edin

4. Raporlar:
   - Genel satış raporları için "Raporlar" sayfasını kullanın
   - Proje bazlı raporlar için proje detayından "Proje Raporu" butonunu kullanın
   - Grafikleri ve istatistikleri inceleyin

## Katkıda Bulunma

1. Bu repoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Bir Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Proje Sahibi - [@yourusername](https://github.com/yourusername)

Proje Linki: [https://github.com/yourusername/satis-takip](https://github.com/yourusername/satis-takip)
