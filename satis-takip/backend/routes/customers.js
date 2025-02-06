import express from 'express';
import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById
} from '../controllers/customerController.js';

const router = express.Router();

router.route('/')
    .get(getCustomers)
    .post(createCustomer);

router.route('/:id')
    .get(getCustomerById)
    .put(updateCustomer)
    .delete(deleteCustomer);

export default router;
