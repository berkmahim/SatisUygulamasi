import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import BuildingBlock from './BuildingBlock';
import Text3D from './Text3D';
import ControlPanel from './ControlPanel';

const Scene = ({ 
  onAddBlock, 
  blocks, 
  selectedBlock, 
  onBlockClick, 
  editMode, 
  addMode, 
  onBlockHover, 
  texts, 
  onAddText, 
  onTextClick, 
  selectedText, 
  onTextHover, 
  textMode,
  onTextDrag
}) => {
  const { camera } = useThree();
  const groundRef = useRef();
  const clickedRef = useRef(false);

  const handleGroundPointerDown = (event) => {
    if (!editMode) return;
    
    if (event.object !== groundRef.current) return;
    
    event.stopPropagation();
    clickedRef.current = true;
    
    const point = event.point;
    
    if (textMode) {
      onAddText(
        [
          Math.round(point.x),
          0.5,
          Math.round(point.z)
        ],
        "New Text"
      );
    } else if (addMode) {
      onAddBlock([
        Math.round(point.x - 0.5),
        0,
        Math.round(point.z - 0.5)
      ]);
    }

    setTimeout(() => {
      clickedRef.current = false;
    }, 100);
  };

  const handleBlockPointerDown = (event) => {
    if (!editMode || !addMode || clickedRef.current) return;
    
    event.nativeEvent.stopPropagation();
    clickedRef.current = true;
    
    const { point, face, blockData } = event;
    if (!face || !blockData) return;

    const normal = face.normal;
    let newPosition;
    const epsilon = 0.001;

    if (Math.abs(normal.y) > 1 - epsilon) {
      // Top/Bottom face
      newPosition = [
        blockData.position[0],
        blockData.position[1] + (normal.y > 0 ? blockData.dimensions.height : -blockData.dimensions.height),
        blockData.position[2]
      ];
    } else if (Math.abs(normal.x) > 1 - epsilon) {
      // Left/Right face
      newPosition = [
        blockData.position[0] + (normal.x > 0 ? blockData.dimensions.width : -blockData.dimensions.width),
        blockData.position[1],
        blockData.position[2]
      ];
    } else {
      // Front/Back face
      newPosition = [
        blockData.position[0],
        blockData.position[1],
        blockData.position[2] + (normal.z > 0 ? blockData.dimensions.depth : -blockData.dimensions.depth)
      ];
    }

    if (newPosition[1] < 0) return;

    onAddBlock(newPosition);

    setTimeout(() => {
      clickedRef.current = false;
    }, 100);
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      
      <Grid
        args={[100, 100]}
        position={[0, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={3}
      />

      {blocks.map((block) => (
        <BuildingBlock
          key={block._id || block.id}
          {...block}
          onPointerDown={handleBlockPointerDown}
          onSelect={(e) => editMode && onBlockClick(block._id || block.id, e)}
          isSelected={selectedBlock === (block._id || block.id)}
          editMode={editMode}
          addMode={addMode}
          onHover={onBlockHover}
        />
      ))}

      {texts.map((text) => (
        <Text3D
          key={text.id}
          {...text}
          onSelect={(e) => editMode && onTextClick(text.id, e)}
          isSelected={selectedText === text.id}
          editMode={editMode}
          onHover={onTextHover}
          onDrag={onTextDrag}
        />
      ))}

      <OrbitControls makeDefault />
      <mesh 
        ref={groundRef}
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        onPointerDown={handleGroundPointerDown}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
};

const BuildingCanvas = ({
  initialBlocks = [],
  initialTexts = [],
  onBlockSave,
  onBlockDelete,
  onBlockUpdate,
  onBlockSell,
  onTextSave,
  onTextDelete,
  onTextUpdate,
  showControlPanel = true,
  config = {},
  permissions = { canEdit: true, canDelete: true },
  theme = 'light'
}) => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [texts, setTexts] = useState(initialTexts);
  const [selectedText, setSelectedText] = useState(null);
  const [textMode, setTextMode] = useState(false);
  const [hoveredBlockOwner, setHoveredBlockOwner] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Update blocks when initialBlocks change
  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  // Update texts when initialTexts change
  useEffect(() => {
    setTexts(initialTexts);
  }, [initialTexts]);

  const getSelectedBlockDimensions = () => {
    if (!selectedBlock) return { width: 1, height: 1, depth: 1 };
    const block = blocks.find(b => (b._id || b.id) === selectedBlock);
    return block?.dimensions || { width: 1, height: 1, depth: 1 };
  };

  const addBlock = (position) => {
    const exists = blocks.some(block =>
      block.position.every((coord, index) => Math.abs(coord - position[index]) < 0.1)
    );

    if (!exists) {
      const newBlockData = {
        id: `block-${Date.now()}`,
        position,
        dimensions: { width: 1, height: 1, depth: 1 },
        type: position[1] === 0 ? 'store' : 'apartment',
        unitNumber: '',
        status: 'available'
      };

      setBlocks(prevBlocks => [...prevBlocks, newBlockData]);
      
      if (onBlockSave) {
        onBlockSave(newBlockData);
      }
    }
  };

  const handleBlockClick = (blockId, event) => {
    event.stopPropagation();
    setSelectedBlock(blockId === selectedBlock ? null : blockId);
  };

  const handleUpdateBlockDimensions = (newDimensions) => {
    if (!selectedBlock) return;
    
    const blockToUpdate = blocks.find(b => (b._id || b.id) === selectedBlock);
    if (!blockToUpdate) return;

    const updatedBlockData = {
      ...blockToUpdate,
      dimensions: newDimensions
    };

    setBlocks(prevBlocks => prevBlocks.map(block => 
      (block._id || block.id) === selectedBlock ? updatedBlockData : block
    ));

    if (onBlockUpdate) {
      onBlockUpdate(selectedBlock, updatedBlockData);
    }
  };

  const handleUpdateBlockDetails = (blockId, details) => {
    const updatedBlockData = { ...details };
    
    setBlocks(prevBlocks => prevBlocks.map(block => 
      (block._id || block.id) === blockId ? { ...block, ...updatedBlockData } : block
    ));

    if (onBlockUpdate) {
      onBlockUpdate(blockId, updatedBlockData);
    }
  };

  const handleDeleteBlock = (blockId) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => (block._id || block.id) !== blockId));
    setSelectedBlock(null);
    
    if (onBlockDelete) {
      onBlockDelete(blockId);
    }
  };

  const addText = (position, text) => {
    const newTextData = {
      id: `text-${Date.now()}`,
      position,
      text,
      color: "#ffffff",
      fontSize: 0.3
    };

    setTexts(prevTexts => [...prevTexts, newTextData]);
    
    if (onTextSave) {
      onTextSave(newTextData);
    }
  };

  const handleTextClick = (textId) => {
    setSelectedText(textId === selectedText ? null : textId);
  };

  const handleUpdateText = (textId, newContent) => {
    setTexts(prevTexts => prevTexts.map(text => {
      if (text.id === textId) {
        if (typeof newContent === 'string') {
          return { ...text, text: newContent };
        }
        return { ...text, ...newContent };
      }
      return text;
    }));

    if (onTextUpdate) {
      onTextUpdate(textId, newContent);
    }
  };

  const handleDeleteText = (textId) => {
    setTexts(prevTexts => prevTexts.filter(text => text.id !== textId));
    setSelectedText(null);
    
    if (onTextDelete) {
      onTextDelete(textId);
    }
  };

  const handleTextDrag = (textId, x, y, z) => {
    setTexts(prevTexts => 
      prevTexts.map(item => {
        if (item.id === textId) {
          return {
            ...item,
            position: [x, y, z]
          };
        }
        return item;
      })
    );

    if (onTextUpdate) {
      onTextUpdate(textId, { position: [x, y, z] });
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative', 
      display: 'flex',
      backgroundColor: theme === 'dark' ? '#141414' : '#f0f2f5'
    }} tabIndex={0}>
      {showControlPanel && (
        <div style={{ 
          width: '300px', 
          height: '100%', 
          overflow: 'auto', 
          borderRight: '1px solid #e8e8e8',
          backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff'
        }}>
          <ControlPanel 
            editMode={editMode} 
            setEditMode={setEditMode}
            addMode={addMode}
            setAddMode={setAddMode}
            textMode={textMode}
            setTextMode={setTextMode}
            selectedBlock={selectedBlock}
            selectedBlockDimensions={getSelectedBlockDimensions()}
            onUpdateBlockDimensions={handleUpdateBlockDimensions}
            onUpdateBlockDetails={handleUpdateBlockDetails}
            onDeleteBlock={handleDeleteBlock}
            blocks={blocks}
            selectedText={selectedText}
            onUpdateText={handleUpdateText}
            onDeleteText={handleDeleteText}
            texts={texts}
            onBlockSell={onBlockSell}
            config={config}
          />
        </div>
      )}
      
      <div style={{ flex: '1', position: 'relative' }}>
        {tooltipVisible && hoveredBlockOwner && (
          <div
            style={{
              position: 'fixed',
              left: mousePosition.x + 10,
              top: mousePosition.y + 10,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            {hoveredBlockOwner}
          </div>
        )}
        
        <Canvas 
          camera={{ position: [10, 10, 10], fov: 50 }}
          shadows
          onMouseMove={(e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
          }}
        >
          <Scene
            blocks={blocks}
            selectedBlock={selectedBlock}
            onAddBlock={addBlock}
            onBlockClick={handleBlockClick}
            editMode={editMode}
            addMode={addMode}
            onBlockHover={(owner, visible) => {
              setHoveredBlockOwner(owner);
              setTooltipVisible(visible);
            }}
            texts={texts}
            onAddText={addText}
            onTextClick={handleTextClick}
            selectedText={selectedText}
            onTextHover={(owner, visible) => {
              setHoveredBlockOwner(owner);
              setTooltipVisible(visible);
            }}
            textMode={textMode}
            onTextDrag={handleTextDrag}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default BuildingCanvas;