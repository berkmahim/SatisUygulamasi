import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';
import ExcelJS from 'exceljs';

// Log kaydı oluşturma yardımcı fonksiyonu
export const createLog = async (logData, req) => {
  try {
    // IP ve tarayıcı bilgilerini ekle
    const ipAddress = req?.ip || req?.connection?.remoteAddress;
    const userAgent = req?.headers?.['user-agent'];

    const log = await prisma.log.create({
      data: {
        ...logData,
        ipAddress,
        userAgent,
      }
    });

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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const { type, action, userId, startDate, endDate, search } = req.query;

  // Build where clause
  const where = {};

  if (type) {
    where.type = type.toUpperCase();
  }

  if (action) {
    where.action = action.toUpperCase();
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      {
        description: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        entityId: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    }),
    prisma.log.count({ where })
  ]);

  res.status(200).json({
    logs,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalLogs: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  });
});

// @desc    Belirli bir entity'ye ait logları getir
// @route   GET /api/logs/entity/:entityId
// @access  Public
const getLogsByEntity = asyncHandler(async (req, res) => {
  const { entityId } = req.params;
  const { type } = req.query;

  const where = {
    entityId
  };

  if (type) {
    where.type = type.toUpperCase();
  }

  const logs = await prisma.log.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      }
    }
  });

  res.status(200).json(logs);
});

// @desc    Log istatistikleri
// @route   GET /api/logs/stats
// @access  Admin only
const getLogStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [
    totalLogs,
    logsByType,
    logsByAction,
    logsByUser,
    recentActivity
  ] = await Promise.all([
    prisma.log.count({ where }),
    
    prisma.log.groupBy({
      by: ['type'],
      where,
      _count: {
        type: true
      }
    }),
    
    prisma.log.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true
      }
    }),
    
    prisma.log.groupBy({
      by: ['userId'],
      where: {
        ...where,
        userId: {
          not: null
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    }),
    
    prisma.log.findMany({
      where,
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    })
  ]);

  // Get user details for top users
  const userIds = logsByUser.map(log => log.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true,
      username: true,
      fullName: true
    }
  });

  const topUsers = logsByUser.map(log => {
    const user = users.find(u => u.id === log.userId);
    return {
      userId: log.userId,
      username: user?.username || 'Unknown',
      fullName: user?.fullName || 'Unknown',
      count: log._count.userId
    };
  });

  res.status(200).json({
    totalLogs,
    logsByType: logsByType.map(item => ({
      type: item.type,
      count: item._count.type
    })),
    logsByAction: logsByAction.map(item => ({
      action: item.action,
      count: item._count.action
    })),
    topUsers,
    recentActivity
  });
});

// @desc    Logları Excel'e aktar
// @route   GET /api/logs/export
// @access  Admin only
const exportLogs = asyncHandler(async (req, res) => {
  const { type, action, userId, startDate, endDate } = req.query;

  const where = {};

  if (type) {
    where.type = type.toUpperCase();
  }

  if (action) {
    where.action = action.toUpperCase();
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const logs = await prisma.log.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      }
    }
  });

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Loglar');

  // Add headers
  worksheet.columns = [
    { header: 'Tarih', key: 'createdAt', width: 20 },
    { header: 'Tip', key: 'type', width: 15 },
    { header: 'İşlem', key: 'action', width: 15 },
    { header: 'Açıklama', key: 'description', width: 40 },
    { header: 'Kullanıcı', key: 'user', width: 20 },
    { header: 'IP Adresi', key: 'ipAddress', width: 15 },
    { header: 'Entity ID', key: 'entityId', width: 30 }
  ];

  // Add data
  logs.forEach(log => {
    worksheet.addRow({
      createdAt: new Date(log.createdAt).toLocaleString('tr-TR'),
      type: log.type,
      action: log.action,
      description: log.description,
      user: log.user ? `${log.user.fullName} (${log.user.username})` : 'System',
      ipAddress: log.ipAddress || '-',
      entityId: log.entityId || '-'
    });
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=logs-${new Date().toISOString().split('T')[0]}.xlsx`);

  // Write to response
  await workbook.xlsx.write(res);
  res.end();
});

// @desc    Tek log detayı
// @route   GET /api/logs/:id
// @access  Admin only
const getLogDetail = asyncHandler(async (req, res) => {
  const log = await prisma.log.findUnique({
    where: {
      id: req.params.id
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  if (!log) {
    res.status(404);
    throw new Error('Log bulunamadı');
  }

  res.status(200).json(log);
});

export {
  getLogs,
  getLogsByEntity,
  getLogStats,
  exportLogs,
  getLogDetail
};