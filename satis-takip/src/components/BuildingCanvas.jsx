import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
import BuildingBlock from './BuildingBlock';
import Text3D from './Text3D';
import ControlPanel from './ControlPanel';
import SoldBlockPanel from './SoldBlockPanel';
import BlockContextMenu from './BlockContextMenu';
import { getAllBlocks, createBlock, updateBlock, deleteBlock } from '../services/blockService';

const Scene = ({ onAddBlock, blocks, selectedBlock, selectedBlocks, bulkSaleMode, onBlockClick, onBlockContextMenu, editMode, addMode, onBlockHover, texts, onAddText, onTextClick, selectedText, onTextHover, textMode }) => {
  const { camera } = useThree();
  const groundRef = useRef();
  const clickedRef = useRef(false);

  const handleGroundPointerDown = (event) => {
    if (!editMode) return;
    
    // Sadece zemine tıklandığında işlem yap
    if (event.object !== groundRef.current) return;
    
    event.stopPropagation();
    clickedRef.current = true;
    
    const point = event.point;
    
    if (textMode) {
      // Metin modu aktifse, tıklanan noktaya metin ekle
      onAddText(
        [
          Math.round(point.x),
          0.5, // Metin yerden biraz yukarıda olsun
          Math.round(point.z)
        ],
        "Yeni Metin"
      );
    } else if (addMode) {
      // Blok ekleme modu aktifse, blok ekle
      onAddBlock([
        Math.round(point.x - 0.5),
        0,
        Math.round(point.z - 0.5)
      ]);
    }

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

  const handleTextPointerDown = (event) => {
    if (!editMode || !addMode || clickedRef.current) return;
    
    event.nativeEvent.stopPropagation();
    clickedRef.current = true;
    
    const { point, textData } = event;
    if (!textData) return;

    onTextClick(textData.id === selectedText ? null : textData.id);

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
          onSelect={(e) => onBlockClick(block._id || block.id, e)}
          onContextMenu={(e) => onBlockContextMenu(block._id || block.id, e)}
          isSelected={bulkSaleMode ? selectedBlocks.includes(block._id || block.id) : selectedBlock === (block._id || block.id)}
          editMode={editMode}
          addMode={addMode}
          owner={block.owner}
          onHover={onBlockHover}
          unitNumber={block.unitNumber}
          hasOverduePayment={block.hasOverduePayment}
        />
      ))}

      {texts.map((text) => (
        <Text3D
          key={text.id}
          {...text}
          onPointerDown={handleTextPointerDown}
          onSelect={(e) => editMode && onTextClick(text.id, e)}
          isSelected={selectedText === text.id}
          editMode={editMode}
          addMode={addMode}
          onHover={onTextHover}
          onDrag={(x, y, z) => handleTextDrag(text.id, x, y, z)}
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
  const [hoveredBlockOwner, setHoveredBlockOwner] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]); // For bulk selection
  const [bulkSaleMode, setBulkSaleMode] = useState(false); // Bulk sale mode
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [texts, setTexts] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [textMode, setTextMode] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [soldBlockPanelVisible, setSoldBlockPanelVisible] = useState(false);
  const [selectedSoldBlockId, setSelectedSoldBlockId] = useState(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuBlockId, setContextMenuBlockId] = useState(null);
  // Sabit genişleme yönleri
  const expansionDirections = {
    width: 'right',    // Sağa doğru
    height: 'up',      // Yukarı doğru
    depth: 'forward'   // İleri doğru
  };

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const data = await getAllBlocks(projectId);
        setBlocks(data);
      } catch (error) {
        // Hata durumunda sessizce devam et
      }
    };
    if (projectId) {
      fetchBlocks();
    }
  }, [projectId]);

  // Close context menu when clicking outside and prevent browser context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuVisible) {
        setContextMenuVisible(false);
        setContextMenuBlockId(null);
      }
    };

    const handleGlobalContextMenu = (e) => {
      // Prevent browser context menu on canvas elements
      const canvas = e.target.closest('canvas');
      if (canvas) {
        e.preventDefault();
      }
    };

    if (contextMenuVisible) {
      document.addEventListener('click', handleClickOutside);
    }
    
    // Prevent browser context menu
    document.addEventListener('contextmenu', handleGlobalContextMenu);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
    };
  }, [contextMenuVisible]);

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

    // Epsilon değeri, sayısal hassasiyet sorunlarını önlemek için
    const epsilon = 0.001;

    return (
      x1 < x2 + d2.width + epsilon && x1 + d1.width + epsilon > x2 &&
      y1 < y2 + d2.height + epsilon && y1 + d1.height + epsilon > y2 &&
      z1 < z2 + d2.depth + epsilon && z1 + d1.depth + epsilon > z2
    );
  };

  // Check if one block is directly above another
  const isBlockDirectlyAbove = (upperBlock, lowerBlock) => {
    const [x1, y1, z1] = upperBlock.position;
    const [x2, y2, z2] = lowerBlock.position;
    const d1 = upperBlock.dimensions;
    const d2 = lowerBlock.dimensions;
    const epsilon = 0.001; // Sayısal hassasiyet için epsilon değeri

    // Check if blocks overlap in X and Z axes
    const overlapX = x1 < (x2 + d2.width + epsilon) && (x1 + d1.width + epsilon) > x2;
    const overlapZ = z1 < (z2 + d2.depth + epsilon) && (z1 + d1.depth + epsilon) > z2;

    // Check if the upper block is actually above the lower block
    // y1 alt bloğun üst yüzeyine yakın olmalı
    const isAbove = Math.abs(y1 - (y2 + d2.height)) < epsilon;

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
          if (widthChange !== 0 && areBlocksOverlapping(modifiedBlock, block)) {
            if (x2 > x1) {
              const newPosition = [...block.position];
              newPosition[0] += Math.abs(widthChange);
              updatedBlocks.set(blockId, { ...block, position: newPosition });
            }
          }
          
          // Check if block needs to move in depth direction
          if (depthChange !== 0 && areBlocksOverlapping(modifiedBlock, block)) {
            if (z2 > z1) {
              const currentBlock = updatedBlocks.get(blockId) || block;
              const newPosition = [...currentBlock.position];
              newPosition[2] += Math.abs(depthChange);
              updatedBlocks.set(blockId, { ...currentBlock, position: newPosition });
            }
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
          // Hata durumunda sessizce devam et
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
        squareMeters: 0,
        roomCount: ''
      };

      try {
        const savedBlock = await createBlock(projectId, newBlockData);
        setBlocks(prevBlocks => [...prevBlocks, savedBlock]);
      } catch (error) {
        // Hata durumunda sessizce devam et
      }
    }
  };

  const handleBlockClick = (blockId, event) => {
    event.stopPropagation();
    
    const block = blocks.find(b => (b._id || b.id) === blockId);
    
    // Bulk sale mode - multi-selection
    if (bulkSaleMode) {
      // Only allow selection of available blocks (not sold)
      if (block && block.owner && block.owner._id) {
        return; // Block is already sold, can't be selected for bulk sale
      }
      
      setSelectedBlocks(prev => {
        if (prev.includes(blockId)) {
          // Deselect block
          return prev.filter(id => id !== blockId);
        } else {
          // Select block
          return [...prev, blockId];
        }
      });
      return;
    }
    
    // If not in edit mode and block is sold (has owner), show side panel
    if (!editMode) {
      if (block && block.owner && block.owner._id) {
        setSelectedSoldBlockId(blockId);
        setSoldBlockPanelVisible(true);
        return;
      }
    }
    
    // In edit mode, select/deselect the block
    setSelectedBlock(blockId === selectedBlock ? null : blockId);
  };

  const handleBlockContextMenu = (blockId, event) => {
    setContextMenuBlockId(blockId);
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY
    });
    setContextMenuVisible(true);
  };

  const handleCloseContextMenu = () => {
    setContextMenuVisible(false);
    setContextMenuBlockId(null);
  };

  const handleUpdateBlockDimensions = async (newDimensions) => {
    if (!selectedBlock) return;
    
    const blockToUpdate = blocks.find(b => (b._id || b.id) === selectedBlock);
    if (!blockToUpdate) return;

    const oldDimensions = blockToUpdate.dimensions;
    const [baseX, baseY, baseZ] = blockToUpdate.position;
    
    const heightChange = newDimensions.height - oldDimensions.height;
    const widthChange = newDimensions.width - oldDimensions.width;
    const depthChange = newDimensions.depth - oldDimensions.depth;

    // GERÇEK ZİNCİRLEME ALGORİTMA - İTERATİF
    const affectedBlocks = new Map(); // blockId -> newPosition
    let hasChanges = true;
    let iteration = 0;
    const maxIterations = 10;

    // İlk hareket eden küpü ayarla
    const blockBaseX = baseX;
    const blockBaseY = baseY; 
    const blockBaseZ = baseZ;

    // Ana küpün boyut değişikliğini simüle et (trigger olarak)
    const mainBlockMovement = {
      oldPos: [blockBaseX, blockBaseY, blockBaseZ],
      newPos: [blockBaseX, blockBaseY, blockBaseZ],
      oldDims: oldDimensions,
      newDims: newDimensions
    };

    // İlk iterasyonda ana küpün etkisini hesapla
    blocks.forEach(targetBlock => {
      const targetBlockId = targetBlock._id || targetBlock.id;
      if (targetBlockId === selectedBlock) return;

      const [targetX, targetY, targetZ] = targetBlock.position;

             // Yükseklik değişimi kontrolü
      if (heightChange !== 0) {
         const hasXOverlap = targetX < blockBaseX + newDimensions.width && targetX + targetBlock.dimensions.width > blockBaseX;
         const hasZOverlap = targetZ < blockBaseZ + newDimensions.depth && targetZ + targetBlock.dimensions.depth > blockBaseZ;
         
         // DOĞRU BOUNDARY KONTROLÜ - Gerçekten temas ediyor mu?
         const wasTouchingTop = Math.abs(targetY - (blockBaseY + oldDimensions.height)) < 0.1;
         const isAbove = targetY >= blockBaseY + oldDimensions.height && wasTouchingTop;

         if (hasXOverlap && hasZOverlap && isAbove) {
           const newPosition = [...targetBlock.position];
           newPosition[1] = blockBaseY + newDimensions.height + (targetY - (blockBaseY + oldDimensions.height));
           affectedBlocks.set(targetBlockId, newPosition);
         }
       }

             // Genişlik değişimi kontrolü
      if (widthChange !== 0) {
         const hasYOverlap = targetY < blockBaseY + newDimensions.height && targetY + targetBlock.dimensions.height > blockBaseY;
         const hasZOverlap = targetZ < blockBaseZ + newDimensions.depth && targetZ + targetBlock.dimensions.depth > blockBaseZ;
         
         // DOĞRU BOUNDARY KONTROLÜ - Gerçekten temas ediyor mu?
         const wasTouchingRight = Math.abs(targetX - (blockBaseX + oldDimensions.width)) < 0.1;
         const isRight = targetX >= blockBaseX + oldDimensions.width && wasTouchingRight;

         if (hasYOverlap && hasZOverlap && isRight) {
           const currentPos = affectedBlocks.has(targetBlockId) ? [...affectedBlocks.get(targetBlockId)] : [...targetBlock.position];
           currentPos[0] = blockBaseX + newDimensions.width + (targetX - (blockBaseX + oldDimensions.width));
           affectedBlocks.set(targetBlockId, currentPos);
         }
       }

             // Derinlik değişimi kontrolü
      if (depthChange !== 0) {
         const hasXOverlap = targetX < blockBaseX + newDimensions.width && targetX + targetBlock.dimensions.width > blockBaseX;
         const hasYOverlap = targetY < blockBaseY + newDimensions.height && targetY + targetBlock.dimensions.height > blockBaseY;
         
         // DOĞRU BOUNDARY KONTROLÜ - Gerçekten temas ediyor mu?
         const wasTouchingFront = Math.abs(targetZ - (blockBaseZ + oldDimensions.depth)) < 0.1;
         const isFront = targetZ >= blockBaseZ + oldDimensions.depth && wasTouchingFront;

         if (hasXOverlap && hasYOverlap && isFront) {
           const currentPos = affectedBlocks.has(targetBlockId) ? [...affectedBlocks.get(targetBlockId)] : [...targetBlock.position];
           currentPos[2] = blockBaseZ + newDimensions.depth + (targetZ - (blockBaseZ + oldDimensions.depth));
           affectedBlocks.set(targetBlockId, currentPos);
         }
       }
    });

    while (hasChanges && iteration < maxIterations) {
      hasChanges = false;
      iteration++;

      // Mevcut tüm küp pozisyonlarını al (hareket etmiş olanlar dahil)
      const currentBlocks = blocks.map(block => {
        const blockId = block._id || block.id;
        if (affectedBlocks.has(blockId)) {
          return { ...block, position: affectedBlocks.get(blockId) };
        }
        return block;
      });

      // Her küpü kontrol et - hareket etmiş küpler de dahil
      currentBlocks.forEach(checkingBlock => {
        const checkingBlockId = checkingBlock._id || checkingBlock.id;
        if (checkingBlockId === selectedBlock) return; // Ana küpü atla

        // Bu küp hareket etmiş mi? O zaman eski ve yeni pozisyonlarını al
        let checkingOldPos, checkingNewPos, checkingOldDims, checkingNewDims;
        
        if (checkingBlockId === selectedBlock) {
          checkingOldPos = [blockBaseX, blockBaseY, blockBaseZ];
          checkingNewPos = [blockBaseX, blockBaseY, blockBaseZ];
          checkingOldDims = oldDimensions;
          checkingNewDims = newDimensions;
        } else if (affectedBlocks.has(checkingBlockId)) {
          const originalBlock = blocks.find(b => (b._id || b.id) === checkingBlockId);
          checkingOldPos = originalBlock.position;
          checkingNewPos = affectedBlocks.get(checkingBlockId);
          checkingOldDims = checkingBlock.dimensions;
          checkingNewDims = checkingBlock.dimensions;
        } else {
          return; // Bu küp hareket etmemiş, diğer küpleri etkilemez
        }

        const [oldX, oldY, oldZ] = checkingOldPos;
        const [newX, newY, newZ] = checkingNewPos;

        // Bu küpün hareket etmesi başka küpleri etkiler mi?
        blocks.forEach(targetBlock => {
          const targetBlockId = targetBlock._id || targetBlock.id;
          if (targetBlockId === selectedBlock || targetBlockId === checkingBlockId) return;

          const [targetX, targetY, targetZ] = targetBlock.position;
          const targetCurrentPos = affectedBlocks.has(targetBlockId) ? 
            affectedBlocks.get(targetBlockId) : targetBlock.position;

                     // X ekseni kontrolü (genişlik değişimi)
           const xMovement = newX - oldX;
           if (Math.abs(xMovement) > 0.001) {
             // DOĞRU OVERLAP KONTROLÜ - Gerçekten temas ediyor mu?
             const hasYOverlap = targetY < newY + checkingNewDims.height && targetY + targetBlock.dimensions.height > newY;
             const hasZOverlap = targetZ < newZ + checkingNewDims.depth && targetZ + targetBlock.dimensions.depth > newZ;
             
             // DOĞRU BOUNDARY KONTROLÜ - Eski pozisyonda temas ediyor muydu?
             const wasTouchingRight = Math.abs(targetX - (oldX + checkingOldDims.width)) < 0.1;
             const isAffectedByX = targetX >= oldX + checkingOldDims.width && wasTouchingRight;

             if (hasYOverlap && hasZOverlap && isAffectedByX) {
               const newTargetPos = [...targetCurrentPos];
               newTargetPos[0] = newX + checkingNewDims.width + (targetX - (oldX + checkingOldDims.width));
               
               if (Math.abs(newTargetPos[0] - targetCurrentPos[0]) > 0.001) {
                 affectedBlocks.set(targetBlockId, newTargetPos);
                 hasChanges = true;
               }
             }
           }

                     // Y ekseni kontrolü (yükseklik değişimi)
           const yMovement = newY - oldY;
           if (Math.abs(yMovement) > 0.001) {
             // DOĞRU OVERLAP KONTROLÜ - Gerçekten temas ediyor mu?
             const hasXOverlap = targetX < newX + checkingNewDims.width && targetX + targetBlock.dimensions.width > newX;
             const hasZOverlap = targetZ < newZ + checkingNewDims.depth && targetZ + targetBlock.dimensions.depth > newZ;
             
             // DOĞRU BOUNDARY KONTROLÜ - Eski pozisyonda temas ediyor muydu?
             const wasTouchingTop = Math.abs(targetY - (oldY + checkingOldDims.height)) < 0.1;
             const isAffectedByY = targetY >= oldY + checkingOldDims.height && wasTouchingTop;

             if (hasXOverlap && hasZOverlap && isAffectedByY) {
               const newTargetPos = [...targetCurrentPos];
               newTargetPos[1] = newY + checkingNewDims.height + (targetY - (oldY + checkingOldDims.height));
               
               if (Math.abs(newTargetPos[1] - targetCurrentPos[1]) > 0.001) {
                 affectedBlocks.set(targetBlockId, newTargetPos);
                 hasChanges = true;
               }
             }
           }

                     // Z ekseni kontrolü (derinlik değişimi)
           const zMovement = newZ - oldZ;
           if (Math.abs(zMovement) > 0.001) {
             // DOĞRU OVERLAP KONTROLÜ - Gerçekten temas ediyor mu?
             const hasXOverlap = targetX < newX + checkingNewDims.width && targetX + targetBlock.dimensions.width > newX;
             const hasYOverlap = targetY < newY + checkingNewDims.height && targetY + targetBlock.dimensions.height > newY;
             
             // DOĞRU BOUNDARY KONTROLÜ - Eski pozisyonda temas ediyor muydu?
             const wasTouchingFront = Math.abs(targetZ - (oldZ + checkingOldDims.depth)) < 0.1;
             const isAffectedByZ = targetZ >= oldZ + checkingOldDims.depth && wasTouchingFront;

             if (hasXOverlap && hasYOverlap && isAffectedByZ) {
               const newTargetPos = [...targetCurrentPos];
               newTargetPos[2] = newZ + checkingNewDims.depth + (targetZ - (oldZ + checkingOldDims.depth));
               
               if (Math.abs(newTargetPos[2] - targetCurrentPos[2]) > 0.001) {
                 affectedBlocks.set(targetBlockId, newTargetPos);
                 hasChanges = true;
               }
             }
           }
        });
      });
    }

    

    const updatedBlockData = {
      ...blockToUpdate,
      dimensions: newDimensions
    };

    try {
      // Önce seçili bloğu güncelle
      if (blockToUpdate._id) {
        const updatedBlock = await updateBlock(selectedBlock, updatedBlockData);
        setBlocks(prevBlocks => prevBlocks.map(block => {
          if ((block._id || block.id) === selectedBlock) {
            // Preserve the hasOverduePayment flag from the existing block
            return {
              ...updatedBlock,
              hasOverduePayment: block.hasOverduePayment
            };
          }
          return block;
        }));
            } else {
        setBlocks(prevBlocks => prevBlocks.map(block => {
          if ((block._id || block.id) === selectedBlock) {
            // Preserve the hasOverduePayment flag from the existing block
            return {
              ...updatedBlockData,
              hasOverduePayment: block.hasOverduePayment
            };
          }
          return block;
        }));
      }



      // Tüm etkilenen blokları tek seferde güncelle
      if (affectedBlocks.size > 0) {
        setBlocks(prevBlocks => {
          const newBlocks = [...prevBlocks];
          affectedBlocks.forEach((newPosition, blockId) => {
            const index = newBlocks.findIndex(b => (b._id || b.id) === blockId);
            if (index !== -1) {
              newBlocks[index] = { ...newBlocks[index], position: newPosition };
            }
          });
          return newBlocks;
        });
      }

      // Veritabanını güncelle - etkilenen bloklar için
      if (affectedBlocks.size > 0) {
        const updatePromises = Array.from(affectedBlocks.entries()).map(async ([blockId, newPosition]) => {
          const block = blocks.find(b => (b._id || b.id) === blockId);
          if (block && block._id) {
            try {
              await updateBlock(block._id, { position: newPosition });
        } catch (error) {
              console.error('Block update error:', error);
        }
          }
        });
        
        // Tüm güncellemeleri paralel olarak bekle
        await Promise.all(updatePromises);
      }
    } catch (error) {
      // Hata durumunda sessizce devam et
    }
  };

  const handleUpdateBlockDetails = async (blockId, details) => {
    try {
      const updatedBlock = await updateBlock(blockId, details);
      setBlocks(prevBlocks => prevBlocks.map(block => {
        if ((block._id || block.id) === blockId) {
          // Preserve the hasOverduePayment flag from the existing block
          return {
            ...updatedBlock,
            hasOverduePayment: block.hasOverduePayment
          };
        }
        return block;
      }));
    } catch (error) {
      // Hata durumunda sessizce devam et
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      const blockToDelete = blocks.find(b => (b._id || b.id) === blockId);
      if (blockToDelete._id) {
        await deleteBlock(blockId);
      }
      setBlocks(prevBlocks => prevBlocks.filter(block => (block._id || block.id) !== blockId));
      setSelectedBlock(null);
    } catch (error) {
      // Hata durumunda sessizce devam et
    }
  };

  const addText = async (position, text) => {
    const newTextData = {
      id: `text-${Date.now()}`,
      position,
      text,
      color: "#ffffff",
      fontSize: 0.3
    };

    setTexts(prevTexts => [...prevTexts, newTextData]);
  };

  const handleTextClick = (textId) => {
    setSelectedText(textId === selectedText ? null : textId);
  };

  const handleUpdateText = (textId, newContent) => {
    setTexts(prevTexts => prevTexts.map(text => {
      if (text.id === textId) {
        // Eğer newContent bir string ise, sadece metin içeriğini güncelle
        if (typeof newContent === 'string') {
          return { ...text, text: newContent };
        }
        // Eğer newContent bir obje ise, bu özellikleri güncelle
        return { ...text, ...newContent };
      }
      return text;
    }));
  };

  const handleDeleteText = async (textId) => {
    try {
      setTexts(prevTexts => prevTexts.filter(text => text.id !== textId));
      setSelectedText(null);
    } catch (error) {
      // Hata durumunda sessizce devam et
    }
  };

  // Metni taşıma fonksiyonu
  const moveText = (textId, direction) => {
    if (!textId) return;
    
    setTexts(prevTexts => 
      prevTexts.map(item => {
        if (item.id === textId) {
          const newPosition = [...item.position];
          
          // X, Y veya Z koordinatını belirtilen yönde değiştir
          if (direction === 'left') newPosition[0] -= 0.5;
          if (direction === 'right') newPosition[0] += 0.5;
          if (direction === 'up') newPosition[1] += 0.5;
          if (direction === 'down') newPosition[1] -= 0.5;
          if (direction === 'forward') newPosition[2] -= 0.5;
          if (direction === 'backward') newPosition[2] += 0.5;
          
          return { ...item, position: newPosition };
        }
        return item;
      })
    );
  };

  // Sürükleme ile metin konumunu güncelle
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
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', display: 'flex' }} tabIndex={0}>
      <div style={{ width: '300px', height: '100%', overflow: 'auto', borderRight: '1px solid #e8e8e8' }}>
        <ControlPanel 
          editMode={editMode} 
          setEditMode={setEditMode}
          addMode={addMode}
          setAddMode={setAddMode}
          textMode={textMode}
          setTextMode={setTextMode}
          bulkSaleMode={bulkSaleMode}
          setBulkSaleMode={setBulkSaleMode}
          selectedBlock={selectedBlock}
          selectedBlocks={selectedBlocks}
          setSelectedBlocks={setSelectedBlocks}
          selectedBlockDimensions={getSelectedBlockDimensions()}
          onUpdateBlockDimensions={handleUpdateBlockDimensions}
          onUpdateBlockDetails={handleUpdateBlockDetails}
          onDeleteBlock={handleDeleteBlock}
          blocks={blocks}
          selectedText={selectedText}
          onUpdateText={handleUpdateText}
          onDeleteText={handleDeleteText}
          texts={texts}
          onMoveText={moveText}
          onProceedToBulkSale={() => {
            if (selectedBlocks.length > 0) {
              navigate(`/projects/${projectId}/blocks/bulk-sale`, {
                state: { selectedBlockIds: selectedBlocks }
              });
            }
          }}
        />
      </div>
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
            {`${hoveredBlockOwner.firstName || ''} ${hoveredBlockOwner.lastName || ''}`}
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
            selectedBlocks={selectedBlocks}
            bulkSaleMode={bulkSaleMode}
            onAddBlock={addBlock}
            onBlockClick={handleBlockClick}
            onBlockContextMenu={handleBlockContextMenu}
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
          />
        </Canvas>
      </div>
      
      {/* Sold Block Details Panel */}
      <SoldBlockPanel
        visible={soldBlockPanelVisible}
        onClose={() => setSoldBlockPanelVisible(false)}
        blockId={selectedSoldBlockId}
      />
      
      {/* Block Context Menu */}
      <BlockContextMenu
        visible={contextMenuVisible}
        position={contextMenuPosition}
        blockId={contextMenuBlockId}
        onClose={handleCloseContextMenu}
      />
    </div>
  );
};

export default BuildingCanvas;
