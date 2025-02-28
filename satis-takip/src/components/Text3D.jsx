import React, { useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Text3D = ({ 
  text, 
  position, 
  color = "#ffffff", 
  fontSize = 0.3, 
  onPointerDown,
  isSelected,
  onSelect,
  editMode,
  onTextUpdate,
  onDrag
}) => {
  const textRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const { camera } = useThree();
  
  // Kamera değiştiğinde metni kameraya döndür
  useEffect(() => {
    if (textRef.current) {
      const updateTextRotation = () => {
        if (textRef.current) {
          // Text3D'nin kameraya dönük kalmasını sağla
          textRef.current.lookAt(camera.position);
        }
      };
      
      // İlk render'da ve kamera değiştiğinde metni döndür
      updateTextRotation();
      
      // Camera değişikliklerini dinle
      window.addEventListener('camerachange', updateTextRotation);
      
      return () => {
        window.removeEventListener('camerachange', updateTextRotation);
      };
    }
  }, [camera]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (onPointerDown) {
      onPointerDown(e);
    }
    if (onSelect) {
      onSelect();
    }

    // Sürükleme işlemini başlat
    if (isSelected && editMode) {
      setIsDragging(true);
      setDragStart({
        x: e.point.x,
        y: e.point.y,
        z: e.point.z
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handlePointerMove = (e) => {
    if (isDragging && dragStart && onDrag) {
      const deltaX = e.point.x - dragStart.x;
      const deltaY = e.point.y - dragStart.y;
      const deltaZ = e.point.z - dragStart.z;
      
      onDrag(position[0] + deltaX, position[1] + deltaY, position[2] + deltaZ);
      
      // Yeni başlangıç noktasını güncelle
      setDragStart({
        x: e.point.x,
        y: e.point.y,
        z: e.point.z
      });
    }
  };

  // Seçiliyken veya hover olunca görünümü değiştir
  const getOutlineColor = () => {
    if (isSelected) return '#ff0000';
    if (hovered) return '#4CAF50';
    return 'transparent';
  };
  
  return (
    <group position={position}>
      <Text
        ref={textRef}
        color={color}
        fontSize={fontSize}
        maxWidth={10}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineColor={getOutlineColor()}
        outlineWidth={isSelected || hovered ? 0.01 : 0}
        onPointerOver={() => editMode && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        {text}
      </Text>
    </group>
  );
};

export default Text3D;
