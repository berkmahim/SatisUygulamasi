import { useState, useCallback } from 'react';
import { DEFAULT_BLOCK, BLOCK_STATUS } from '../types/blockTypes';

export const useBlockManagement = (initialBlocks = [], onSave, onUpdate, onDelete) => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const addBlock = useCallback((position, type = 'apartment') => {
    const newBlock = {
      ...DEFAULT_BLOCK,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      type: type || (position[1] === 0 ? 'store' : 'apartment'),
      status: BLOCK_STATUS.AVAILABLE
    };

    setBlocks(prev => [...prev, newBlock]);
    
    if (onSave) {
      onSave(newBlock);
    }

    return newBlock;
  }, [onSave]);

  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prev => prev.map(block => 
      (block._id || block.id) === blockId 
        ? { ...block, ...updates }
        : block
    ));

    if (onUpdate) {
      onUpdate(blockId, updates);
    }
  }, [onUpdate]);

  const deleteBlock = useCallback((blockId) => {
    setBlocks(prev => prev.filter(block => (block._id || block.id) !== blockId));
    
    if (selectedBlock === blockId) {
      setSelectedBlock(null);
    }

    if (onDelete) {
      onDelete(blockId);
    }
  }, [selectedBlock, onDelete]);

  const selectBlock = useCallback((blockId) => {
    setSelectedBlock(blockId === selectedBlock ? null : blockId);
  }, [selectedBlock]);

  const getSelectedBlock = useCallback(() => {
    return blocks.find(block => (block._id || block.id) === selectedBlock);
  }, [blocks, selectedBlock]);

  const getBlocksByType = useCallback((type) => {
    return blocks.filter(block => block.type === type);
  }, [blocks]);

  const getBlocksByStatus = useCallback((status) => {
    return blocks.filter(block => block.status === status);
  }, [blocks]);

  const updateBlockDimensions = useCallback((blockId, dimensions) => {
    updateBlock(blockId, { dimensions });
  }, [updateBlock]);

  const updateBlockPosition = useCallback((blockId, position) => {
    updateBlock(blockId, { position });
  }, [updateBlock]);

  const clearSelection = useCallback(() => {
    setSelectedBlock(null);
  }, []);

  return {
    blocks,
    setBlocks,
    selectedBlock,
    addBlock,
    updateBlock,
    deleteBlock,
    selectBlock,
    getSelectedBlock,
    getBlocksByType,
    getBlocksByStatus,
    updateBlockDimensions,
    updateBlockPosition,
    clearSelection
  };
};