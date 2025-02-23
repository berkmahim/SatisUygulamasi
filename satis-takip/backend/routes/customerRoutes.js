import express from 'express';
import {
    createCustomer,
    getCustomers,
    getCustomerById,
    searchCustomers,
    updateCustomer,
    deleteCustomer,
    getCustomerDetails
} from '../controllers/customerController.js';

const router = express.Router();

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/search', searchCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/details', getCustomerDetails);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
