import React, { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import BuildingCanvas from './components/BuildingCanvas';

function App() {
  const [blocks, setBlocks] = useState([
    {
      id: 'block-1',
      position: [0, 0, 0],
      dimensions: { width: 2, height: 3, depth: 2 },
      type: 'apartment',
      status: 'available',
      unitNumber: 'A1'
    },
    {
      id: 'block-2',
      position: [3, 0, 0],
      dimensions: { width: 1, height: 1, depth: 1 },
      type: 'store',
      status: 'sold',
      unitNumber: 'S1'
    }
  ]);

  const [texts, setTexts] = useState([
    {
      id: 'text-1',
      position: [0, 4, 0],
      text: 'Building A',
      color: '#ffffff',
      fontSize: 0.5
    }
  ]);

  const handleBlockSave = (block) => {
    console.log('Block saved:', block);
    setBlocks(prev => [...prev, block]);
  };

  const handleBlockUpdate = (blockId, updates) => {
    console.log('Block updated:', blockId, updates);
    setBlocks(prev => prev.map(block => 
      (block.id || block._id) === blockId 
        ? { ...block, ...updates }
        : block
    ));
  };

  const handleBlockDelete = (blockId) => {
    console.log('Block deleted:', blockId);
    setBlocks(prev => prev.filter(block => (block.id || block._id) !== blockId));
  };

  const handleBlockSell = (blockId) => {
    console.log('Block sell requested:', blockId);
    // Handle block selling logic here
    alert(`Selling block ${blockId}`);
  };

  const handleTextSave = (text) => {
    console.log('Text saved:', text);
    setTexts(prev => [...prev, text]);
  };

  const handleTextUpdate = (textId, updates) => {
    console.log('Text updated:', textId, updates);
    setTexts(prev => prev.map(text => 
      text.id === textId 
        ? { ...text, ...updates }
        : text
    ));
  };

  const handleTextDelete = (textId) => {
    console.log('Text deleted:', textId);
    setTexts(prev => prev.filter(text => text.id !== textId));
  };

  const config = {
    ground: { 
      size: 20, 
      color: '#f0f0f0' 
    },
    blocks: { 
      colors: { 
        available: '#52c41a', 
        sold: '#ff4d4f',
        reserved: '#faad14'
      },
      minSize: 0.5,
      maxSize: 10
    },
    controls: { 
      enabled: true,
      position: 'left'
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <div style={{ width: '100vw', height: '100vh' }}>
        <BuildingCanvas
          initialBlocks={blocks}
          initialTexts={texts}
          onBlockSave={handleBlockSave}
          onBlockUpdate={handleBlockUpdate}
          onBlockDelete={handleBlockDelete}
          onBlockSell={handleBlockSell}
          onTextSave={handleTextSave}
          onTextUpdate={handleTextUpdate}
          onTextDelete={handleTextDelete}
          showControlPanel={true}
          config={config}
          permissions={{ canEdit: true, canDelete: true }}
          theme="light"
        />
      </div>
    </ConfigProvider>
  );
}

export default App;