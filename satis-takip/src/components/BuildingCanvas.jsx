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

  // Checks if two blocks are overlapping
  const areBlocksOverlapping = (block1, block2) => {
    const [x1, y1, z1] = block1.position;
    const [x2, y2, z2] = block2.position;
    const d1 = block1.dimensions;
    const d2 = block2.dimensions;

    return (
      x1 < x2 + d2.width && x1 + d1.width > x2 &&
      y1 < y2 + d2.height && y1 + d1.height > y2 &&
      z1 < z2 + d2.depth && z1 + d1.depth > z2
    );
  };

  // Check if one block is directly above another
  const isBlockDirectlyAbove = (upperBlock, lowerBlock) => {
    const [x1, y1, z1] = upperBlock.position;
    const [x2, y2, z2] = lowerBlock.position;
    const d1 = upperBlock.dimensions;
    const d2 = lowerBlock.dimensions;

    // Check if blocks overlap in X and Z axes
    const overlapX = x1 < (x2 + d2.width) && (x1 + d1.width) > x2;
    const overlapZ = z1 < (z2 + d2.depth) && (z1 + d1.depth) > z2;

    // Check if the upper block is actually above the lower block
    const isAbove = y1 >= y2;

    return overlapX && overlapZ && isAbove;
  };

  // Calculate how much a block needs to be moved based on dimension change
  const calculateOverlapDisplacement = (modifiedBlock, otherBlock, oldDimensions) => {
    const [x1, y1, z1] = modifiedBlock.position;
    const [x2, y2, z2] = otherBlock.position;
    const d1 = modifiedBlock.dimensions;

    // Determine which dimension changed and its direction
    const widthChange = d1.width - oldDimensions.width;
    const heightChange = d1.height - oldDimensions.height;
    const depthChange = d1.depth - oldDimensions.depth;

    // For height changes, we want to move all blocks that are above
    if (heightChange !== 0 && isBlockDirectlyAbove(otherBlock, modifiedBlock)) {
      return { axis: 'y', amount: Math.abs(heightChange) };
    }

    // For width changes, only move blocks to the right that are overlapping
    if (widthChange !== 0 && areBlocksOverlapping(modifiedBlock, otherBlock)) {
      if (x2 > x1) {
        return { axis: 'x', amount: Math.abs(widthChange) };
      }
    }

    // For depth changes, only move blocks to the front that are overlapping
    if (depthChange !== 0 && areBlocksOverlapping(modifiedBlock, otherBlock)) {
      if (z2 > z1) {
        return { axis: 'z', amount: Math.abs(depthChange) };
      }
    }

    return null;
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

  // Find all blocks that need to be moved upward
  const findBlocksToMove = (baseBlock) => {
    const blocksToMove = [];

    // Get all blocks that are above the modified block
    blocks.forEach(block => {
      if ((block._id || block.id) !== (baseBlock._id || baseBlock.id)) {
        const [x1, y1, z1] = block.position;
        const d1 = block.dimensions;
        const [x2, y2, z2] = baseBlock.position;
        const d2 = baseBlock.dimensions;

        // Check if the block is within the X-Z bounds of the modified block
        const overlapX = x1 < (x2 + d2.width) && (x1 + d1.width) > x2;
        const overlapZ = z1 < (z2 + d2.depth) && (z1 + d1.depth) > z2;

        // Check if the block is above the modified block
        if (overlapX && overlapZ && y1 >= y2) {
          blocksToMove.push({
            block,
            y: y1,
            id: block._id || block.id
          });
        }
      }
    });

    // Sort blocks by height (bottom to top)
    return blocksToMove.sort((a, b) => a.y - b.y);
  };

  // Recursively adjust block positions to resolve overlaps
  const resolveOverlaps = (modifiedBlockId, modifiedBlock, oldDimensions, processedBlocks = new Set()) => {
    processedBlocks.add(modifiedBlockId);
    
    const heightChange = modifiedBlock.dimensions.height - oldDimensions.height;
    const widthChange = modifiedBlock.dimensions.width - oldDimensions.width;
    const depthChange = modifiedBlock.dimensions.depth - oldDimensions.depth;
    
    // Create a map to store all updates
    const updatedBlocks = new Map();

    if (heightChange !== 0) {
      // Find all blocks that need to be moved, sorted by height
      const blocksToMove = findBlocksToMove(modifiedBlock);
      
      // Calculate new positions for all affected blocks
      blocksToMove.forEach(({block}) => {
        const newPosition = [...block.position];
        newPosition[1] += Math.abs(heightChange);
        
        updatedBlocks.set(block._id || block.id, {
          ...block,
          position: newPosition
        });
      });
    }

    // Handle width and depth changes
    blocks.forEach(block => {
      const blockId = block._id || block.id;
      if (blockId !== modifiedBlockId && !processedBlocks.has(blockId) && !updatedBlocks.has(blockId)) {
        if (widthChange !== 0 || depthChange !== 0) {
          const [x1, y1, z1] = block.position;
          const [x2, y2, z2] = modifiedBlock.position;
          
          // Check if block needs to move in width direction
          if (widthChange !== 0 && x1 > x2) {
            const newPosition = [...block.position];
            newPosition[0] += Math.abs(widthChange);
            updatedBlocks.set(blockId, { ...block, position: newPosition });
          }
          
          // Check if block needs to move in depth direction
          if (depthChange !== 0 && z1 > z2) {
            const currentBlock = updatedBlocks.get(blockId) || block;
            const newPosition = [...currentBlock.position];
            newPosition[2] += Math.abs(depthChange);
            updatedBlocks.set(blockId, { ...currentBlock, position: newPosition });
          }
        }
      }
    });

    // Apply all updates at once if there are any
    if (updatedBlocks.size > 0) {
      setBlocks(prevBlocks =>
        prevBlocks.map(block => {
          const blockId = block._id || block.id;
          return updatedBlocks.has(blockId) ? updatedBlocks.get(blockId) : block;
        })
      );
    }
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
    
    const heightChange = newDimensions.height - oldDimensions.height;
    const [baseX, baseY, baseZ] = blockToUpdate.position;

    // Üstteki blokları bul
    const blocksAbove = blocks.filter(block => {
      if ((block._id || block.id) === selectedBlock) return false;
      const [blockX, blockY, blockZ] = block.position;
      
      // X-Z düzleminde çakışma kontrolü
      const hasXZOverlap = (
        blockX < baseX + blockToUpdate.dimensions.width &&
        blockX + block.dimensions.width > baseX &&
        blockZ < baseZ + blockToUpdate.dimensions.depth &&
        blockZ + block.dimensions.depth > baseZ
      );

      // Üstte olma kontrolü
      return hasXZOverlap && blockY >= baseY + oldDimensions.height;
    }).sort((a, b) => a.position[1] - b.position[1]); // Yüksekliğe göre sırala

    const updatedBlockData = {
      ...blockToUpdate,
      position: newPosition,
      dimensions: newDimensions
    };

    try {
      // Önce seçili bloğu güncelle
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

      // Üstteki blokları güncelle
      if (blocksAbove.length > 0) {
        const updatedPositions = new Map();

        // Yükseklik azaltıldıysa blokları aşağı indir
        if (heightChange < 0) {
          blocksAbove.forEach(block => {
            const newBlockPosition = [...block.position];
            newBlockPosition[1] += heightChange; // Yükseklik farkı kadar aşağı indir
            updatedPositions.set(block._id || block.id, {
              ...block,
              position: newBlockPosition
            });
          });
        }
        // Yükseklik artırıldıysa blokları yukarı çıkar
        else if (heightChange > 0) {
          blocksAbove.forEach(block => {
            const newBlockPosition = [...block.position];
            newBlockPosition[1] += heightChange; // Yükseklik farkı kadar yukarı çıkar
            updatedPositions.set(block._id || block.id, {
              ...block,
              position: newBlockPosition
            });
          });
        }

        // Tüm güncellemeleri tek seferde uygula
        if (updatedPositions.size > 0) {
          setBlocks(prevBlocks =>
            prevBlocks.map(block => {
              const blockId = block._id || block.id;
              return updatedPositions.has(blockId) ? updatedPositions.get(blockId) : block;
            })
          );

          // Veritabanını güncelle
          for (const [blockId, updatedBlock] of updatedPositions) {
            if (updatedBlock._id) {
              try {
                await updateBlock(blockId, updatedBlock);
              } catch (error) {
                console.error(`Error updating block ${blockId}:`, error);
              }
            }
          }
        }
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
