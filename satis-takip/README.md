# 3D Bina Satış Takip Sistemi

Bu proje, 3D bina modellemesi üzerinden daire satış ve takibini yapabileceğiniz modern bir web uygulamasıdır. React ve Three.js kullanılarak geliştirilmiş frontend ve Node.js/Express ile geliştirilmiş backend'den oluşmaktadır.

## Özellikler

### Mevcut Özellikler

#### 3D Bina Modelleme
- Zemin üzerine blok ekleme
- Blokları üst üste ve yan yana yerleştirme
- Blokları seçme ve düzenleme
- Grid sistemi ile kolay konumlandırma
- Modern 3D görselleştirme

#### Backend API
- MongoDB veritabanı entegrasyonu
- RESTful API endpoints
- Blok CRUD işlemleri

### Planlanan Özellikler

#### Daire Satış Sistemi
- Dairelerin 3D model üzerinde görüntülenmesi
- Daire detay sayfaları
- Satış durumu takibi
- Fiyatlandırma yönetimi

#### Kullanıcı Yönetimi
- Rol bazlı yetkilendirme sistemi (Admin, Satış Temsilcisi, Müşteri)
- Güvenli giriş sistemi
- Kullanıcı profil yönetimi

#### Ödeme Takibi
- Ödeme planı oluşturma
- Taksit takibi
- Otomatik ödeme hatırlatıcıları
- Ödeme raporları

#### Bildirim Sistemi
- Email bildirimleri
- Ödeme hatırlatmaları
- Sistem bildirimleri
- Özelleştirilebilir bildirim tercihleri

#### Log ve Raporlama
- Detaylı sistem logları
- Satış raporları
- Ödeme raporları
- Aktivite takibi

## Proje Yönetimi
- 3D proje görselleştirme
- Blok ve daire yönetimi
- Proje detay sayfası
- Satış durumu takibi

## Müşteri Yönetimi
- Müşteri bilgileri kayıt
- Müşteri listeleme ve arama
- Müşteri detay sayfası

## Satış İşlemleri
- Daire satış/rezervasyon işlemleri
- Ödeme planı oluşturma
  - Peşin
  - Peşin + Taksit
  - Taksit
- Satış listeleme ve filtreleme

## Ödeme Takibi
- Ödeme planına göre tahsilat takibi
- Ödeme durumu (Yapıldı/Yapılmadı)
- Gecikmiş ödemeler takibi
- Ödeme geçmişi

## Raporlama
- Projeye özgü satış raporları
  - Haftalık satış raporu
  - Aylık satış raporu
  - Yıllık satış raporu
- Tahsilat raporları
- Performans analizleri

## Tapu İşlemleri
- Tapu teslim aşamaları takibi
  - Evrak kontrol listesi
  - Noter işlemleri
  - Tapu dairesi işlemleri
  - Tapu teslim durumu

## Yapılacaklar

### 1. Ödeme Takip Sistemi Geliştirmeleri
- [ ] Ödeme planına göre tahsilat durumu gösterimi
- [ ] Gecikmiş ödemelerin vurgulanması
- [ ] Ödeme hatırlatma sistemi
- [ ] Toplu ödeme işlemleri

### 2. Satış Raporlama Sistemi
- [ ] Haftalık satış raporu sayfası
  - Satış sayısı ve ciro
  - Ödeme tiplerine göre dağılım
  - Blok/daire bazlı satış analizi
- [ ] Aylık satış raporu sayfası
  - Aylık performans göstergeleri
  - Hedef gerçekleştirme oranları
  - Trend analizi
- [ ] Yıllık satış raporu sayfası
  - Yıllık satış özeti
  - Karşılaştırmalı analizler
  - Projeksiyon raporları

### 3. Tapu Teslim Süreci Yönetimi
- [ ] Tapu işlem takip sayfası
  - Evrak kontrol listesi
  - Süreç durumu gösterimi
  - Tapu işlem tarihleri
- [ ] Tapu teslim kontrolleri
  - Gerekli evrakların kontrolü
  - Noter randevu takibi
  - Tapu dairesi işlem takibi
- [ ] Tapu teslim raporları
  - Teslim edilen tapular
  - Bekleyen işlemler
  - Süreç analizi

## Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- MongoDB
- npm veya yarn

### Adımlar

1. Projeyi klonlayın:
```bash
git clone [repo-url]
cd satis-takip
```

2. Bağımlılıkları yükleyin:
```bash
# Frontend bağımlılıkları
npm install

# Backend bağımlılıkları
cd backend
npm install
```

3. Çevre değişkenlerini ayarlayın:
`.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:
```env
MONGODB_URI=your_mongodb_uri
PORT=5000
JWT_SECRET=your_jwt_secret
```

4. Uygulamayı başlatın:
```bash
# Development modunda başlatma
npm run dev

# Sadece frontend
npm start

# Sadece backend
npm run server
```

## API Endpoints

### Blok İşlemleri
- `GET /api/blocks` - Tüm blokları listele
- `POST /api/blocks` - Yeni blok ekle
- `PUT /api/blocks/:id` - Blok güncelle
- `DELETE /api/blocks/:id` - Blok sil

### Kullanıcı İşlemleri (Planlanan)
- `POST /api/users/register` - Yeni kullanıcı kaydı
- `POST /api/users/login` - Kullanıcı girişi
- `GET /api/users/profile` - Kullanıcı profili
- `PUT /api/users/profile` - Profil güncelleme

### Daire İşlemleri (Planlanan)
- `GET /api/apartments` - Daireleri listele
- `POST /api/apartments` - Daire ekle
- `PUT /api/apartments/:id` - Daire güncelle
- `DELETE /api/apartments/:id` - Daire sil

### Satış İşlemleri (Planlanan)
- `POST /api/sales` - Satış kaydı oluştur
- `GET /api/sales` - Satışları listele
- `PUT /api/sales/:id` - Satış güncelle
- `DELETE /api/sales/:id` - Satış kaydı sil

### Ödeme İşlemleri (Planlanan)
- `POST /api/payments` - Ödeme kaydı oluştur
- `GET /api/payments` - Ödemeleri listele
- `PUT /api/payments/:id` - Ödeme güncelle

## Teknolojiler

### Frontend
- React
- Three.js
- @react-three/fiber
- @react-three/drei
- Material-UI

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT

## Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## İletişim

Proje Sahibi - [email@example.com]
Proje Linki: [https://github.com/username/repo]
