import express from 'express';
import {
    getBlocks,
    createBlock,
    updateBlock,
    deleteBlock
} from '../controllers/blockController.js';

const router = express.Router();

router.route('/:projectId')
    .get(getBlocks)
    .post(createBlock);

router.route('/:id')
    .patch(updateBlock)
    .delete(deleteBlock);

export default router;
