import './config/config.js';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import blockRoutes from './routes/blockRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import logRoutes from './routes/logRoutes.js';
import twoFactorRoutes from './routes/twoFactorRoutes.js';
import customerNoteRoutes from './routes/customerNoteRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import Sale from './models/saleModel.js';
import { initializeMailer } from './config/mailer.js';

connectDB();

// E-posta servisini başlat
const emailConfig = {
  email: process.env.EMAIL_USER || 'your-email@gmail.com', // Bu bilgiler .env dosyasından alınacak
  password: process.env.EMAIL_PASSWORD || 'your-app-password',
  testEmail: false
};

initializeMailer(emailConfig);

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/customer-notes', customerNoteRoutes);
app.use('/api/tasks', taskRoutes);

// Tüm ödeme durumlarını güncelleme fonksiyonu
const updateAllPaymentStatuses = async () => {
  try {
    console.log('Ödeme durumları güncelleniyor...');
    const sales = await Sale.find({
      'payments.status': 'pending',
      status: 'active'
    });

    console.log(`${sales.length} adet bekleyen ödemesi olan satış bulundu.`);
    let updatedCount = 0;
    let errorCount = 0;

    for (const sale of sales) {
      try {
        await sale.updatePaymentStatus();
        await sale.save({ validateBeforeSave: false }); // Validasyonu devre dışı bırak
        updatedCount++;
      } catch (saleError) {
        console.error(`Satış ID: ${sale._id} için güncelleme hatası:`, saleError.message);
        errorCount++;
      }
    }
    
    console.log(`${updatedCount} adet satışın ödeme durumu güncellendi, ${errorCount} adet satış hatalarla karşılaştı.`);
  } catch (error) {
    console.error('Ödeme durumu güncelleme hatası:', error);
  }
};

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // İlk başlatıldığında ödeme durumlarını güncelle
  updateAllPaymentStatuses();
  
  // Her saatte bir tüm ödeme durumlarını otomatik güncelle
  setInterval(updateAllPaymentStatuses, 60 * 60 * 1000); // 1 saat
});

// Beklenmeyen hataları yakala
process.on('uncaughtException', (error) => {
  console.log('UNCAUGHT EXCEPTION!');
  console.log('Hata detayı:', error.message);
  // Kritik olmayan hatalar için uygulama kapanmasın, sadece loglama yap
  if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
    console.log('Token hatası yakalandı, işlem normal şekilde devam ediyor.');
  } else {
    console.log('Kritik hata, uygulama kapatılıyor...');
    server.close(() => {
      process.exit(1);
    });
  }
});

// İşlenmeyen Promise reddetmeleri yakala
process.on('unhandledRejection', (reason, promise) => {
  console.log('UNHANDLED REJECTION!');
  console.log('Hata detayı:', reason);
  // Kritik olmayan hatalar için uygulama kapanmasın, sadece loglama yap
  if (reason.name === 'TokenExpiredError' || reason.name === 'JsonWebTokenError') {
    console.log('Token hatası yakalandı, işlem normal şekilde devam ediyor.');
  } else {
    console.log('Kritik hata, uygulama kapatılıyor...');
    server.close(() => {
      process.exit(1);
    });
  }
});
