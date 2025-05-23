import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Radio, 
  Row, 
  Col, 
  InputNumber, 
  Tooltip, 
  Tabs, 
  Collapse,
  Space,
  Switch,
  message
} from 'antd';
import { 
  EditOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  FontSizeOutlined, 
  LeftOutlined, 
  RightOutlined, 
  UpOutlined, 
  DownOutlined, 
  ForwardOutlined, 
  BackwardOutlined,
  SaveOutlined,
  HomeOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

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
    type: 'apartment',
    iskanPaymentDone: false
  });

  useEffect(() => {
    if (selectedBlock) {
      const block = blocks.find(b => (b._id || b.id) === selectedBlock);
      if (block) {
        setBlockDetails({
          unitNumber: block.unitNumber || '',
          owner: block.owner || '',
          squareMeters: block.squareMeters || 0,
          type: block.type || 'apartment',
          iskanPaymentDone: block.iskanPaymentDone || false
        });
      }
    }
  }, [selectedBlock, blocks]);

  // selectedBlockDimensions değiştiğinde dimensions state'ini güncelle
  useEffect(() => {
    setDimensions(selectedBlockDimensions);
  }, [selectedBlockDimensions]);

  const handleDetailsChange = (field, value) => {
    setBlockDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyDetails = () => {
    onUpdateBlockDetails(selectedBlock, blockDetails);
    message.success('Birim detayları güncellendi');
  };

  const handleDimensionChange = (dimension, value) => {
    if (value === null || value < 1) return;
    
    // Yeni boyutları güncelle
    const newDimensions = { ...dimensions, [dimension]: value };
    setDimensions(newDimensions);
    
    // Boyutları anında uygula
    onUpdateBlockDimensions(newDimensions);
  };

  const handleSellBlock = () => {
    // Navigate to the block sale page
    navigate(`/projects/${projectId}/blocks/${selectedBlock}/sell`);
  };

  const toggleTextMode = () => {
    if (editMode) {
      setTextMode(!textMode);
      if (!textMode) {
        setAddMode(false);
      }
    }
  };

  return (
    <div className="control-panel" style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      <Title level={4} style={{ marginBottom: '16px', textAlign: 'center' }}>Kontrol Paneli</Title>
      
      <Tabs type="card" defaultActiveKey="1" style={{ marginBottom: '16px' }}>
        <TabPane tab={<span><SettingOutlined /> Mod</span>} key="1">
          <Card style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row align="middle" justify="space-between">
                <Col><Text strong>Düzenleme Modu</Text></Col>
                <Col>
                  <Switch 
                    checked={editMode} 
                    onChange={() => setEditMode(!editMode)} 
                    checkedChildren="Aktif" 
                    unCheckedChildren="Kapalı"
                  />
                </Col>
              </Row>
              
              {editMode && (
                <>
                  <Row align="middle" justify="space-between" style={{ marginTop: '12px' }}>
                    <Col><Text>Blok Ekleme</Text></Col>
                    <Col>
                      <Switch 
                        checked={addMode} 
                        onChange={() => setAddMode(!addMode)} 
                        disabled={textMode}
                        checkedChildren="Aktif" 
                        unCheckedChildren="Kapalı"
                      />
                    </Col>
                  </Row>
                  
                  <Row align="middle" justify="space-between" style={{ marginTop: '12px' }}>
                    <Col><Text>Metin Ekleme</Text></Col>
                    <Col>
                      <Switch 
                        checked={textMode} 
                        onChange={toggleTextMode} 
                        disabled={addMode}
                        checkedChildren="Aktif" 
                        unCheckedChildren="Kapalı"
                      />
                    </Col>
                  </Row>
                </>
              )}
            </Space>
          </Card>
        </TabPane>
        
        <TabPane tab={<span><EyeOutlined /> Görünüm</span>} key="2">
          <Card style={{ marginBottom: '16px' }}>
            <Text>Görünüm ayarları buraya eklenecek</Text>
          </Card>
        </TabPane>
      </Tabs>
      
      {selectedBlock && (
        <Collapse defaultActiveKey={['1']} style={{ marginBottom: '16px' }}>
          <Panel header="Blok Boyutları" key="1">
            <Row gutter={16}>
              <Col span={24}>
                <Text strong>Genişlik:</Text>
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={dimensions.width} 
                  onChange={(value) => handleDimensionChange('width', value)} 
                  style={{ width: '100%', marginTop: '5px', marginBottom: '12px' }}
                />
              </Col>
              
              <Col span={24}>
                <Text strong>Yükseklik:</Text>
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={dimensions.height} 
                  onChange={(value) => handleDimensionChange('height', value)} 
                  style={{ width: '100%', marginTop: '5px', marginBottom: '12px' }}
                />
              </Col>
              
              <Col span={24}>
                <Text strong>Derinlik:</Text>
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={dimensions.depth} 
                  onChange={(value) => handleDimensionChange('depth', value)} 
                  style={{ width: '100%', marginTop: '5px', marginBottom: '12px' }}
                />
              </Col>
            </Row>
          </Panel>
          
          <Panel header="Birim Detayları" key="2">
            <Row gutter={16}>
              <Col span={24}>
                <Text strong>Birim No:</Text>
                <Input
                  placeholder="Birim No"
                  value={blockDetails.unitNumber}
                  onChange={(e) => handleDetailsChange('unitNumber', e.target.value)}
                  style={{ marginTop: '5px', marginBottom: '12px' }}
                />
              </Col>
              
              {/* <Col span={24}>
                <Text strong>Sahibi:</Text>
                <Input
                  placeholder="Sahibi"
                  value={blockDetails.owner}
                  onChange={(e) => handleDetailsChange('owner', e.target.value)}
                  style={{ marginTop: '5px', marginBottom: '12px' }}
                />
              </Col> */}
              
              <Col span={24}>
                <Text strong>Metrekare:</Text>
                <InputNumber
                  placeholder="Metrekare"
                  value={blockDetails.squareMeters}
                  onChange={(value) => handleDetailsChange('squareMeters', value)}
                  style={{ width: '100%', marginTop: '5px', marginBottom: '12px' }}
                />
              </Col>
              
              <Col span={24}>
                <Text strong>Tip:</Text>
                <div style={{ marginTop: '5px', marginBottom: '12px' }}>
                  <Radio.Group
                    value={blockDetails.type}
                    onChange={(e) => handleDetailsChange('type', e.target.value)}
                  >
                    <Space direction="vertical">
                      <Radio value="apartment">Daire</Radio>
                      <Radio value="store">Dükkan</Radio>
                    </Space>
                  </Radio.Group>
                </div>
              </Col>

              <Col span={24}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Text strong style={{ marginRight: '10px' }}>İskan Ödemesi Yapıldı:</Text>
                  <Switch
                    checked={blockDetails.iskanPaymentDone}
                    onChange={(checked) => handleDetailsChange('iskanPaymentDone', checked)}
                  />
                </div>
              </Col>
            </Row>
            
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleApplyDetails}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Detayları Kaydet
            </Button>
          </Panel>
          
          <Panel header="Birim İşlemleri" key="3">
            <Row gutter={16} style={{ marginBottom: '12px' }}>
              <Col span={24}>
                <Button 
                  type="primary" 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDeleteBlock(selectedBlock)}
                  style={{ width: '100%' }}
                >
                  Birimi Sil
                </Button>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: '12px' }}>
              <Col span={24}>
                <Button 
                  type="primary" 
                  style={{ backgroundColor: '#FFD700', borderColor: '#FFD700', width: '100%' }}
                  icon={<EditOutlined />}
                  onClick={handleSellBlock}
                >
                  Birimi Sat
                </Button>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={24}>
                <Button 
                  type="primary" 
                  style={{ width: '100%' }}
                  icon={<HomeOutlined />}
                  onClick={() => window.location.href = `/projects/${blocks.find(b => (b._id || b.id) === selectedBlock).projectId}/blocks/${selectedBlock}`}
                >
                  İncele
                </Button>
              </Col>
            </Row>
          </Panel>
        </Collapse>
      )}
      
      {selectedText && (
        <Collapse defaultActiveKey={['1']} style={{ marginBottom: '16px' }}>
          <Panel header="Metin Düzenleme" key="1">
            <Row gutter={16}>
              <Col span={24}>
                <Text strong>Metin İçeriği:</Text>
                <Input.TextArea
                  placeholder="Metin"
                  value={texts.find(t => t.id === selectedText)?.text || ''}
                  onChange={(e) => onUpdateText(selectedText, { text: e.target.value })}
                  style={{ marginTop: '5px', marginBottom: '12px' }}
                  rows={3}
                />
              </Col>
              
              <Col span={24}>
                <Text strong>Metin Boyutu:</Text>
                <Row align="middle" style={{ marginTop: '5px', marginBottom: '12px' }}>
                  <Col span={18}>
                    <InputNumber
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={texts.find(t => t.id === selectedText)?.size || 1}
                      onChange={(value) => onUpdateText(selectedText, { size: value })}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </Col>
              
              <Col span={24}>
                <Text strong>Metin Rengi:</Text>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px', marginBottom: '12px', flexWrap: 'wrap' }}>
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
              
              <Col span={24}>
                <Text strong>Metin Konumu:</Text>
                <Card style={{ marginTop: '5px', marginBottom: '12px' }}>
                  <Row justify="center" style={{ marginBottom: '8px' }}>
                    <Button 
                      onClick={() => onMoveText(selectedText, 'up')}
                      icon={<UpOutlined />}
                    />
                  </Row>
                  <Row justify="center" gutter={16}>
                    <Col>
                      <Button 
                        onClick={() => onMoveText(selectedText, 'left')}
                        icon={<LeftOutlined />}
                      />
                    </Col>
                    <Col>
                      <Button 
                        onClick={() => onMoveText(selectedText, 'forward')}
                        icon={<ForwardOutlined />}
                      />
                    </Col>
                    <Col>
                      <Button 
                        onClick={() => onMoveText(selectedText, 'backward')}
                        icon={<BackwardOutlined />}
                      />
                    </Col>
                    <Col>
                      <Button 
                        onClick={() => onMoveText(selectedText, 'right')}
                        icon={<RightOutlined />}
                      />
                    </Col>
                  </Row>
                  <Row justify="center" style={{ marginTop: '8px' }}>
                    <Button 
                      onClick={() => onMoveText(selectedText, 'down')}
                      icon={<DownOutlined />}
                    />
                  </Row>
                </Card>
              </Col>
            </Row>
            
            <Button 
              type="primary" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDeleteText(selectedText)}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Metni Sil
            </Button>
          </Panel>
        </Collapse>
      )}
      
      {!selectedBlock && !selectedText && (
        <Card style={{ marginTop: '16px' }}>
          <Text>Düzenlemek için bir blok veya metin seçin.</Text>
        </Card>
      )}
    </div>
  );
};

export default ControlPanel;
