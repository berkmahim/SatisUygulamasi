import React, { useState } from 'react';
import { Box, Edges } from '@react-three/drei';

const BuildingBlock = ({ 
  position, 
  dimensions = { width: 1, height: 1, depth: 1 },
  color = '#8c8c8c', 
  onClick, 
  onSelect, 
  isSelected, 
  editMode, 
  addMode 
}) => {
  const [hovered, setHovered] = useState(false);

  const getEdgeColor = () => {
    if (!editMode) return '#000000';
    if (hovered) {
      return addMode ? '#2196F3' : '#4CAF50';
    }
    return '#000000';
  };

  // Calculate the center position based on dimensions
  const centerPosition = [
    position[0] + (dimensions.width - 1) / 2,
    position[1] + (dimensions.height - 1) / 2,
    position[2] + (dimensions.depth - 1) / 2
  ];

  return (
    <Box
      args={[
        dimensions.width * 0.999,
        dimensions.height * 0.999,
        dimensions.depth * 0.999
      ]}
      position={centerPosition}
      onClick={onClick}
      onContextMenu={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onPointerOver={() => editMode && setHovered(true)}
      onPointerOut={() => editMode && setHovered(false)}
    >
      <meshStandardMaterial
        color={isSelected ? '#ff4444' : hovered ? '#a0a0a0' : color}
        transparent
        opacity={0.9}
        metalness={0.1}
        roughness={0.5}
      />
      <Edges
        scale={1}
        threshold={15}
        color={getEdgeColor()}
      />
    </Box>
  );
};

export default BuildingBlock;
