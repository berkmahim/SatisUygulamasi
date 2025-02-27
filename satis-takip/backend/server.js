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
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import Sale from './models/saleModel.js';

connectDB();

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // İlk başlatıldığında ödeme durumlarını güncelle
  updateAllPaymentStatuses();
  
  // Her saatte bir tüm ödeme durumlarını otomatik güncelle
  setInterval(updateAllPaymentStatuses, 60 * 60 * 1000); // 1 saat
});
