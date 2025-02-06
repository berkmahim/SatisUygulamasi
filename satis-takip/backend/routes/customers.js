import express from 'express';
import {
    getCustomers,
    searchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} from '../controllers/customerController.js';

const router = express.Router();

router.route('/')
    .get(getCustomers)
    .post(createCustomer);

router.route('/search')
    .get(searchCustomers);

router.route('/:id')
    .get(getCustomerById)
    .put(updateCustomer)
    .delete(deleteCustomer);

export default router;
