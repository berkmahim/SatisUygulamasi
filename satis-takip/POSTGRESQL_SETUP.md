# PostgreSQL Geçiş Kılavuzu

Bu kılavuz, mevcut MongoDB veritabanından PostgreSQL'e geçiş için gerekli adımları içerir.

## 1. PostgreSQL Kurulumu

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS (Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### Windows:
PostgreSQL'i [resmi siteden](https://www.postgresql.org/download/windows/) indirin ve kurun.

## 2. Veritabanı ve Kullanıcı Oluşturma

PostgreSQL'e bağlanın:
```bash
sudo -u postgres psql
```

Veritabanı ve kullanıcı oluşturun:
```sql
-- Veritabanı oluştur
CREATE DATABASE satis_takip_db;

-- Kullanıcı oluştur
CREATE USER satis_user WITH PASSWORD 'your_strong_password';

-- Yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE satis_takip_db TO satis_user;

-- Modern PostgreSQL için ek yetkiler
\c satis_takip_db
GRANT ALL ON SCHEMA public TO satis_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO satis_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO satis_user;

-- Çıkış
\q
```

## 3. Environment Değişkenlerini Güncelleme

`.env` dosyanızı güncelleyin:
```env
# PostgreSQL bağlantı string'i
DATABASE_URL="postgresql://satis_user:your_strong_password@localhost:5432/satis_takip_db?schema=public"

# Diğer mevcut değişkenler...
MONGO_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=satisTakipJwtSecretKey2024
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 4. Prisma Migration

### İlk migration'ı çalıştırın:
```bash
npx prisma migrate dev --name init
```

### Prisma Client'ı yeniden oluşturun:
```bash
npx prisma generate
```

### Veritabanı durumunu kontrol edin:
```bash
npx prisma db pull
npx prisma studio
```

## 5. Sunucuyu Prisma ile Çalıştırma

### Prisma sunucusunu başlatın:
```bash
node backend/serverPrisma.js
```

### Veya package.json'a script ekleyin:
```json
{
  "scripts": {
    "prisma-server": "node backend/serverPrisma.js",
    "prisma-dev": "concurrently \"npm start\" \"npm run prisma-server\""
  }
}
```

## 6. Mevcut Verinin Migrate Edilmesi

### Manuel veri aktarımı için script (opsiyonel):
```bash
node backend/scripts/migrateDataToPrisma.js
```

## 7. Test Edilebilir Endpoint'ler

Prisma migration'ı tamamlandıktan sonra test edebileceğiniz endpoint'ler:

### Project Endpoints:
- `GET /api/projects` - Tüm projeleri listele
- `POST /api/projects` - Yeni proje oluştur
- `GET /api/projects/:id` - Tek proje getir
- `PUT /api/projects/:id` - Proje güncelle
- `DELETE /api/projects/:id` - Proje sil
- `GET /api/projects/:id/stats` - Proje istatistikleri

### Block Endpoints:
- `GET /api/blocks/project/:projectId` - Projeye ait blokları listele
- `POST /api/blocks` - Yeni blok oluştur
- `PUT /api/blocks/:id` - Blok güncelle
- `DELETE /api/blocks/:id` - Blok sil
- `GET /api/blocks/canvas/:projectId` - 3D Canvas için blok verisi

### Log Endpoints:
- `GET /api/logs` - Log listesi (Admin only)
- `GET /api/logs/stats` - Log istatistikleri (Admin only)

## 8. Prisma Studio (Veritabanı Yönetimi)

Prisma Studio'yu başlatın:
```bash
npx prisma studio
```

Bu, http://localhost:5555 adresinde bir web arayüzü açar ve veritabanınızı görsel olarak yönetmenize olanak sağlar.

## 9. Önemli Notlar

### Schema Değişiklikleri:
- Prisma schema'sında değişiklik yaparsanız:
```bash
npx prisma migrate dev --name your_change_description
npx prisma generate
```

### Production Deployment:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Veritabanı Sıfırlama (Dikkat!):
```bash
npx prisma migrate reset
```

## 10. Performans Önerileri

### Index'ler:
Schema'da tanımlanan index'ler otomatik olarak oluşturulur:
- `type`, `userId`, `createdAt`, `entityId`, `action` (Log tablosu)
- Unique constraint'ler (email, tcNo, username)

### Connection Pooling:
Production için connection pooling kullanmanız önerilir:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/db?connection_limit=20&pool_timeout=20"
```

## 11. Sorun Giderme

### Bağlantı Sorunları:
```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Port dinleniyor mu?
netstat -nlp | grep 5432

# Veritabanına bağlanabilir misiniz?
psql -h localhost -U satis_user -d satis_takip_db
```

### Migration Sorunları:
```bash
# Migration durumunu kontrol et
npx prisma migrate status

# Son migration'ı geri al
npx prisma migrate rollback

# Schema'yı sıfırla
npx prisma db push --force-reset
```

## 12. Aşamalı Geçiş Stratejisi

1. ✅ **Faz 1**: Project, Block, Log modelleri (Tamamlandı)
2. **Faz 2**: User, Customer, CustomerNote modelleri
3. **Faz 3**: Sale, SalePayment, Task modelleri  
4. **Faz 4**: Notification, Payment modelleri
5. **Faz 5**: MongoDB bağımlılıklarını kaldırma

Her fazda yeni endpoint'leri test edin ve sorunları çözün.