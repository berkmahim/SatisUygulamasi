import asyncHandler from 'express-async-handler';
import Log from '../models/logModel.js';
import User from '../models/userModel.js';
import ExcelJS from 'exceljs';

// Log kaydı oluşturma yardımcı fonksiyonu
export const createLog = async (logData, req) => {
  try {
    // IP ve tarayıcı bilgilerini ekle
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const log = new Log({
      ...logData,
      ipAddress,
      userAgent,
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Log oluşturma hatası:', error);
    return null;
  }
};

// @desc    Logları listele
// @route   GET /api/logs
// @access  Admin only
const getLogs = asyncHandler(async (req, res) => {
  // Sayfalama parametreleri
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filtre parametrelerini hazırla
  const filterOptions = {};

  if (req.query.type) {
    filterOptions.type = req.query.type;
  }

  if (req.query.userId) {
    filterOptions.userId = req.query.userId;
  }

  if (req.query.startDate && req.query.endDate) {
    filterOptions.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  if (req.query.searchText) {
    filterOptions.description = { $regex: req.query.searchText, $options: 'i' };
  }

  // Logları say
  const total = await Log.countDocuments(filterOptions);

  // Logları getir
  const logs = await Log.find(filterOptions)
    .populate('userId', 'name fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // User alanını yeniden adlandır
  const formattedLogs = logs.map(log => {
    const { userId, ...rest } = log.toObject();
    return {
      ...rest,
      user: userId
    };
  });

  res.status(200).json({
    logs: formattedLogs,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

// @desc    Log tipleri liste
// @route   GET /api/logs/types
// @access  Admin only
const getLogTypes = asyncHandler(async (req, res) => {
  const types = [
    { value: 'sale', label: 'Satış İşlemleri' },
    { value: 'sale-cancel', label: 'Satış İptal' },
    { value: 'payment', label: 'Ödeme İşlemleri' },
    { value: 'project', label: 'Proje İşlemleri' },
    { value: 'block', label: 'Birim İşlemleri' },
    { value: 'user', label: 'Kullanıcı İşlemleri' },
    { value: 'customer', label: 'Müşteri İşlemleri' },
    { value: 'other', label: 'Diğer' }
  ];

  res.status(200).json(types);
});

// @desc    Excel'e aktarma
// @route   GET /api/logs/export
// @access  Admin only
const exportLogs = asyncHandler(async (req, res) => {
  // Filtre parametrelerini hazırla
  const filterOptions = {};

  if (req.query.type) {
    filterOptions.type = req.query.type;
  }

  if (req.query.userId) {
    filterOptions.userId = req.query.userId;
  }

  if (req.query.startDate && req.query.endDate) {
    filterOptions.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  if (req.query.searchText) {
    filterOptions.description = { $regex: req.query.searchText, $options: 'i' };
  }

  // Tüm logları getir (sayfalama olmadan)
  const logs = await Log.find(filterOptions)
    .populate('userId', 'name fullName email')
    .sort({ createdAt: -1 })
    .limit(1000); // En fazla 1000 kayıt

  // Excel oluştur
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('İşlem Logları');

  // Sütun başlıkları
  worksheet.columns = [
    { header: 'Tarih', key: 'date', width: 20 },
    { header: 'Kullanıcı', key: 'user', width: 20 },
    { header: 'İşlem Tipi', key: 'type', width: 15 },
    { header: 'Aksiyon', key: 'action', width: 15 },
    { header: 'Açıklama', key: 'description', width: 50 },
    { header: 'İlgili ID', key: 'entityId', width: 25 },
    { header: 'IP Adresi', key: 'ipAddress', width: 15 }
  ];

  // Türkçe işlem tipi adlandırması
  const getActionTypeName = (type) => {
    switch (type) {
      case 'sale': return 'Satış';
      case 'sale-cancel': return 'Satış İptal';
      case 'payment': return 'Ödeme';
      case 'project': return 'Proje';
      case 'block': return 'Birim';
      case 'user': return 'Kullanıcı';
      case 'customer': return 'Müşteri';
      default: return type;
    }
  };

  // Verileri doldur
  logs.forEach(log => {
    worksheet.addRow({
      date: log.createdAt.toLocaleString('tr-TR'),
      user: log.userId ? (log.userId.fullName || log.userId.name) : 'Bilinmeyen',
      type: getActionTypeName(log.type),
      action: log.action,
      description: log.description,
      entityId: log.entityId || '',
      ipAddress: log.ipAddress || ''
    });
  });

  // Başlık satırı stilini ayarla
  worksheet.getRow(1).font = { bold: true };
  
  // Excel dosyasını oluştur
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Tarayıcıya gönder
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=İşlem_Logları.xlsx');
  res.status(200).send(buffer);
});

export {
  getLogs,
  getLogTypes,
  exportLogs
};
