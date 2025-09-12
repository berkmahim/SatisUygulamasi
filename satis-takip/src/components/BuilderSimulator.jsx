import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text as Text3D } from '@react-three/drei';
import { Button, Input, InputNumber, Select, Card, Space, Typography, Row, Col, message, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// 3D Block component for the simulator
const SimulatorBlock = ({ position, dimensions, color, isSelected, onClick, onSurfaceClick, unitNumber, mode }) => {
  const meshRef = useRef();

  // Calculate center position like in the main canvas
  const centerPosition = [
    position[0] + dimensions.width / 2,
    position[1] + dimensions.height / 2,
    position[2] + dimensions.depth / 2
  ];

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'placing' && onSurfaceClick) {
      // Calculate which face was clicked based on the intersection point
      const intersection = e.intersections[0];
      if (intersection && intersection.face) {
        const face = intersection.face;
        const normal = face.normal.clone();
        
        // Transform normal to world space
        normal.transformDirection(meshRef.current.matrixWorld);
        
        // Calculate new block position based on the clicked face and snap to grid
        let newPosition = [...position];
        
        if (Math.abs(normal.x) > 0.9) {
          // Side face (left/right)
          newPosition[0] += normal.x > 0 ? dimensions.width : -dimensions.width;
          // Snap to grid
          newPosition[0] = Math.round(newPosition[0]);
        } else if (Math.abs(normal.y) > 0.9) {
          // Top/bottom face
          newPosition[1] += normal.y > 0 ? dimensions.height : -dimensions.height;
          // For Y, don't snap to grid, keep precise stacking
        } else if (Math.abs(normal.z) > 0.9) {
          // Front/back face
          newPosition[2] += normal.z > 0 ? dimensions.depth : -dimensions.depth;
          // Snap to grid
          newPosition[2] = Math.round(newPosition[2]);
        }
        
        // Ensure minimum Y position (ground level)
        if (newPosition[1] < dimensions.height / 2) {
          newPosition[1] = dimensions.height / 2;
        }
        
        onSurfaceClick(newPosition);
      }
    } else {
      // Normal click for selection or numbering
      onClick(position);
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={centerPosition}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial 
          color={isSelected ? '#ff6b6b' : color} 
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Display unit number as 3D text */}
      {unitNumber && (
        <Text3D
          position={[centerPosition[0], centerPosition[1] + dimensions.height/2 + 0.2, centerPosition[2]]}
          fontSize={Math.min(dimensions.width * 0.3, 0.5)}
          color="black"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI/2, 0, 0]}
        >
          {unitNumber}
        </Text3D>
      )}
    </group>
  );
};

