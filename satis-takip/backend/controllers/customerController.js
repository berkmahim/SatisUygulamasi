import asyncHandler from 'express-async-handler';
import Customer from '../models/customerModel.js';
import Block from '../models/blockModel.js';
import Payment from '../models/paymentModel.js';
import Sale from '../models/saleModel.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = asyncHandler(async (req, res) => {
    const customers = await Customer.find({});
    res.json(customers);
});

// @desc    Search customers
// @route   GET /api/customers/search
// @access  Public
const searchCustomers = asyncHandler(async (req, res) => {
    const { term } = req.query;

    if (!term || term.length < 2) {
        return res.json([]);
    }

    const searchRegex = new RegExp(term, 'i');
    const customers = await Customer.find({
        $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { tcNo: searchRegex },
            { phone: searchRegex },
            { email: searchRegex }
        ]
    }).limit(10);

    res.json(customers);
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    
    if (customer) {
        res.json(customer);
    } else {
        res.status(404);
        throw new Error('Müşteri bulunamadı');
    }
});

// @desc    Create a customer
// @route   POST /api/customers
// @access  Public
const createCustomer = asyncHandler(async (req, res) => {
    const { firstName, lastName, tcNo, email, phone } = req.body;

    const customerExists = await Customer.findOne({ $or: [{ tcNo }, { email }] });
    if (customerExists) {
        res.status(400);
        throw new Error('Bu TC No veya Email ile kayıtlı müşteri bulunmaktadır');
    }

    const customer = await Customer.create({
        firstName,
        lastName,
        tcNo,
        email,
        phone
    });

    if (customer) {
        res.status(201).json(customer);
    } else {
        res.status(400);
        throw new Error('Geçersiz müşteri bilgileri');
    }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        const {
            firstName,
            lastName,
            tcNo,
            email,
            phone,
            address
        } = req.body;

        // TC No veya email değişiyorsa, benzersiz olduğunu kontrol et
        if (tcNo && tcNo !== customer.tcNo) {
            const existingCustomer = await Customer.findOne({ tcNo });
            if (existingCustomer) {
                return res.status(400).json({ message: 'Bu TC Kimlik No ile kayıtlı başka bir müşteri var' });
            }
        }

        if (email && email !== customer.email) {
            const existingCustomer = await Customer.findOne({ email });
            if (existingCustomer) {
                return res.status(400).json({ message: 'Bu email ile kayıtlı başka bir müşteri var' });
            }
        }

        // Müşteri bilgilerini güncelle
        customer.firstName = firstName || customer.firstName;
        customer.lastName = lastName || customer.lastName;
        customer.tcNo = tcNo || customer.tcNo;
        customer.email = email || customer.email;
        customer.phone = phone || customer.phone;
        customer.address = address || customer.address;

        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Müşteri güncellenirken bir hata oluştu' });
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        // Müşterinin aktif satışı var mı kontrol et
        const activeSales = await Sale.find({ 
            customer: customer._id,
            status: { $nin: ['cancelled'] }
        });

        if (activeSales.length > 0) {
            return res.status(400).json({ 
                message: 'Bu müşterinin aktif satışları var. Önce satışları iptal etmelisiniz.',
                sales: activeSales
            });
        }

        await Customer.deleteOne({ _id: customer._id });
        res.json({ message: 'Müşteri başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Müşteri silinirken bir hata oluştu' });
    }
};

// @desc    Get customer details with blocks and payments
// @route   GET /api/customers/:id/details
// @access  Private
const getCustomerDetails = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
        res.status(404);
        throw new Error('Müşteri bulunamadı');
    }

    // Müşterinin sahip olduğu blokları bul
    const blocks = await Block.find({ owner: customer._id })
        .populate('projectId', 'name'); // Proje adını getir

    // Müşterinin ödeme geçmişini bul
    const payments = await Payment.find({ customer: customer._id })
        .sort({ createdAt: -1 }); // En yeni ödemeler önce

    res.json({
        customer,
        blocks,
        payments
    });
});

export {
    createCustomer,
    getCustomers,
    getCustomerById,
    searchCustomers,
    updateCustomer,
    deleteCustomer,
    getCustomerDetails
};
