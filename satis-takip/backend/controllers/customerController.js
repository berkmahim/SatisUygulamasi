import asyncHandler from 'express-async-handler';
import Customer from '../models/customerModel.js';

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

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
        const { email, tcNo } = req.body;
        
        // Check if email or tcNo already exists for other customers
        if (email !== customer.email || tcNo !== customer.tcNo) {
            const existingCustomer = await Customer.findOne({
                _id: { $ne: req.params.id },
                $or: [{ tcNo }, { email }]
            });
            
            if (existingCustomer) {
                res.status(400);
                throw new Error('Bu TC No veya Email ile kayıtlı başka bir müşteri bulunmaktadır');
            }
        }

        customer.firstName = req.body.firstName || customer.firstName;
        customer.lastName = req.body.lastName || customer.lastName;
        customer.tcNo = req.body.tcNo || customer.tcNo;
        customer.email = req.body.email || customer.email;
        customer.phone = req.body.phone || customer.phone;

        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    } else {
        res.status(404);
        throw new Error('Müşteri bulunamadı');
    }
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
        await customer.deleteOne();
        res.json({ message: 'Müşteri silindi' });
    } else {
        res.status(404);
        throw new Error('Müşteri bulunamadı');
    }
});

export {
    getCustomers,
    searchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
