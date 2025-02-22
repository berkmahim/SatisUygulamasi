# Satış Takip Sistemi

İnşaat projelerinin satış ve tahsilat süreçlerini yönetmek için geliştirilmiş web tabanlı bir yönetim sistemi.

## Özellikler

### Proje Yönetimi
- Çoklu proje desteği
- Her proje için küp yönetimi (daire ve dükkan)
- Proje bazlı raporlama ve analiz
- Küp bazlı satış durumu takibi
- 3D proje görselleştirme
- Küp durumlarının renk kodlaması

### Satış Yönetimi
- Müşteri bilgileri yönetimi
- Daire satış işlemleri
- Ödeme planı oluşturma
- Taksit takibi
- Satış sözleşmesi oluşturma
- Toplu taksit ödeme
- Otomatik ödeme hatırlatıcıları

### Tahsilat Takibi
- Ödeme planı takibi
- Tahsilat kaydı
- Gecikmiş ödemeler takibi
- Ödeme durumu raporları
- Türk Lirası formatında para birimi desteği
- Kısmi ödeme ve fazla ödeme yönetimi

### Raporlama
- Genel satış istatistikleri
  - Toplam satış sayısı ve tutarı
  - Tahsil edilen tutar
  - Bekleyen tahsilat
  - Gecikmiş ödemeler
- Aylık satış grafikleri
- Ödeme durumu dağılımı
- Proje bazlı satış raporları
- Küp bazlı doluluk oranları (daire ve dükkan)
- Excel export özelliği
- Özelleştirilebilir rapor filtreleri

### Kullanıcı Arayüzü
- Modern ve kullanıcı dostu tasarım
- Responsive tasarım (mobil uyumlu)
- Kolay navigasyon
- Gelişmiş arama ve filtreleme özellikleri
- Ant Design bileşenleri
- Tema desteği (Açık/Koyu mod)

## Teknolojiler

### Frontend
- React 18
- Vite
- Ant Design 5
- Chart.js
- Axios
- React Router
- React Icons
- date-fns
- Three.js (3D görselleştirme)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS
- dotenv
- node-cron (zamanlanmış görevler)
- multer (dosya yükleme)

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
   - Küpleri (daire ve dükkan) ekleyin

2. Satış İşlemi:
   - Proje detayından ilgili küpü seçin
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

## Öneriler ve Yapılacaklar

### Öncelikli İyileştirmeler
1. **Ödeme Sistemi İyileştirmeleri**
   - Otomatik ödeme planı hesaplayıcı
   - Toplu ödeme alırken taksit seçimi
   - Ödeme geçmişi görüntüleme
   - Ödeme makbuzu oluşturma ve yazdırma

2. **Müşteri Yönetimi**
   - Müşteri portalı oluşturma
   - Müşteri iletişim geçmişi
   - Otomatik e-posta/SMS bildirimleri
   - Müşteri dosya yönetimi

3. **Raporlama Geliştirmeleri**
   - Dashboard özelleştirme
   - Detaylı finansal raporlar
   - PDF rapor çıktısı
   - Özelleştirilebilir grafik seçenekleri

### Teknik İyileştirmeler
1. **Performans**
   - API önbellekleme
   - Sayfalama optimizasyonu
   - Resim optimizasyonu
   - Lazy loading implementasyonu

2. **Güvenlik**
   - JWT authentication
   - Role-based access control
   - API rate limiting
   - Input validasyon geliştirmeleri

3. **Kullanıcı Deneyimi**
   - Gelişmiş hata yönetimi
   - Yükleme durumu göstergeleri
   - Form validasyon mesajları
   - Kullanıcı tercihleri saklama

### Yeni Özellikler
1. **Proje Yönetimi**
   - Proje ilerleme takibi
   - Maliyet yönetimi
   - Takvim entegrasyonu
   - Doküman yönetimi

2. **Satış Araçları**
   - WhatsApp entegrasyonu
   - CRM özellikleri
   - Potansiyel müşteri takibi
   - Satış hedefi takibi

3. **Mobil Uygulama**
   - React Native ile mobil uygulama
   - Offline çalışma modu
   - Push notifications
   - Mobil ödeme alma

4. **Entegrasyonlar**
   - Banka entegrasyonları
   - E-fatura entegrasyonu
   - Google Calendar entegrasyonu
   - Excel toplu veri aktarımı

### Bakım ve Test
1. **Test Kapsamı**
   - Unit testler
   - E2E testler
   - Yük testleri
   - Kullanıcı kabul testleri

2. **Dökümantasyon**
   - API dökümantasyonu
   - Kullanıcı kılavuzu
   - Geliştirici dökümantasyonu
   - Deployment kılavuzu

3. **DevOps**
   - CI/CD pipeline
   - Docker containerization
   - Otomatik yedekleme
   - Monitoring ve logging

Bu öneriler, projenin mevcut durumu ve potansiyel gelişim alanları göz önünde bulundurularak hazırlanmıştır. Öncelik sırası ve implementasyon detayları, projenin ihtiyaçlarına göre ayarlanabilir.

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
