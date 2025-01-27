import express from 'express';
import { Block } from '../models/Block.js';

const router = express.Router();

// Get all blocks
router.get('/', async (req, res) => {
  try {
    const blocks = await Block.find();
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new block
router.post('/', async (req, res) => {
  const block = new Block({
    position: req.body.position,
    dimensions: req.body.dimensions,
    unitNumber: req.body.unitNumber,
    owner: req.body.owner,
    squareMeters: req.body.squareMeters,
    roomCount: req.body.roomCount,
    type: req.body.type
  });

  try {
    const newBlock = await block.save();
    res.status(201).json(newBlock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a block
router.patch('/:id', async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') {
        block[key] = updates[key];
      }
    });

    const updatedBlock = await block.save();
    res.json(updatedBlock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a block
router.delete('/:id', async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    await block.deleteOne();
    res.json({ message: 'Block deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
