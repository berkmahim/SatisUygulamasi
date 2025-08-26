import React, { useRef, useState } from 'react';
import { Box, Edges, Text } from '@react-three/drei';
import * as THREE from 'three';

const BuildingBlock = ({ 
  position, 
  dimensions = { width: 1, height: 1, depth: 1 },
  color = '#8c8c8c', 
  onPointerDown,
  onSelect, 
  isSelected, 
  editMode, 
  addMode,
  owner = null,
  onHover,
  unitNumber = ''
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
      
      onPointerDown(eventData);
    } else {
      // Allow clicks even when not in edit mode for navigation purposes
      onSelect && onSelect(e);
    }
  };

  // Birim numarası, yoksa "-" gösterilecek
  const displayNumber = unitNumber && unitNumber.trim() !== '' ? unitNumber : "-";
  
  // 6 yüzey için konum ve rotasyonlar
  const facePositions = [
    // Ön yüz
    {
      position: [0, 0, dimensions.depth / 2 + 0.01],
      rotation: [0, 0, 0]
    },
    // Arka yüz
    {
      position: [0, 0, -dimensions.depth / 2 - 0.01],
      rotation: [0, Math.PI, 0]
    },
    // Sağ yüz
    {
      position: [dimensions.width / 2 + 0.01, 0, 0],
      rotation: [0, Math.PI / 2, 0]
    },
    // Sol yüz
    {
      position: [-dimensions.width / 2 - 0.01, 0, 0],
      rotation: [0, -Math.PI / 2, 0]
    },
    // Üst yüz
    {
      position: [0, dimensions.height / 2 + 0.01, 0],
      rotation: [-Math.PI / 2, 0, 0]
    },
    // Alt yüz
    {
      position: [0, -dimensions.height / 2 - 0.01, 0],
      rotation: [Math.PI / 2, 0, 0]
    }
  ];

  return (
    <group>
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
          setHovered(true);
          onHover && onHover(owner, true);
          
          // Change cursor to pointer for sold blocks when not in edit mode
          if (!editMode && owner) {
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover && onHover(null, false);
          
          // Reset cursor when leaving block
          document.body.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial
          color={isSelected ? '#1890ff' : owner ? '#ff0000' : '#00ff00'}
          metalness={0.1}
          roughness={0.5}
        />
        <Edges
          scale={1}
          threshold={15}
          color={getEdgeColor()}
        />
      </Box>
      
      {/* 6 yüzeye birim numarası ekle */}
      {facePositions.map((face, index) => (
        <group 
          key={index} 
          position={[
            centerPosition[0] + face.position[0], 
            centerPosition[1] + face.position[1], 
            centerPosition[2] + face.position[2]
          ]}
          rotation={face.rotation}
        >
          <Text
            fontSize={dimensions.width * 0.4}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {displayNumber}
          </Text>
        </group>
      ))}
    </group>
  );
};

export default BuildingBlock;
