import './config/config.js';
import express from 'express';
import cors from 'cors';
import { connectPrismaDB, disconnectPrismaDB } from './config/prisma.js';

// Import Prisma routes (we'll create these)
import projectRoutesPrisma from './routes/projectRoutesPrisma.js';
import blockRoutesPrisma from './routes/blockRoutesPrisma.js';
import logRoutesPrisma from './routes/logRoutesPrisma.js';

// Import existing routes that don't need immediate migration
import customerRoutes from './routes/customerRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import twoFactorRoutes from './routes/twoFactorRoutes.js';
import customerNoteRoutes from './routes/customerNoteRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { initializeMailer } from './config/mailer.js';

// Connect to PostgreSQL with Prisma
connectPrismaDB();

// E-posta servisini başlat
const emailConfig = {
  email: process.env.EMAIL_USER || 'your-email@gmail.com',
  password: process.env.EMAIL_PASSWORD || 'your-app-password',
  testEmail: false
};

initializeMailer(emailConfig);

const app = express();

const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://playful-empanada-30e99b.netlify.app', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Static file serving for uploads
app.use('/uploads', express.static('backend/uploads'));

// Prisma Routes (migrated)
app.use('/api/projects', projectRoutesPrisma);
app.use('/api/blocks', blockRoutesPrisma);
app.use('/api/logs', logRoutesPrisma);

// Existing MongoDB routes (to be migrated later)
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/customer-notes', customerNoteRoutes);
app.use('/api/tasks', taskRoutes);

// Note: Payment status update functionality will need to be migrated to Prisma
// For now, we'll keep it commented out until Sale model is migrated

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 Using PostgreSQL with Prisma ORM`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await disconnectPrismaDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    await disconnectPrismaDB();
    process.exit(0);
  });
});

// Beklenmeyen hataları yakala
process.on('uncaughtException', async (error) => {
  console.log('UNCAUGHT EXCEPTION!');
  console.log('Hata detayı:', error.message);
  
  if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
    console.log('Token hatası yakalandı, işlem normal şekilde devam ediyor.');
  } else {
    console.log('Kritik hata, uygulama kapatılıyor...');
    server.close(async () => {
      await disconnectPrismaDB();
      process.exit(1);
    });
  }
});

// İşlenmeyen Promise reddetmeleri yakala
process.on('unhandledRejection', async (reason, promise) => {
  console.log('UNHANDLED REJECTION!');
  console.log('Hata detayı:', reason);
  
  if (reason.name === 'TokenExpiredError' || reason.name === 'JsonWebTokenError') {
    console.log('Token hatası yakalandı, işlem normal şekilde devam ediyor.');
  } else {
    console.log('Kritik hata, uygulama kapatılıyor...');
    server.close(async () => {
      await disconnectPrismaDB();
      process.exit(1);
    });
  }
});