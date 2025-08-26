import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { BuildingBlock, Text3D, ControlPanel } from '../src';

// Example of using individual components to create a custom editor
function CustomComponentsExample() {
  const [blocks, setBlocks] = useState([
    {
      id: 'custom-1',
      position: [0, 0, 0],
      dimensions: { width: 2, height: 3, depth: 2 },
      type: 'apartment',
      status: 'available',
      unitNumber: 'C1'
    },
    {
      id: 'custom-2',
      position: [3, 0, 0],
      dimensions: { width: 1, height: 2, depth: 1 },
      type: 'store',
      status: 'sold',
      unitNumber: 'S1'
    }
  ]);

  const [texts, setTexts] = useState([
    {
      id: 'custom-text-1',
      position: [1.5, 4, 0],
      text: 'Custom Building',
      color: '#ff6b35',
      fontSize: 0.4
    }
  ]);

  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleBlockClick = (blockId, event) => {
    event.stopPropagation();
    setSelectedBlock(blockId === selectedBlock ? null : blockId);
  };

  const handleTextClick = (textId) => {
    setSelectedText(textId === selectedText ? null : textId);
  };

  const updateBlockDimensions = (newDimensions) => {
    if (!selectedBlock) return;
    
    setBlocks(prev => prev.map(block => 
      block.id === selectedBlock 
        ? { ...block, dimensions: newDimensions }
        : block
    ));
  };

  const updateBlockDetails = (blockId, details) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, ...details }
        : block
    ));
  };

  const deleteBlock = (blockId) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    setSelectedBlock(null);
  };

  const updateText = (textId, updates) => {
    setTexts(prev => prev.map(text => 
      text.id === textId 
        ? { ...text, ...updates }
        : text
    ));
  };

  const deleteText = (textId) => {
    setTexts(prev => prev.filter(text => text.id !== textId));
    setSelectedText(null);
  };

  const getSelectedBlockDimensions = () => {
    if (!selectedBlock) return { width: 1, height: 1, depth: 1 };
    const block = blocks.find(b => b.id === selectedBlock);
    return block?.dimensions || { width: 1, height: 1, depth: 1 };
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Custom Control Panel */}
      <div style={{ 
        width: '350px', 
        height: '100%', 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '2px solid rgba(255, 255, 255, 0.3)',
        overflow: 'auto'
      }}>
        <ControlPanel 
          editMode={editMode}
          setEditMode={setEditMode}
          addMode={false}
          setAddMode={() => {}}
          textMode={false}
          setTextMode={() => {}}
          selectedBlock={selectedBlock}
          selectedBlockDimensions={getSelectedBlockDimensions()}
          onUpdateBlockDimensions={updateBlockDimensions}
          onUpdateBlockDetails={updateBlockDetails}
          onDeleteBlock={deleteBlock}
          blocks={blocks}
          selectedText={selectedText}
          onUpdateText={updateText}
          onDeleteText={deleteText}
          texts={texts}
          config={{
            blocks: {
              minSize: 0.5,
              maxSize: 8
            }
          }}
        />
      </div>

      {/* Custom 3D Scene */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Custom header */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Custom 3D Building Editor
        </div>

        <Canvas 
          camera={{ position: [8, 8, 8], fov: 60 }}
          style={{ marginTop: '60px', height: 'calc(100% - 60px)' }}
        >
          {/* Custom lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={0.6}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Custom grid */}
          <Grid
            args={[50, 50]}
            position={[0, 0, 0]}
            cellSize={1}
            cellThickness={1}
            cellColor="#ffffff"
            sectionSize={5}
            sectionThickness={2}
            sectionColor="#ff6b35"
            fadeDistance={25}
            fadeStrength={1}
          />

          {/* Render blocks */}
          {blocks.map((block) => (
            <BuildingBlock
              key={block.id}
              {...block}
              onSelect={(e) => handleBlockClick(block.id, e)}
              isSelected={selectedBlock === block.id}
              editMode={editMode}
              addMode={false}
            />
          ))}

          {/* Render texts */}
          {texts.map((text) => (
            <Text3D
              key={text.id}
              {...text}
              onSelect={() => handleTextClick(text.id)}
              isSelected={selectedText === text.id}
              editMode={editMode}
              onDrag={(x, y, z) => {
                updateText(text.id, { position: [x, y, z] });
              }}
            />
          ))}

          {/* Custom ground plane */}
          <mesh 
            position={[0, -0.01, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[50, 50]} />
            <meshLambertMaterial 
              color="#f0f0f0" 
              transparent 
              opacity={0.8}
            />
          </mesh>

          {/* Camera controls */}
          <OrbitControls 
            makeDefault
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>

        {/* Custom footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          fontSize: '14px'
        }}>
          <span>Blocks: {blocks.length} | Texts: {texts.length}</span>
          <span>Edit Mode: {editMode ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
}

export default CustomComponentsExample;