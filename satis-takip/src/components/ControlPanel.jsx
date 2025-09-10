import React, { useState, useEffect, useRef } from 'react';
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
  Select,
  Modal,
  Popconfirm,
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
import { getAllReferences, createReference, deleteReference } from '../services/referenceService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

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
    reference: '',
    squareMeters: 0,
    type: 'apartment',
    iskanPaymentDone: false
  });
  const [references, setReferences] = useState([]);
  const [isCreatingReference, setIsCreatingReference] = useState(false);
  const [referenceManagementVisible, setReferenceManagementVisible] = useState(false);
  const userIsEditing = useRef(false);

  useEffect(() => {
    if (selectedBlock && !userIsEditing.current) {
      const block = blocks.find(b => (b._id || b.id) === selectedBlock);
      if (block) {
        setBlockDetails({
          unitNumber: block.unitNumber || '',
          owner: block.owner || '',
          reference: block.reference?._id || '',
          squareMeters: block.squareMeters || 0,
          type: block.type || 'apartment',
          iskanPaymentDone: block.iskanPaymentDone || false
        });
      }
    }
  }, [selectedBlock, blocks]);

  // Reset editing flag when a different block is selected
  useEffect(() => {
    userIsEditing.current = false;
  }, [selectedBlock]);

  // selectedBlockDimensions değiştiğinde dimensions state'ini güncelle
  useEffect(() => {
    setDimensions(selectedBlockDimensions);
  }, [selectedBlockDimensions]);

  // Load references on component mount
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const data = await getAllReferences();
        setReferences(data);
      } catch (error) {
        console.error('Error fetching references:', error);
      }
    };
    fetchReferences();
  }, []);

  const handleDetailsChange = (field, value) => {
    console.log(`handleDetailsChange called: ${field} = ${value}`);
    userIsEditing.current = true;
    setBlockDetails(prev => {
      const newDetails = {
        ...prev,
        [field]: value
      };
      console.log('Updated blockDetails:', newDetails);
      return newDetails;
    });
  };

  const handleCreateReference = async (referenceName) => {
    if (!referenceName || referenceName.trim() === '') {
      message.error('Referans adı boş olamaz');
      return;
    }

    setIsCreatingReference(true);
    try {
      const newReference = await createReference({ name: referenceName.trim() });
      setReferences(prev => [...prev, newReference]);
      setBlockDetails(prev => ({ ...prev, reference: newReference._id }));
      message.success('Yeni referans oluşturuldu');
    } catch (error) {
      console.error('Error creating reference:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Referans oluşturulurken hata oluştu');
      }
    } finally {
      setIsCreatingReference(false);
    }
  };

  const handleDeleteReference = async (referenceId, referenceName) => {
    try {
      await deleteReference(referenceId);
      setReferences(prev => prev.filter(ref => ref._id !== referenceId));
      
      // If current block has this reference, clear it
      if (blockDetails.reference === referenceId) {
        setBlockDetails(prev => ({ ...prev, reference: '' }));
      }
      
      message.success(`"${referenceName}" referansı silindi`);
    } catch (error) {
      console.error('Error deleting reference:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Referans silinirken hata oluştu');
      }
    }
  };

  const handleApplyDetails = () => {
    console.log('Applying details:', blockDetails);
    console.log('Selected block:', selectedBlock);
    onUpdateBlockDetails(selectedBlock, blockDetails);
    userIsEditing.current = false; // Reset editing flag after applying
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
              
              <Col span={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Referans:</Text>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {blockDetails.reference && (
                      <Button
                        size="small"
                        type="link"
                        danger
                        onClick={() => {
                          console.log('Before removing reference:', blockDetails.reference);
                          handleDetailsChange('reference', undefined);
                          console.log('After removing reference:', blockDetails.reference);
                          message.success('Referans kaldırıldı');
                        }}
                      >
                        Kaldır
                      </Button>
                    )}
                    <Button
                      size="small"
                      type="link"
                      icon={<SettingOutlined />}
                      onClick={() => setReferenceManagementVisible(true)}
                    >
                      Yönet
                    </Button>
                  </div>
                </div>
                <Select
                  placeholder="Referans seçin veya yeni oluşturun"
                  value={blockDetails.reference || undefined}
                  onChange={(value) => handleDetailsChange('reference', value)}
                  style={{ width: '100%', marginTop: '5px', marginBottom: '12px' }}
                  showSearch
                  allowClear
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                     {/*} <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                        <Input.Search
                          placeholder="Yeni referans adı girin"
                          enterButton={
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              loading={isCreatingReference}
                            >
                              Ekle
                            </Button>
                          }
                          size="small"
                          onSearch={handleCreateReference}
                        />
                      </div> */}
                    </>
                  )}
                  filterOption={(input, option) =>
                    option?.children?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {references.map((ref) => (
                    <Option key={ref._id} value={ref._id}>
                      {ref.name} {ref.usageCount > 0 && `(${ref.usageCount} birim)`}
                    </Option>
                  ))}
                </Select>
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
      
      {/* Reference Management Modal */}
      <Modal
        title="Referans Yönetimi"
        open={referenceManagementVisible}
        onCancel={() => setReferenceManagementVisible(false)}
        footer={[
          <Button key="close" onClick={() => setReferenceManagementVisible(false)}>
            Kapat
          </Button>
        ]}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input.Search
            placeholder="Yeni referans adı girin"
            enterButton={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={isCreatingReference}
              >
                Referans Ekle
              </Button>
            }
            onSearch={handleCreateReference}
          />
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {references.length === 0 ? (
            <Text type="secondary">Henüz referans oluşturulmamış.</Text>
          ) : (
            references.map((ref) => (
              <Card key={ref._id} size="small" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>{ref.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {ref.usageCount > 0 ? `${ref.usageCount} birimde kullanılıyor` : 'Henüz kullanılmıyor'}
                    </Text>
                  </div>
                  <Popconfirm
                    title="Referansı Sil"
                    description={
                      ref.usageCount > 0
                        ? `Bu referans ${ref.usageCount} birimde kullanılıyor. Silinirse bu birimlerden kaldırılacak. Emin misiniz?`
                        : 'Bu referansı silmek istediğinizden emin misiniz?'
                    }
                    onConfirm={() => handleDeleteReference(ref._id, ref.name)}
                    okText="Evet"
                    cancelText="Hayır"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                    >
                      Sil
                    </Button>
                  </Popconfirm>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ControlPanel;
