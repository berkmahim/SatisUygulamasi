import React, { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import BuildingBlock from './BuildingBlock';
import ControlPanel from './ControlPanel';
import { getAllBlocks, createBlock, updateBlock, deleteBlock } from '../services/blockService';

const Scene = ({ onAddBlock, blocks, selectedBlock, onBlockClick, editMode, addMode }) => {
  const { camera, size } = useThree();

  const handleClick = (event) => {
    if (!editMode || !addMode) return;
    
    event.stopPropagation();
    
    if (event.object && event.object.type === 'Mesh') {
      const clickedPoint = event.point;
      const normal = event.face.normal.clone();
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(event.object.matrixWorld);
      normal.applyMatrix3(normalMatrix).normalize();

      const newPosition = [
        Math.round(clickedPoint.x) + normal.x,
        Math.round(clickedPoint.y) + normal.y,
        Math.round(clickedPoint.z) + normal.z
      ];

      onAddBlock(newPosition);
      return;
    }

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (event.clientX / size.width) * 2 - 1,
      -(event.clientY / size.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectionPoint);

    if (intersectionPoint) {
      onAddBlock([
        Math.round(intersectionPoint.x),
        0,
        Math.round(intersectionPoint.z)
      ]);
    }
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
          onClick={(e) => handleClick(e)}
          onSelect={(e) => editMode && onBlockClick(block._id || block.id, e)}
          isSelected={selectedBlock === (block._id || block.id)}
          editMode={editMode}
          addMode={addMode}
        />
      ))}

      <OrbitControls makeDefault />
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={handleClick}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
};

const BuildingCanvas = () => {
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
        const data = await getAllBlocks();
        setBlocks(data);
      } catch (error) {
        console.error('Error fetching blocks:', error);
      }
    };
    fetchBlocks();
  }, []);

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
        const savedBlock = await createBlock(newBlockData);
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
