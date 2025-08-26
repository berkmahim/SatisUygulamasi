import React, { useState } from 'react';
import { BuildingCanvas } from '../src';

// Basic usage example - minimal setup
function BasicUsage() {
  const [blocks, setBlocks] = useState([]);

  const handleBlockSave = (block) => {
    console.log('New block created:', block);
    setBlocks(prev => [...prev, block]);
  };

  const handleBlockUpdate = (blockId, updates) => {
    console.log('Block updated:', blockId, updates);
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const handleBlockDelete = (blockId) => {
    console.log('Block deleted:', blockId);
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BuildingCanvas
        initialBlocks={blocks}
        onBlockSave={handleBlockSave}
        onBlockUpdate={handleBlockUpdate}
        onBlockDelete={handleBlockDelete}
        showControlPanel={true}
      />
    </div>
  );
}

export default BasicUsage;