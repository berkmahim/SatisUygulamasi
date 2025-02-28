import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Space, Card, Divider, Typography, Radio, Slider, Row, Col, InputNumber, Tooltip } from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined, FontSizeOutlined, LeftOutlined, RightOutlined, UpOutlined, DownOutlined, ForwardOutlined, BackwardOutlined } from '@ant-design/icons';

const ControlPanel = ({ 
  editMode, 
  setEditMode, 
  addMode, 
  setAddMode,
  textMode,
  setTextMode,
  selectedBlock,
  onUpdateBlockDimensions,
  selectedBlockDimensions,
  onUpdateBlockDetails,
  onDeleteBlock,
  blocks,
  selectedText,
  onUpdateText,
  onDeleteText,
  texts,
  onMoveText
}) => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState(selectedBlockDimensions);
  const [blockDetails, setBlockDetails] = useState({
    unitNumber: '',
    owner: '',
    squareMeters: 0,
    roomCount: '',
    type: 'apartment'
  });

  useEffect(() => {
    if (selectedBlock) {
      const block = blocks.find(b => (b._id || b.id) === selectedBlock);
      if (block) {
        setBlockDetails({
          unitNumber: block.unitNumber || '',
          owner: block.owner || '',
          squareMeters: block.squareMeters || 0,
          roomCount: block.roomCount || '',
          type: block.type || 'apartment'
        });
        // Seçilen bloğun boyutlarını da güncelle
        setDimensions(block.dimensions || { width: 1, height: 1, depth: 1 });
      }
    }
  }, [selectedBlock, blocks]);

  // selectedBlockDimensions değiştiğinde dimensions state'ini güncelle
  useEffect(() => {
    setDimensions(selectedBlockDimensions);
  }, [selectedBlockDimensions]);

  const handleDimensionChange = (dimension, value) => {
    // Değerin sayı olduğundan emin ol ve 1-10 arasında olmasını sağla
    const numValue = parseInt(value) || 1;
    const limitedValue = Math.min(Math.max(numValue, 1), 10);
    
    const newDimensions = { ...dimensions, [dimension]: limitedValue };
    setDimensions(newDimensions);
    
    // Güncellenmiş boyutları buildingCanvas'a gönder
    onUpdateBlockDimensions(newDimensions);
  };

  const handleBlockDetailsChange = (field, value) => {
    const newDetails = { ...blockDetails, [field]: value };
    setBlockDetails(newDetails);
    if (selectedBlock) {
      const currentBlock = blocks.find(b => (b._id || b.id) === selectedBlock);
      if (currentBlock) {
        // Mevcut bloğun tüm verilerini koru
        const updatedBlock = {
          ...currentBlock,
          unitNumber: newDetails.unitNumber,
          owner: newDetails.owner,
          squareMeters: newDetails.squareMeters,
          roomCount: newDetails.roomCount,
          type: newDetails.type || currentBlock.type,
          // Zorunlu alanları mutlaka gönder
          projectId: currentBlock.projectId,
          position: currentBlock.position,
          dimensions: currentBlock.dimensions
        };
        onUpdateBlockDetails(selectedBlock, updatedBlock);
      }
    }
  };

  const handleSellBlock = () => {
    if (selectedBlock) {
      navigate(`/projects/${projectId}/blocks/${selectedBlock}/sale`);
    }
  };

  // Düzenleme modunu aktifleştir ve diğer modları deaktif et
  const toggleTextMode = () => {
    setTextMode(!textMode);
    if (!textMode) {
      setAddMode(false); // Blok ekleme modunu kapat
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      minWidth: '200px'
    }}>
      {/* Mod Seçim Butonları */}
      <div className="panel-section">
        <h3>Mod Seçimi</h3>
        <Button 
          type="primary" 
          icon={<EditOutlined />}
          onClick={() => setEditMode(!editMode)}
          style={{ marginBottom: '10px', width: '100%' }}
        >
          {editMode ? 'Düzenleme Modu Aktif' : 'Düzenleme Modu'}
        </Button>
        
        {editMode && (
          <div className="sub-options" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setAddMode(!addMode)}
              style={{ width: '100%' }}
            >
              {addMode ? 'Blok Ekleme Modu Aktif' : 'Blok Ekleme Modu'}
            </Button>
            
            <Button 
              type="primary" 
              icon={<FontSizeOutlined />}
              onClick={toggleTextMode}
              style={{ width: '100%' }}
            >
              {textMode ? 'Metin Ekleme Modu Aktif' : 'Metin Ekleme Modu'}
            </Button>
          </div>
        )}
      </div>

      {editMode && selectedBlock && (
        <>
          <Card title="Blok Boyutları" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text strong>Genişlik:</Typography.Text>
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={dimensions.width} 
                  onChange={(value) => handleDimensionChange('width', value)} 
                  style={{ width: '100%', marginTop: '5px' }}
                />
              </Col>
              <Col span={12}>
                <Typography.Text strong>Yükseklik:</Typography.Text>
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={dimensions.height} 
                  onChange={(value) => handleDimensionChange('height', value)} 
                  style={{ width: '100%', marginTop: '5px' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '10px' }}>
              <Col span={12}>
                <Typography.Text strong>Derinlik:</Typography.Text>
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={dimensions.depth} 
                  onChange={(value) => handleDimensionChange('depth', value)} 
                  style={{ width: '100%', marginTop: '5px' }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="Birim Detayları" style={{ width: '100%', marginTop: '10px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Input 
                  value={blockDetails.unitNumber} 
                  onChange={(e) => handleBlockDetailsChange('unitNumber', e.target.value)} 
                  placeholder="Birim No" 
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={12}>
                <Input 
                  value={blockDetails.owner} 
                  onChange={(e) => handleBlockDetailsChange('owner', e.target.value)} 
                  placeholder="Sahibi" 
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '10px' }}>
              <Col span={12}>
                <InputNumber 
                  value={blockDetails.squareMeters} 
                  onChange={(value) => handleBlockDetailsChange('squareMeters', value)} 
                  placeholder="m²" 
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={12}>
                <Input 
                  value={blockDetails.roomCount} 
                  onChange={(e) => handleBlockDetailsChange('roomCount', e.target.value)} 
                  placeholder="Oda Sayısı" 
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '10px' }}>
              <Col span={12}>
                <Radio.Group 
                  value={blockDetails.type} 
                  onChange={(e) => handleBlockDetailsChange('type', e.target.value)}
                >
                  <Radio value="apartment">Daire</Radio>
                  <Radio value="store">Dükkan</Radio>
                </Radio.Group>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '10px' }}>
              <Col span={12}>
                <Button 
                  type="primary" 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDeleteBlock(selectedBlock)}
                >
                  Bloğu Sil
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  type="primary" 
                  style={{ backgroundColor: '#FFD700', borderColor: '#FFD700' }}
                  icon={<EditOutlined />}
                  onClick={handleSellBlock}
                >
                  Bloğu Sat
                </Button>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '10px' }}>
              <Col span={24}>
                <Button 
                  type="primary" 
                  style={{ width: '100%' }}
                  onClick={() => window.location.href = `/projects/${blocks.find(b => (b._id || b.id) === selectedBlock).projectId}/blocks/${selectedBlock}`}
                >
                  Detayına Git
                </Button>
              </Col>
            </Row>
          </Card>
        </>
      )}

      {/* Metin Düzenleme Paneli */}
      {editMode && selectedText && (
        <Card title="Metin Düzenle" style={{ width: '100%', marginTop: '10px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Input 
                value={texts.find(t => t.id === selectedText)?.text || ''} 
                onChange={(e) => onUpdateText(selectedText, e.target.value)} 
                placeholder="Metin İçeriği" 
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '10px' }}>
            <Col span={12}>
              <Space direction="vertical" size="large" style={{ display: 'flex' }}>
                <Button 
                  type="primary" 
                  icon={<LeftOutlined />}
                  onClick={() => onMoveText(selectedText, 'left')}
                >
                  Sol
                </Button>
                <Button 
                  type="primary" 
                  icon={<RightOutlined />}
                  onClick={() => onMoveText(selectedText, 'right')}
                >
                  Sağ
                </Button>
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical" size="large" style={{ display: 'flex' }}>
                <Button 
                  type="primary" 
                  icon={<UpOutlined />}
                  onClick={() => onMoveText(selectedText, 'up')}
                >
                  Yukarı
                </Button>
                <Button 
                  type="primary" 
                  icon={<DownOutlined />}
                  onClick={() => onMoveText(selectedText, 'down')}
                >
                  Aşağı
                </Button>
              </Space>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '10px' }}>
            <Col span={12}>
              <Space direction="vertical" size="large" style={{ display: 'flex' }}>
                <Button 
                  type="primary" 
                  icon={<ForwardOutlined />}
                  onClick={() => onMoveText(selectedText, 'forward')}
                >
                  İleri
                </Button>
                <Button 
                  type="primary" 
                  icon={<BackwardOutlined />}
                  onClick={() => onMoveText(selectedText, 'backward')}
                >
                  Geri
                </Button>
              </Space>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '10px' }}>
            <Col span={12}>
              <Slider 
                min={0.1} 
                max={1.0} 
                step={0.1} 
                value={texts.find(t => t.id === selectedText)?.fontSize || 0.3} 
                onChange={(value) => onUpdateText(selectedText, { fontSize: value })}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '10px' }}>
            <Col span={24}>
              <Typography.Text strong>Metin Rengi:</Typography.Text>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000'].map(color => (
                  <Tooltip key={color} title={color}>
                    <div 
                      onClick={() => onUpdateText(selectedText, { color })}
                      style={{ 
                        width: '25px', 
                        height: '25px', 
                        backgroundColor: color, 
                        border: texts.find(t => t.id === selectedText)?.color === color 
                          ? '3px solid #1890ff' 
                          : '1px solid #d9d9d9',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        boxShadow: texts.find(t => t.id === selectedText)?.color === color 
                          ? '0 0 5px rgba(24, 144, 255, 0.5)'
                          : 'none'
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '10px' }}>
            <Col span={12}>
              <Button 
                type="primary" 
                icon={<DeleteOutlined />}
                onClick={() => onDeleteText(selectedText)}
              >
                Metni Sil
              </Button>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default ControlPanel;
