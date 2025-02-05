import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useParams } from 'react-router-dom';
import BuildingBlock from './BuildingBlock';
import ControlPanel from './ControlPanel';
import { getAllBlocks, createBlock, updateBlock, deleteBlock } from '../services/blockService';

const Scene = ({ onAddBlock, blocks, selectedBlock, onBlockClick, editMode, addMode }) => {
  const { camera } = useThree();
  const groundRef = useRef();
  const clickedRef = useRef(false);

  const handleGroundPointerDown = (event) => {
    if (!editMode || !addMode || clickedRef.current) return;
    
    // Only handle direct ground clicks
    if (event.object !== groundRef.current) return;
    
    event.stopPropagation();
    clickedRef.current = true;
    
    const point = event.point;
    onAddBlock([
      Math.round(point.x - 0.5),
      0,
      Math.round(point.z - 0.5)
    ]);

    // Reset click state after a short delay
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
    
    // Calculate new block position based on the clicked face normal
    let newPosition;
    const epsilon = 0.001; // Smaller epsilon for more precise face detection

    // Determine which face was clicked by comparing normal components
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

    // Don't allow blocks below ground level
    if (newPosition[1] < 0) return;

    // Create the new block
    onAddBlock(newPosition);

    // Reset click state after a short delay
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

const BuildingCanvas = () => {
  const { id: projectId } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [expansionDirections, setExpansionDirections] = useState({
    width: 'right',
    height: 'up',
    depth: 'forward'
  });

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const data = await getAllBlocks(projectId);
        setBlocks(data);
      } catch (error) {
        console.error('Error fetching blocks:', error);
      }
    };
    if (projectId) {
      fetchBlocks();
    }
  }, [projectId]);

  const getSelectedBlockDimensions = () => {
    if (!selectedBlock) return { width: 1, height: 1, depth: 1 };
    const block = blocks.find(b => (b._id || b.id) === selectedBlock);
    return block?.dimensions || { width: 1, height: 1, depth: 1 };
  };

  const calculateNewPosition = (oldPosition, oldDimensions, newDimensions) => {
    const widthDiff = newDimensions.width - oldDimensions.width;
    const heightDiff = newDimensions.height - oldDimensions.height;
    const depthDiff = newDimensions.depth - oldDimensions.depth;

    const [x, y, z] = oldPosition;
    let newX = x, newY = y, newZ = z;

    if (expansionDirections.width === 'left') {
      newX = x - widthDiff;
    } else if (expansionDirections.width === 'center') {
      newX = x - widthDiff / 2;
    }

    if (expansionDirections.height === 'down') {
      newY = y - heightDiff;
    } else if (expansionDirections.height === 'center') {
      newY = y - heightDiff / 2;
    }

    if (expansionDirections.depth === 'backward') {
      newZ = z - depthDiff;
    } else if (expansionDirections.depth === 'center') {
      newZ = z - depthDiff / 2;
    }

    return [newX, newY, newZ];
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (editMode && e.key === 'Delete' && selectedBlock !== null) {
        try {
          const blockToDelete = blocks.find(b => (b._id || b.id) === selectedBlock);
          if (blockToDelete._id) {
            await deleteBlock(selectedBlock);
          }
          setBlocks(prevBlocks => prevBlocks.filter(block => (block._id || block.id) !== selectedBlock));
          setSelectedBlock(null);
        } catch (error) {
          console.error('Error deleting block:', error);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlock, editMode]);

  const addBlock = async (position) => {
    const exists = blocks.some(block =>
      block.position.every((coord, index) => Math.abs(coord - position[index]) < 0.1)
    );

    if (!exists) {
      const newBlockData = {
        position,
        dimensions: { width: 1, height: 1, depth: 1 },
        type: position[1] === 0 ? 'store' : 'apartment', 
        unitNumber: '',
        owner: '',
        squareMeters: 0,
        roomCount: ''
      };

      try {
        const savedBlock = await createBlock(projectId, newBlockData);
        setBlocks(prevBlocks => [...prevBlocks, savedBlock]);
      } catch (error) {
        console.error('Error creating block:', error);
      }
    }
  };

  const handleBlockClick = (blockId, event) => {
    event.stopPropagation();
    setSelectedBlock(blockId === selectedBlock ? null : blockId);
  };

  const handleUpdateBlockDimensions = async (newDimensions) => {
    if (!selectedBlock) return;
    
    const blockToUpdate = blocks.find(b => (b._id || b.id) === selectedBlock);
    if (!blockToUpdate) return;

    const oldDimensions = blockToUpdate.dimensions;
    const newPosition = calculateNewPosition(blockToUpdate.position, oldDimensions, newDimensions);
    
    const updatedBlockData = {
      ...blockToUpdate,
      position: newPosition,
      dimensions: newDimensions
    };

    try {
      if (blockToUpdate._id) {
        const updatedBlock = await updateBlock(selectedBlock, updatedBlockData);
        setBlocks(prevBlocks => prevBlocks.map(block => 
          (block._id || block.id) === selectedBlock ? updatedBlock : block
        ));
      } else {
        setBlocks(prevBlocks => prevBlocks.map(block => 
          (block._id || block.id) === selectedBlock ? updatedBlockData : block
        ));
      }
    } catch (error) {
      console.error('Error updating block:', error);
    }
  };

  const handleUpdateBlockDetails = async (blockId, details) => {
    try {
      const updatedBlock = await updateBlock(blockId, details);
      setBlocks(prevBlocks => prevBlocks.map(block => 
        (block._id || block.id) === blockId ? updatedBlock : block
      ));
    } catch (error) {
      console.error('Error updating block details:', error);
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }} tabIndex={0}>
      <ControlPanel 
        editMode={editMode} 
        setEditMode={setEditMode}
        addMode={addMode}
        setAddMode={setAddMode}
        selectedBlock={selectedBlock}
        selectedBlockDimensions={getSelectedBlockDimensions()}
        onUpdateBlockDimensions={handleUpdateBlockDimensions}
        expansionDirections={expansionDirections}
        onUpdateExpansionDirections={setExpansionDirections}
        onUpdateBlockDetails={handleUpdateBlockDetails}
        blocks={blocks}
      />
      <Canvas 
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows
      >
        <Scene
          blocks={blocks}
          selectedBlock={selectedBlock}
          onAddBlock={addBlock}
          onBlockClick={handleBlockClick}
          editMode={editMode}
          addMode={addMode}
        />
      </Canvas>
    </div>
  );
};

export default BuildingCanvas;
