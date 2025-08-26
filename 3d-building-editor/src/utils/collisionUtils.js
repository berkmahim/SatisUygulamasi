// Collision detection and resolution utilities

export const areBlocksOverlapping = (block1, block2, epsilon = 0.001) => {
  const [x1, y1, z1] = block1.position;
  const [x2, y2, z2] = block2.position;
  const d1 = block1.dimensions;
  const d2 = block2.dimensions;

  return (
    x1 < x2 + d2.width + epsilon && x1 + d1.width + epsilon > x2 &&
    y1 < y2 + d2.height + epsilon && y1 + d1.height + epsilon > y2 &&
    z1 < z2 + d2.depth + epsilon && z1 + d1.depth + epsilon > z2
  );
};

export const isBlockDirectlyAbove = (upperBlock, lowerBlock, epsilon = 0.001) => {
  const [x1, y1, z1] = upperBlock.position;
  const [x2, y2, z2] = lowerBlock.position;
  const d1 = upperBlock.dimensions;
  const d2 = lowerBlock.dimensions;

  // Check if blocks overlap in X and Z axes
  const overlapX = x1 < (x2 + d2.width + epsilon) && (x1 + d1.width + epsilon) > x2;
  const overlapZ = z1 < (z2 + d2.depth + epsilon) && (z1 + d1.depth + epsilon) > z2;

  // Check if the upper block is actually above the lower block
  const isAbove = Math.abs(y1 - (y2 + d2.height)) < epsilon;

  return overlapX && overlapZ && isAbove;
};

export const findOverlappingBlocks = (targetBlock, allBlocks) => {
  return allBlocks.filter(block => {
    const blockId = block._id || block.id;
    const targetId = targetBlock._id || targetBlock.id;
    
    return blockId !== targetId && areBlocksOverlapping(targetBlock, block);
  });
};

export const findBlocksAbove = (baseBlock, allBlocks) => {
  return allBlocks.filter(block => {
    const blockId = block._id || block.id;
    const baseId = baseBlock._id || baseBlock.id;
    
    return blockId !== baseId && isBlockDirectlyAbove(block, baseBlock);
  });
};

export const calculateDisplacement = (modifiedBlock, otherBlock, oldDimensions) => {
  const [x1, y1, z1] = modifiedBlock.position;
  const [x2, y2, z2] = otherBlock.position;
  const d1 = modifiedBlock.dimensions;

  const widthChange = d1.width - oldDimensions.width;
  const heightChange = d1.height - oldDimensions.height;
  const depthChange = d1.depth - oldDimensions.depth;

  // For height changes, move blocks that are above
  if (heightChange !== 0 && isBlockDirectlyAbove(otherBlock, modifiedBlock)) {
    return { axis: 'y', amount: Math.abs(heightChange) };
  }

  // For width changes, move blocks to the right that are overlapping
  if (widthChange !== 0 && areBlocksOverlapping(modifiedBlock, otherBlock)) {
    if (x2 > x1) {
      return { axis: 'x', amount: Math.abs(widthChange) };
    }
  }

  // For depth changes, move blocks to the front that are overlapping
  if (depthChange !== 0 && areBlocksOverlapping(modifiedBlock, otherBlock)) {
    if (z2 > z1) {
      return { axis: 'z', amount: Math.abs(depthChange) };
    }
  }

  return null;
};

export const resolveBlockCollisions = (modifiedBlock, allBlocks, oldDimensions) => {
  const updates = new Map();
  const processedBlocks = new Set();
  let hasChanges = true;
  let iteration = 0;
  const maxIterations = 10;

  const modifiedId = modifiedBlock._id || modifiedBlock.id;
  processedBlocks.add(modifiedId);

  while (hasChanges && iteration < maxIterations) {
    hasChanges = false;
    iteration++;

    // Check all blocks for collisions
    allBlocks.forEach(block => {
      const blockId = block._id || block.id;
      if (processedBlocks.has(blockId)) return;

      const displacement = calculateDisplacement(modifiedBlock, block, oldDimensions);
      if (displacement) {
        const newPosition = [...block.position];
        newPosition[displacement.axis === 'x' ? 0 : displacement.axis === 'y' ? 1 : 2] += displacement.amount;
        
        // Ensure blocks don't go below ground
        if (newPosition[1] < 0) newPosition[1] = 0;
        
        updates.set(blockId, newPosition);
        hasChanges = true;
      }
    });
  }

  return updates;
};

export const validateBlockPosition = (block, allBlocks, ignoreBlockId = null) => {
  const conflicts = [];
  
  allBlocks.forEach(otherBlock => {
    const otherId = otherBlock._id || otherBlock.id;
    const blockId = block._id || block.id;
    
    if (otherId === blockId || otherId === ignoreBlockId) return;
    
    if (areBlocksOverlapping(block, otherBlock)) {
      conflicts.push(otherId);
    }
  });

  return {
    isValid: conflicts.length === 0,
    conflicts
  };
};

export const findValidPosition = (block, allBlocks, searchRadius = 5) => {
  const [baseX, baseY, baseZ] = block.position;
  
  // Try positions in a grid around the base position
  for (let radius = 1; radius <= searchRadius; radius++) {
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        if (Math.abs(x) !== radius && Math.abs(z) !== radius) continue; // Only check perimeter
        
        const testPosition = [baseX + x, baseY, baseZ + z];
        const testBlock = { ...block, position: testPosition };
        
        const validation = validateBlockPosition(testBlock, allBlocks);
        if (validation.isValid) {
          return testPosition;
        }
      }
    }
  }
  
  return null; // No valid position found
};