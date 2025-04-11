import express from 'express';
import {
    getCustomerNotes,
    createCustomerNote,
    updateCustomerNote,
    deleteCustomerNote
} from '../controllers/customerNoteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createCustomerNote);

router.route('/:customerId')
    .get(protect, getCustomerNotes);

router.route('/:id')
    .put(protect, updateCustomerNote)
    .delete(protect, deleteCustomerNote);

export default router;
