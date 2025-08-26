import React, { useState, useEffect } from 'react';
import { BuildingCanvas, useBlockManagement, useTextManagement } from '../src';

// Advanced usage with hooks and custom configuration
function AdvancedUsage() {
  const {
    blocks,
    selectedBlock,
    addBlock,
    updateBlock,
    deleteBlock,
    getBlocksByType,
    getBlocksByStatus
  } = useBlockManagement(
    [], // initial blocks
    (block) => console.log('Block saved to backend:', block),
    (id, updates) => console.log('Block updated in backend:', id, updates),
    (id) => console.log('Block deleted from backend:', id)
  );

  const {
    texts,
    selectedText,
    addText,
    updateText,
    deleteText
  } = useTextManagement(
    [], // initial texts
    (text) => console.log('Text saved:', text),
    (id, updates) => console.log('Text updated:', id, updates),
    (id) => console.log('Text deleted:', id)
  );

  // Custom configuration
  const config = {
    ground: { 
      size: 30, 
      color: '#e6f7ff' 
    },
    blocks: { 
      colors: { 
        available: '#52c41a', 
        sold: '#ff4d4f',
        reserved: '#faad14',
        under_construction: '#722ed1'
      },
      minSize: 1,
      maxSize: 15
    },
    controls: { 
      enabled: true,
      position: 'left'
    }
  };

  // Custom permissions
  const permissions = {
    canEdit: true,
    canDelete: true,
    canSell: true
  };

  // Handle block selling
  const handleBlockSell = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      // Update block status to sold
      updateBlock(blockId, { status: 'sold' });
      console.log(`Block ${block.unitNumber} has been sold!`);
    }
  };

  // Load initial data
  useEffect(() => {
    // Simulate loading data from API
    const initialBlocks = [
      {
        id: 'building-a-1',
        position: [0, 0, 0],
        dimensions: { width: 3, height: 4, depth: 2 },
        type: 'apartment',
        status: 'available',
        unitNumber: 'A101'
      },
      {
        id: 'building-a-2',
        position: [4, 0, 0],
        dimensions: { width: 2, height: 2, depth: 2 },
        type: 'store',
        status: 'sold',
        unitNumber: 'S01'
      },
      {
        id: 'building-b-1',
        position: [0, 0, 4],
        dimensions: { width: 2, height: 3, depth: 3 },
        type: 'apartment',
        status: 'reserved',
        unitNumber: 'B101'
      }
    ];

    const initialTexts = [
      {
        id: 'label-building-a',
        position: [2, 5, 0],
        text: 'Building A',
        color: '#1890ff',
        fontSize: 0.6
      },
      {
        id: 'label-building-b',
        position: [1, 4, 4],
        text: 'Building B',
        color: '#52c41a',
        fontSize: 0.5
      }
    ];

    // Add blocks and texts
    initialBlocks.forEach(block => addBlock(block.position, block.type));
    initialTexts.forEach(text => addText(text.position, text.text));
  }, [addBlock, addText]);

  // Statistics
  const stats = {
    total: blocks.length,
    apartments: getBlocksByType('apartment').length,
    stores: getBlocksByType('store').length,
    available: getBlocksByStatus('available').length,
    sold: getBlocksByStatus('sold').length,
    reserved: getBlocksByStatus('reserved').length
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Statistics overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '8px',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <h4>Project Statistics</h4>
        <p>Total Units: {stats.total}</p>
        <p>Apartments: {stats.apartments}</p>
        <p>Stores: {stats.stores}</p>
        <p>Available: {stats.available}</p>
        <p>Sold: {stats.sold}</p>
        <p>Reserved: {stats.reserved}</p>
      </div>

      <BuildingCanvas
        initialBlocks={blocks}
        initialTexts={texts}
        onBlockSave={addBlock}
        onBlockUpdate={updateBlock}
        onBlockDelete={deleteBlock}
        onBlockSell={handleBlockSell}
        onTextSave={addText}
        onTextUpdate={updateText}
        onTextDelete={deleteText}
        showControlPanel={true}
        config={config}
        permissions={permissions}
        theme="light"
      />
    </div>
  );
}

export default AdvancedUsage;