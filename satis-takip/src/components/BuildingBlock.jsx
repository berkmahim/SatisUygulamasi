import React, { useRef, useState } from 'react';
import { Box, Edges } from '@react-three/drei';
import * as THREE from 'three';

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
  const meshRef = useRef();

  const getEdgeColor = () => {
    if (!editMode) return '#000000';
    if (hovered) {
      return addMode ? '#2196F3' : '#4CAF50';
    }
    return '#000000';
  };

  // Calculate the center position based on dimensions
  const centerPosition = [
    position[0] + dimensions.width / 2,
    position[1] + dimensions.height / 2,
    position[2] + dimensions.depth / 2
  ];

  const handlePointerDown = (e) => {
    if (editMode && addMode) {
      if (!e.face) return;
      
      // Convert face normal from local to world coordinates
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(meshRef.current.matrixWorld);
      const worldNormal = e.face.normal.clone().applyMatrix3(normalMatrix).normalize();
      
      const eventData = {
        point: e.point,
        face: { normal: worldNormal },
        blockData: {
          position,
          dimensions
        },
        nativeEvent: e
      };
      
      onClick(eventData);
    } else {
      onSelect && onSelect(e);
    }
  };

  return (
    <Box
      ref={meshRef}
      args={[dimensions.width, dimensions.height, dimensions.depth]}
      position={centerPosition}
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => {
        e.stopPropagation();
        onSelect && onSelect(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        editMode && setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        editMode && setHovered(false);
      }}
    >
      <meshStandardMaterial
        color={isSelected ? '#ff4444' : hovered ? '#a0a0a0' : color}
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
