import express from 'express';
import {
    getReferences,
    createReference,
    updateReference,
    deleteReference
} from '../controllers/referenceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getReferences)
    .post(protect, createReference);

router.route('/:id')
    .put(protect, updateReference)
    .delete(protect, deleteReference);

export default router;