// Grid and scene setup
const SimulatorScene = ({ 
  blocks, 
  onBlockClick, 
  selectedBlockPosition, 
  onAddBlock, 
  onSurfaceClick,
  mode,
  numberingIndex 
}) => {
  const [hovered, setHovered] = useState(false);
  
  const handleCanvasClick = (e) => {
    if (mode === 'placing') {
      // Get the intersection point
      const point = e.point;
      if (point) {
        const gridX = Math.round(point.x);
        const gridZ = Math.round(point.z);
        // Place at ground level (Y = 0, will be adjusted in handleAddBlock)
        onAddBlock([gridX, 0, gridZ]);
      }
    }
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={1}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#9d4edd"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
        onClick={handleCanvasClick}
        onPointerOver={() => mode === 'placing' && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        style={{ cursor: mode === 'placing' ? 'crosshair' : 'default' }}
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color={mode === 'placing' ? (hovered ? "#bae7ff" : "#e6f7ff") : "#f5f5f5"} 
          transparent 
          opacity={mode === 'placing' ? (hovered ? 0.5 : 0.3) : 0.1}
        />
      </mesh>
      
      {blocks.map((block, index) => (
        <SimulatorBlock
          key={`${block.position[0]}-${block.position[1]}-${block.position[2]}`}
          position={block.position}
          dimensions={block.dimensions}
          color={block.color}
          isSelected={selectedBlockPosition && 
            selectedBlockPosition[0] === block.position[0] && 
            selectedBlockPosition[1] === block.position[1] &&
            selectedBlockPosition[2] === block.position[2]}
          onClick={onBlockClick}
          onSurfaceClick={onSurfaceClick}
          unitNumber={block.unitNumber}
          mode={mode}
        />
      ))}
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        target={[0, 0, 0]}
      />
    </>
  );
};

const BuilderSimulator = ({ visible, onClose, onSave, projectId }) => {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockPosition, setSelectedBlockPosition] = useState(null);
  const [mode, setMode] = useState('viewing'); // 'viewing', 'placing', 'numbering'
  const [numberingIndex, setNumberingIndex] = useState(1);
  const [blockDimensions, setBlockDimensions] = useState({
    width: 2,
    height: 1,
    depth: 2
  });
  const [unitDetails, setUnitDetails] = useState({
    type: 'apartment',
    squareMeters: 100,
    roomCount: '3+1'
  });
  const [actionHistory, setActionHistory] = useState([]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!visible) return; // Only handle keys when modal is visible

      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (mode === 'placing') {
          setMode('viewing');
          message.info('Görüntüleme moduna geçildi');
        } else {
          setMode('placing');
          message.info('Yerleştirme moduna geçildi');
        }
        setSelectedBlockPosition(null);
      }

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, mode, actionHistory]);

  const handleUndo = () => {
    if (actionHistory.length === 0) {
      message.warning('Geri alınacak işlem yok');
      return;
    }

    const lastAction = actionHistory[actionHistory.length - 1];
    
    if (lastAction.type === 'addBlock') {
      // Remove the last added block
      setBlocks(prev => prev.filter(block => 
        !(Math.abs(block.position[0] - lastAction.data.position[0]) < 0.1 &&
          Math.abs(block.position[1] - lastAction.data.position[1]) < 0.1 &&
          Math.abs(block.position[2] - lastAction.data.position[2]) < 0.1)
      ));
      message.success('Blok ekleme işlemi geri alındı');
    } else if (lastAction.type === 'addNumber') {
      // Remove the number from the block
      setBlocks(prev => prev.map(block => 
        Math.abs(block.position[0] - lastAction.data.position[0]) < 0.1 &&
        Math.abs(block.position[1] - lastAction.data.position[1]) < 0.1 &&
        Math.abs(block.position[2] - lastAction.data.position[2]) < 0.1
          ? { ...block, unitNumber: null }
          : block
      ));
      setNumberingIndex(lastAction.data.previousIndex);
      message.success('Numara ekleme işlemi geri alındı');
    }

    // Remove the last action from history
    setActionHistory(prev => prev.slice(0, -1));
  };

  const handleAddBlock = (position) => {
    if (mode !== 'placing') return;
    
    let finalPosition = [...position];
    
    // Ground level blocks should have Y = height/2 so their bottom touches the ground
    if (position[1] <= blockDimensions.height / 2) {
      finalPosition[1] = blockDimensions.height / 2;
      
      // Find all blocks at this X,Z position for stacking
      const blocksAtPosition = blocks.filter(block => 
        Math.round(block.position[0]) === Math.round(finalPosition[0]) && 
        Math.round(block.position[2]) === Math.round(finalPosition[2])
      );
      
      if (blocksAtPosition.length > 0) {
        // Stack on top of the highest block
        const highestBlock = blocksAtPosition.reduce((highest, current) => 
          current.position[1] > highest.position[1] ? current : highest
        );
        finalPosition[1] = highestBlock.position[1] + highestBlock.dimensions.height;
      }
    } else {
      // For surface placement, check if position is already occupied
      const existingBlock = blocks.find(block => 
        Math.abs(block.position[0] - position[0]) < 0.1 &&
        Math.abs(block.position[1] - position[1]) < 0.1 &&
        Math.abs(block.position[2] - position[2]) < 0.1
      );
      
      if (existingBlock) {
        message.warning('Bu pozisyonda zaten bir blok var');
        return;
      }
    }
    
    // Use different colors based on height
    const heightLevel = Math.floor((finalPosition[1] - blockDimensions.height / 2) / blockDimensions.height);
    const colors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fab1a0'];
    const blockColor = colors[heightLevel % colors.length];
    
    const newBlock = {
      position: finalPosition,
      dimensions: { ...blockDimensions },
      color: blockColor,
      unitNumber: null,
      floor: heightLevel + 1
    };
    
    setBlocks(prev => [...prev, newBlock]);
    
    // Record action in history for undo
    setActionHistory(prev => [...prev, {
      type: 'addBlock',
      data: {
        position: finalPosition,
        block: newBlock
      },
      timestamp: Date.now()
    }]);
    
    const gridPos = `(${Math.round(finalPosition[0])}, ${Math.round(finalPosition[2])})`;
    if (heightLevel > 0) {
      message.success(`Blok üst üste eklendi ${gridPos}, kat: ${heightLevel + 1}`);
    } else {
      message.success(`Blok eklendi ${gridPos}`);
    }
  };

  // Handle surface clicking for precise placement
  const handleSurfaceClick = (newPosition) => {
    handleAddBlock(newPosition);
  };

  const handleBlockClick = (position) => {
    if (mode === 'viewing') {
      // In viewing mode, just show block info or do nothing
      return;
    } else if (mode === 'placing') {
      setSelectedBlockPosition(position);
    } else if (mode === 'numbering') {
      // Check if block already has a number
      const targetBlock = blocks.find(block =>
        Math.abs(block.position[0] - position[0]) < 0.1 &&
        Math.abs(block.position[1] - position[1]) < 0.1 &&
        Math.abs(block.position[2] - position[2]) < 0.1
      );

      if (targetBlock && targetBlock.unitNumber) {
        message.warning('Bu blok zaten numaralandırılmış');
        return;
      }

      // Record current state for undo
      const previousIndex = numberingIndex;
      
      setBlocks(prev => prev.map(block => 
        Math.abs(block.position[0] - position[0]) < 0.1 &&
        Math.abs(block.position[1] - position[1]) < 0.1 &&
        Math.abs(block.position[2] - position[2]) < 0.1
          ? { ...block, unitNumber: numberingIndex.toString() }
          : block
      ));
      
      // Record action in history for undo
      setActionHistory(prev => [...prev, {
        type: 'addNumber',
        data: {
          position: position,
          number: numberingIndex.toString(),
          previousIndex: previousIndex
        },
        timestamp: Date.now()
      }]);

      setNumberingIndex(prev => prev + 1);
      message.success(`Birim ${numberingIndex} numarası atandı`);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedBlockPosition) {
      message.warning('Silmek için bir blok seçin');
      return;
    }
    
    setBlocks(prev => prev.filter(block => 
      !(Math.abs(block.position[0] - selectedBlockPosition[0]) < 0.1 &&
        Math.abs(block.position[1] - selectedBlockPosition[1]) < 0.1 &&
        Math.abs(block.position[2] - selectedBlockPosition[2]) < 0.1)
    ));
    setSelectedBlockPosition(null);
    message.success('Blok silindi');
  };

  const handleClearAll = () => {
    setBlocks([]);
    setSelectedBlockPosition(null);
    setNumberingIndex(1);
    message.success('Tüm bloklar temizlendi');
  };

  const handleSave = () => {
    if (blocks.length === 0) {
      message.warning('En az bir blok oluşturun');
      return;
    }

    const blocksWithoutNumbers = blocks.filter(block => !block.unitNumber);
    if (blocksWithoutNumbers.length > 0) {
      message.warning('Tüm blokları numaralandırın');
      return;
    }

    const finalBlocks = blocks.map(block => ({
      position: block.position,
      dimensions: block.dimensions,
      unitNumber: block.unitNumber,
      ...unitDetails
    }));

    onSave(finalBlocks);
    onClose();
    message.success('Yapı kaydedildi');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      zIndex: 1000, 
      display: visible ? 'block' : 'none' 
    }}>
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: '90vw', 
        height: '90vh', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        display: 'flex'
      }}>
        {/* Left Panel - Controls */}
        <div style={{ width: '300px', padding: '20px', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
          <Title level={4} style={{ marginBottom: '20px' }}>Yapı Oluşturucu</Title>
          
          <Card title="Mod Seçimi" size="small" style={{ marginBottom: '16px' }}>
            <Radio.Group 
              value={mode} 
              onChange={(e) => {
                setMode(e.target.value);
                if (e.target.value === 'numbering' || e.target.value === 'viewing') {
                  setSelectedBlockPosition(null);
                }
              }}
              buttonStyle="solid"
              style={{ width: '100%' }}
            >
              <Radio.Button value="viewing" style={{ width: '33.33%' }}>Görüntüle</Radio.Button>
              <Radio.Button value="placing" style={{ width: '33.33%' }}>Yerleştir</Radio.Button>
              <Radio.Button value="numbering" style={{ width: '33.33%' }}>Numaralandır</Radio.Button>
            </Radio.Group>
            
            {mode === 'numbering' && (
              <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
                <Text strong style={{ color: '#52c41a' }}>Sıradaki numara: {numberingIndex}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Blokları tıklayarak numara verin
                </Text>
              </div>
            )}
            
            {mode === 'viewing' && (
              <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                <Text strong style={{ color: '#666' }}>Görüntüleme Modu</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Bloklar ve numaralar değiştirilemez
                </Text>
              </div>
            )}
            
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
              <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>Kısayollar:</Text>
              <br />
              <Text style={{ fontSize: '11px', color: '#666' }}>
                Ctrl + E: Yerleştir/Görüntüle değiştir<br />
                Ctrl + Z: Son işlemi geri al
              </Text>
            </div>
          </Card>

          {mode === 'placing' && (
            <Card title="Blok Boyutları" size="small" style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Genişlik:</Text>
                  <InputNumber
                    min={1}
                    max={10}
                    value={blockDimensions.width}
                    onChange={(value) => setBlockDimensions(prev => ({ ...prev, width: value }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <Text>Yükseklik:</Text>
                  <InputNumber
                    min={1}
                    max={10}
                    value={blockDimensions.height}
                    onChange={(value) => setBlockDimensions(prev => ({ ...prev, height: value }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <Text>Derinlik:</Text>
                  <InputNumber
                    min={1}
                    max={10}
                    value={blockDimensions.depth}
                    onChange={(value) => setBlockDimensions(prev => ({ ...prev, depth: value }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </Space>
            </Card>
          )}

          <Card title="Birim Detayları" size="small" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Tip:</Text>
                <Select
                  value={unitDetails.type}
                  onChange={(value) => setUnitDetails(prev => ({ ...prev, type: value }))}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <Option value="apartment">Daire</Option>
                  <Option value="villa">Villa</Option>
                  <Option value="office">Ofis</Option>
                  <Option value="shop">Dükkan</Option>
                </Select>
              </div>
              <div>
                <Text>Metrekare:</Text>
                <InputNumber
                  min={1}
                  max={1000}
                  value={unitDetails.squareMeters}
                  onChange={(value) => setUnitDetails(prev => ({ ...prev, squareMeters: value }))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <Text>Oda Sayısı:</Text>
                <Input
                  value={unitDetails.roomCount}
                  onChange={(e) => setUnitDetails(prev => ({ ...prev, roomCount: e.target.value }))}
                  placeholder="örn: 3+1, 2+1, 4+2"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </Space>
          </Card>

          <Card title="İşlemler" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Toplam Blok: {blocks.length}</Text>
              <Text>Numaralandırılan: {blocks.filter(b => b.unitNumber).length}</Text>
              <Text type="secondary">En Yüksek Kat: {blocks.length > 0 ? Math.max(...blocks.map(b => b.floor || 1)) : 0}</Text>
              <Text type="secondary">İşlem Geçmişi: {actionHistory.length}</Text>
              
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={handleDeleteSelected}
                disabled={!selectedBlockPosition || mode === 'numbering'}
                style={{ width: '100%' }}
              >
                Seçiliyi Sil
              </Button>
              
              <Button 
                danger 
                onClick={handleClearAll}
                style={{ width: '100%' }}
              >
                Hepsini Temizle
              </Button>
              
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleSave}
                style={{ width: '100%' }}
              >
                Kaydet ve Uygula
              </Button>
              
              <Button onClick={onClose} style={{ width: '100%' }}>
                İptal
              </Button>
            </Space>
          </Card>
        </div>

        {/* Right Panel - 3D Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, backgroundColor: 'rgba(255,255,255,0.95)', padding: '12px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <Text strong style={{ color: mode === 'viewing' ? '#666' : mode === 'placing' ? '#52c41a' : '#1890ff' }}>
              {mode === 'viewing' ? 'Görüntüleme Modu' : mode === 'placing' ? 'Yerleştirme Modu' : 'Numaralandırma Modu'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {mode === 'viewing' 
                ? 'Sadece görüntüleme. Ctrl+E ile yerleştir moduna geçin.'
                : mode === 'placing' 
                  ? 'Gri zemine tıklayarak blok ekleyin. Grid çizgileri pozisyon gösterir.' 
                  : 'Blokları tıklayarak numara verin'
              }
            </Text>
            {mode === 'placing' && (
              <>
                <br />
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  Boyut: {blockDimensions.width}x{blockDimensions.height}x{blockDimensions.depth}
                </Text>
              </>
            )}
            {mode === 'numbering' && (
              <>
                <br />
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  Sıradaki: {numberingIndex}
                </Text>
              </>
            )}
          </div>
          
          <Canvas 
            camera={{ position: [10, 10, 10], fov: 50 }}
            shadows
            style={{ width: '100%', height: '100%' }}
          >
            <SimulatorScene
              blocks={blocks}
              onBlockClick={handleBlockClick}
              selectedBlockPosition={selectedBlockPosition}
              onAddBlock={handleAddBlock}
              onSurfaceClick={handleSurfaceClick}
              mode={mode}
              numberingIndex={numberingIndex}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default BuilderSimulator;