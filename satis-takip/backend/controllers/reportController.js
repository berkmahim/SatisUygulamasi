import Sale from '../models/saleModel.js';
import Block from '../models/blockModel.js';
import Project from '../models/projectModel.js';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// @desc    Get sales statistics
// @route   GET /api/reports/statistics
// @access  Public
const getSalesStatistics = async (req, res) => {
    try {
        const sales = await Sale.find().populate('block', 'projectId');

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
        const sales = await Sale.find().sort('createdAt');
        
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
        const sales = await Sale.find();
        
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
        const sales = await Sale.find()
            .populate({
                path: 'block',
                select: 'projectId',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            });

        // Satışları projelere göre grupla
        sales.forEach(sale => {
            if (sale.block && sale.block.projectId) {
                const projectId = sale.block.projectId._id.toString();
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
        const sales = await Sale.find({ block: { $in: blockIds } })
            .populate('block', 'blockNumber projectId');

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
            const blockSales = sales.filter(sale => sale.block._id.toString() === block._id.toString());
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

export {
    getSalesStatistics,
    getMonthlySales,
    getPaymentStatusDistribution,
    getProjectSalesDistribution,
    getProjectStats
};
