import express from 'express';
import {
    getBlocks,
    getBlockById,
    createBlock,
    updateBlock,
    deleteBlock
} from '../controllers/blockController.js';

const router = express.Router();

router.route('/:projectId')
    .get(getBlocks)
    .post(createBlock);

router.route('/detail/:id')
    .get(getBlockById);

router.route('/:id')
    .patch(updateBlock)
    .delete(deleteBlock);

export default router;
