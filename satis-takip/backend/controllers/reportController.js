import Sale from '../models/saleModel.js';
import Block from '../models/blockModel.js';
import Project from '../models/projectModel.js';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import asyncHandler from 'express-async-handler';

// @desc    Get sales statistics
// @route   GET /api/reports/statistics
// @access  Public
const getSalesStatistics = async (req, res) => {
    try {
        const sales = await Sale.find({ status: { $ne: 'cancelled' } })
            .populate({
                path: 'blockId',
                select: 'projectId',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            });

        // Toplam satış istatistikleri
        const totalStats = sales.reduce((acc, sale) => {
            acc.totalSales++;
            acc.totalAmount += sale.totalAmount;

            // Tahsil edilen ve bekleyen tutarları hesapla
            const paidAmount = sale.payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
            acc.totalCollected += paidAmount;
            acc.totalPending += sale.totalAmount - paidAmount;

            // Gecikmiş ödemeleri hesapla
            const overdueAmount = sale.payments.reduce((sum, payment) => {
                if (payment.status === 'overdue') {
                    return sum + (payment.amount - (payment.paidAmount || 0));
                }
                return sum;
            }, 0);
            acc.totalOverdue += overdueAmount;

            return acc;
        }, {
            totalSales: 0,
            totalAmount: 0,
            totalCollected: 0,
            totalPending: 0,
            totalOverdue: 0
        });

        res.json(totalStats);
    } catch (error) {
        console.error('Error getting sales statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get monthly sales data
// @route   GET /api/reports/monthly-sales
// @access  Public
const getMonthlySales = async (req, res) => {
    try {
        const sales = await Sale.find({ status: { $ne: 'cancelled' } }).sort('createdAt');
        
        // Aylık satışları grupla
        const monthlySales = sales.reduce((acc, sale) => {
            const monthKey = format(new Date(sale.createdAt), 'yyyy-MM');
            
            if (!acc[monthKey]) {
                acc[monthKey] = {
                    count: 0,
                    amount: 0
                };
            }
            
            acc[monthKey].count++;
            acc[monthKey].amount += sale.totalAmount;
            
            return acc;
        }, {});

        // Sonuçları diziye dönüştür
        const result = Object.entries(monthlySales).map(([month, data]) => ({
            month,
            ...data
        }));

        res.json(result);
    } catch (error) {
        console.error('Error getting monthly sales:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get payment status distribution
// @route   GET /api/reports/payment-status
// @access  Public
const getPaymentStatusDistribution = async (req, res) => {
    try {
        const sales = await Sale.find({ status: { $ne: 'cancelled' } });
        
        const distribution = sales.reduce((acc, sale) => {
            if (!acc[sale.paymentStatus]) {
                acc[sale.paymentStatus] = 0;
            }
            acc[sale.paymentStatus]++;
            return acc;
        }, {});

        res.json(distribution);
    } catch (error) {
        console.error('Error getting payment status distribution:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get project sales distribution
// @route   GET /api/reports/project-sales
// @access  Public
const getProjectSalesDistribution = async (req, res) => {
    try {
        // Önce tüm projeleri al
        const projects = await Project.find();
        const projectMap = projects.reduce((acc, project) => {
            acc[project._id] = {
                name: project.name,
                count: 0,
                amount: 0
            };
            return acc;
        }, {});

        // Satışları al ve blok bilgilerini populate et
        const sales = await Sale.find({ status: { $ne: 'cancelled' } })
            .populate({
                path: 'blockId',
                select: 'projectId',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            });

        // Satışları projelere göre grupla
        sales.forEach(sale => {
            if (sale.blockId && sale.blockId.projectId) {
                const projectId = sale.blockId.projectId._id.toString();
                if (projectMap[projectId]) {
                    projectMap[projectId].count++;
                    projectMap[projectId].amount += sale.totalAmount;
                }
            }
        });

        // Sonuçları diziye dönüştür
        const distribution = Object.entries(projectMap).map(([projectId, data]) => ({
            projectId,
            ...data
        }));

        res.json(distribution);
    } catch (error) {
        console.error('Error getting project sales distribution:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get project specific statistics
// @route   GET /api/reports/projects/:projectId/stats
// @access  Public
const getProjectStats = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Proje bloklarını al
        const blocks = await Block.find({ projectId });
        const blockIds = blocks.map(block => block._id);

        // Projeye ait satışları al
        const sales = await Sale.find({ blockId: { $in: blockIds }, status: { $ne: 'cancelled' } })
            .populate('blockId', 'blockNumber projectId');

        // Genel istatistikler
        const stats = sales.reduce((acc, sale) => {
            acc.totalSales++;
            acc.totalAmount += sale.totalAmount;

            // Tahsil edilen ve bekleyen tutarları hesapla
            const paidAmount = sale.payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
            acc.totalCollected += paidAmount;
            acc.totalPending += sale.totalAmount - paidAmount;

            // Gecikmiş ödemeleri hesapla
            const overdueAmount = sale.payments.reduce((sum, payment) => {
                if (payment.status === 'overdue') {
                    return sum + (payment.amount - (payment.paidAmount || 0));
                }
                return sum;
            }, 0);
            acc.totalOverdue += overdueAmount;

            return acc;
        }, {
            totalSales: 0,
            totalAmount: 0,
            totalCollected: 0,
            totalPending: 0,
            totalOverdue: 0
        });

        // Blok istatistikleri
        const blockStats = await Promise.all(blocks.map(async block => {
            const blockSales = sales.filter(sale => sale.blockId._id.toString() === block._id.toString());
            const totalAmount = blockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

            return {
                blockId: block._id,
                blockNumber: block.blockNumber,
                totalUnits: block.totalUnits,
                soldUnits: blockSales.length,
                totalAmount
            };
        }));

        // Ödeme durumu istatistikleri
        const paymentStats = sales.reduce((acc, sale) => {
            const totalPaid = sale.payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
            const isPaid = totalPaid >= sale.totalAmount;
            const isPartial = totalPaid > 0 && totalPaid < sale.totalAmount;
            const hasOverdue = sale.payments.some(payment => payment.status === 'overdue');

            if (isPaid) acc.paid++;
            else if (hasOverdue) acc.overdue++;
            else if (isPartial) acc.partial++;
            else acc.pending++;

            return acc;
        }, {
            paid: 0,
            partial: 0,
            overdue: 0,
            pending: 0
        });

        res.json({
            stats,
            blockStats,
            paymentStats
        });
    } catch (error) {
        console.error('Error getting project stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get unit type distribution for a project
// @route   GET /api/reports/projects/:projectId/unit-types
// @access  Private
const getUnitTypeDistribution = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Proje bloklarını al
        const blocks = await Block.find({ projectId });
        const blockIds = blocks.map(block => block._id);

        // Projeye ait satışları al
        const sales = await Sale.find({ blockId: { $in: blockIds }, status: { $ne: 'cancelled' } })
            .populate({
                path: 'blockId',
                select: 'type roomCount unitNumber',
                populate: {
                    path: 'reference',
                    select: 'name'
                }
            });

        // Satılmış blokların ID'lerini set olarak tut
        const soldBlockIds = new Set(sales.map(sale => sale.blockId._id.toString()));

        // Birimlerin satış durumlarını hazırla
        const unitStatusData = blocks.map(block => ({
            _id: block._id.toString(),
            type: block.type === 'apartment' ? 'Daire' : block.type === 'store' ? 'Dükkan' : 'Belirtilmemiş',
            unitNumber: block.unitNumber || 'Belirtilmemiş',
            roomCount: block.type === 'apartment' ? (block.roomCount || 'Belirtilmemiş') : block.type === 'store' ? '-' : 'Belirtilmemiş',
            status: soldBlockIds.has(block._id.toString()) ? 'Satıldı' : 'Müsait'
        }));

        // Satılan dairelerin oda sayısı dağılımı
        const roomDistribution = sales
            .filter(sale => sale.blockId && sale.blockId.type && sale.blockId.type.toLowerCase() === 'apartment')
            .reduce((acc, sale) => {
                const count = sale.blockId.roomCount || 'Belirtilmemiş';
                if (!acc[count]) acc[count] = 0;
                acc[count]++;
                return acc;
            }, {});

        // Dükkanları da ekleyelim
        const shopCount = sales
            .filter(sale => sale.blockId && sale.blockId.type && sale.blockId.type.toLowerCase() === 'store')
            .length;

        // Tüm oda sayıları ve dükkanlar için sonuç
        const roomCountsArray = Object.entries(roomDistribution).map(([count, total]) => ({
            type: count === 'Belirtilmemiş' ? 'Belirtilmemiş' : `${count} Odalı`,
            count: total
        })).sort((a, b) => {
            // Belirtilmemiş'i sona koy
            if (a.type === 'Belirtilmemiş') return 1;
            if (b.type === 'Belirtilmemiş') return -1;
            return parseInt(a.type) - parseInt(b.type);
        });
        
        // Eğer dükkan satışı varsa, sonuç dizisine ekle
        if (shopCount > 0) {
            roomCountsArray.push({
                type: 'Dükkan',
                count: shopCount
            });
        }

        // Eğer hiç veri yoksa ama satış varsa, genel bir kategori ekle
        if (roomCountsArray.length === 0 && sales.length > 0) {
            roomCountsArray.push({
                type: 'Belirtilmemiş',
                count: sales.length
            });
        }

        // Referans dağılımı hesapla
        const referenceDistribution = sales.reduce((acc, sale) => {
            const referenceName = sale.blockId.reference?.name || 'Referanssız';
            if (!acc[referenceName]) acc[referenceName] = 0;
            acc[referenceName]++;
            return acc;
        }, {});

        const referenceDistributionArray = Object.entries(referenceDistribution).map(([name, count]) => ({
            type: name,
            count: count
        })).sort((a, b) => b.count - a.count); // En çok satışa göre sırala

        const result = {
            unitStatus: unitStatusData,
            roomCounts: roomCountsArray,
            referenceDistribution: referenceDistributionArray
        };


        res.json(result);
    } catch (error) {
        console.error('Error getting unit type distribution:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get payments by date range for a project
// @route   GET /api/reports/projects/:projectId/payments
// @access  Private
const getProjectPayments = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate } = req.query;

        // Tarih aralığına göre filtrele
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Proje ID'sine göre ve aktif satışları filtrele (iptal edilenleri hariç tut)
        const filter = { 
            projectId: projectId,
            status: { $ne: 'cancelled' } // İptal edilmiş satışları hariç tut
        };

        // Satışları getir
        const sales = await Sale.find(filter)
            .populate('customerId', 'firstName lastName')
            .populate('blockId', 'unitNumber');

        // Alınan ödemeler listesi oluştur
        const receivedPayments = [];
        const expectedPayments = [];

        // Her satış için
        for (const sale of sales) {
            // Ödemeler içinde dön
            for (const payment of sale.payments) {
                const paymentData = {
                    _id: payment._id,
                    customerName: `${sale.customerId.firstName} ${sale.customerId.lastName}`,
                    blockNumber: sale.blockId.unitNumber,
                    description: payment.description,
                    saleId: sale._id
                };

                // Ödeme kısmen veya tamamen yapıldıysa
                if (payment.paidAmount > 0) {
                    receivedPayments.push({
                        ...paymentData,
                        paidAmount: payment.paidAmount,
                        paidDate: payment.paidDate,
                        paymentMethod: payment.paymentMethod
                    });
                }

                // Ödeme tam yapılmadıysa
                if (payment.status !== 'paid') {
                    const amount = payment.amount - (payment.paidAmount || 0);
                    if (amount > 0) {
                        expectedPayments.push({
                            ...paymentData,
                            amount: amount,
                            dueDate: payment.dueDate,
                            status: payment.status
                        });
                    }
                }
            }
        }

        res.json({ receivedPayments, expectedPayments });
    } catch (error) {
        console.error('Error getting project payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all payments
// @route   GET /api/reports/payments
// @access  Public
const getAllPayments = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Tarih aralığına göre filtrele
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // İptal edilen satışları hariç tut
        const sales = await Sale.find({ 
            ...dateFilter,
            status: { $ne: 'cancelled' } // İptal edilmiş satışları hariç tut
        })
            .populate('customerId', 'firstName lastName')
            .populate('blockId', 'unitNumber')
            .populate('projectId', 'name');

        // Alınan ödemeler listesi oluştur
        const allPayments = [];

        // Her satış için
        for (const sale of sales) {
            // Ödemeler içinde dön
            for (const payment of sale.payments) {
                // Ödeme kısmen veya tamamen yapıldıysa
                if (payment.paidAmount > 0) {
                    allPayments.push({
                        _id: payment._id,
                        customerName: `${sale.customerId.firstName} ${sale.customerId.lastName}`,
                        blockNumber: sale.blockId.unitNumber,
                        projectName: sale.projectId.name,
                        description: payment.description,
                        paidAmount: payment.paidAmount,
                        paidDate: payment.paidDate,
                        paymentMethod: payment.paymentMethod,
                        saleId: sale._id
                    });
                }
            }
        }

        res.json(allPayments);
    } catch (error) {
        console.error('Error getting all payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get global unit type distribution for all projects
// @route   GET /api/reports/global/unit-types
// @access  Private
const getGlobalUnitTypeDistribution = asyncHandler(async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        
        if (startDate && endDate) {
            // Satış tarihine göre filtrele
            query.saleDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Tüm projelerdeki satışları al
        const sales = await Sale.find({ ...query, status: { $ne: 'cancelled' } })
            .populate({
                path: 'blockId',
                select: 'type roomCount unitNumber projectId',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            });
        
        // Oda sayısı ve birim tipi dağılımı için verileri hazırla
        const typeCounts = {};
        
        sales.forEach(sale => {
            const block = sale.blockId;
            let typeKey;
            
            if (block.type === 'apartment') {
                typeKey = block.roomCount ? `${block.roomCount}+1` : 'Belirtilmemiş Daire';
            } else if (block.type === 'store') {
                typeKey = 'Dükkan';
            } else {
                typeKey = 'Diğer';
            }
            
            typeCounts[typeKey] = (typeCounts[typeKey] || 0) + 1;
        });
        
        // Sonucu dizi olarak dönüştür
        const result = Object.entries(typeCounts).map(([type, count]) => ({
            type,
            count
        }));
        
        res.json(result);
    } catch (error) {
        console.error('Error getting global unit type distribution:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get global monthly sales totals for all projects
// @route   GET /api/reports/global/monthly-sales
// @access  Private
const getGlobalMonthlySales = asyncHandler(async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        
        if (startDate && endDate) {
            // Satış tarihine göre filtrele
            query.saleDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Satışları al
        const sales = await Sale.find({ ...query, status: { $ne: 'cancelled' } });
        
        // Aylık satış toplamlarını hesapla
        const monthlySalesTotals = {};
        
        sales.forEach(sale => {
            const date = new Date(sale.saleDate);
            const monthYear = format(date, 'yyyy-MM');
            
            if (!monthlySalesTotals[monthYear]) {
                monthlySalesTotals[monthYear] = 0;
            }
            
            monthlySalesTotals[monthYear] += sale.totalAmount;
        });
        
        // Sonucu dizi olarak dönüştür ve tarihe göre sırala
        const result = Object.entries(monthlySalesTotals)
            .map(([month, amount]) => ({
                month,
                amount
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
        
        res.json(result);
    } catch (error) {
        console.error('Error getting global monthly sales:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get global payment data for all projects
// @route   GET /api/reports/global/payments
// @access  Private
const getGlobalPaymentData = asyncHandler(async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Tarih aralığını kontrol et
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Başlangıç ve bitiş tarihi gerekli' });
        }
        
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // Satışları al
        const sales = await Sale.find({ status: { $ne: 'cancelled' } })
            .populate({
                path: 'blockId',
                select: 'blockNumber unitNumber type squareMeters roomCount projectId',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            })
            .populate('customerId', 'firstName lastName');
        
        // Ödeme istatistikleri
        let totalReceived = 0;
        let totalExpected = 0;
        let totalOverdue = 0;
        const paymentDetails = [];
        
        const now = new Date();
        
        sales.forEach(sale => {
            // blockId veya customerId yoksa atla
            if (!sale.blockId || !sale.customerId) {
                console.log(`Atlanıyor: BlockId veya CustomerId bulunamadı - Sale ID: ${sale._id}`);
                return;
            }
            
            // projectId yoksa atla
            if (!sale.blockId.projectId) {
                console.log(`Atlanıyor: ProjectId bulunamadı - Block ID: ${sale.blockId._id}`);
                return;
            }
            
            // Tüm ödemeleri incele
            sale.payments.forEach(payment => {
                const dueDate = new Date(payment.dueDate);
                
                // Tarih aralığında olan ödemeleri filtrele
                if (dueDate >= startDateObj && dueDate <= endDateObj) {
                    const paidAmount = payment.paidAmount || 0;
                    const remainingAmount = payment.amount - paidAmount;
                    
                    // Ödenen miktarı topla
                    totalReceived += paidAmount;
                    
                    // Ödeme durumunu belirle
                    let status = 'pending';
                    if (paidAmount >= payment.amount) {
                        status = 'paid';
                    } else if (dueDate < now && remainingAmount > 0) {
                        status = 'overdue';
                        totalOverdue += remainingAmount;
                    } else if (remainingAmount > 0) {
                        totalExpected += remainingAmount;
                    }
                    
                    // Müşteri adı ve soyadı kontrolü
                    const firstName = sale.customerId.firstName || '';
                    const lastName = sale.customerId.lastName || '';
                    const customerName = `${firstName} ${lastName}`.trim();
                    
                    // Tabloya eklenecek ödeme detayları
                    paymentDetails.push({
                        id: `${sale._id}-${payment._id}`,
                        customerName: customerName,
                        projectName: sale.blockId.projectId.name,
                        blockInfo: `${sale.blockId.blockNumber}/${sale.blockId.unitNumber}`,
                        dueDate: payment.dueDate,
                        amount: payment.amount,
                        paidAmount: paidAmount,
                        status: status
                    });
                }
            });
        });
        
        res.json({
            totalReceived,
            totalExpected,
            totalOverdue,
            payments: paymentDetails
        });
    } catch (error) {
        console.error('Error getting global payment data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export {
    getSalesStatistics,
    getMonthlySales,
    getPaymentStatusDistribution,
    getProjectSalesDistribution,
    getProjectStats,
    getUnitTypeDistribution,
    getProjectPayments,
    getAllPayments,
    getGlobalUnitTypeDistribution,
    getGlobalMonthlySales,
    getGlobalPaymentData
};
