import React, { useState, useEffect } from 'react';
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
  Space,
  Switch,
  message,
  Select
} from 'antd';
import { 
  EditOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  FontSizeOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
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
  onBlockSell,
  config = {}
}) => {
  const [dimensions, setDimensions] = useState(selectedBlockDimensions);
  const [blockDetails, setBlockDetails] = useState({
    unitNumber: '',
    type: 'apartment',
    status: 'available'
  });

  useEffect(() => {
    if (selectedBlock) {
      const block = blocks.find(b => (b._id || b.id) === selectedBlock);
      if (block) {
        setBlockDetails({
          unitNumber: block.unitNumber || '',
          type: block.type || 'apartment',
          status: block.status || 'available'
        });
      }
    }
  }, [selectedBlock, blocks]);

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
    message.success('Block details updated');
  };

  const handleDimensionChange = (dimension, value) => {
    if (value === null || value < (config.blocks?.minSize || 1)) return;
    if (value > (config.blocks?.maxSize || 10)) return;
    
    const newDimensions = { ...dimensions, [dimension]: value };
    setDimensions(newDimensions);
    onUpdateBlockDimensions(newDimensions);
  };

  const handleSellBlock = () => {
    if (onBlockSell) {
      onBlockSell(selectedBlock);
    }
  };

  const toggleTextMode = () => {
    if (editMode) {
      setTextMode(!textMode);
      if (!textMode) {
        setAddMode(false);
      }
    }
  };

  const getSelectedText = () => {
    return texts.find(t => t.id === selectedText);
  };

  return (
    <div className="control-panel" style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      <Title level={4} style={{ marginBottom: '16px', textAlign: 'center' }}>
        3D Building Editor
      </Title>
      
      <Tabs type="card" defaultActiveKey="1" style={{ marginBottom: '16px' }}>
        <TabPane tab={<span><SettingOutlined /> Mode</span>} key="1">
          <Card style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row align="middle" justify="space-between">
                <Col><Text strong>Edit Mode</Text></Col>
                <Col>
                  <Switch 
                    checked={editMode} 
                    onChange={() => setEditMode(!editMode)} 
                    checkedChildren="On" 
                    unCheckedChildren="Off"
                  />
                </Col>
              </Row>
              
              {editMode && (
                <>
                  <Row align="middle" justify="space-between" style={{ marginTop: '12px' }}>
                    <Col><Text>Add Blocks</Text></Col>
                    <Col>
                      <Switch 
                        checked={addMode} 
                        onChange={() => setAddMode(!addMode)}
                        checkedChildren="On" 
                        unCheckedChildren="Off"
                      />
                    </Col>
                  </Row>
                  
                  <Row align="middle" justify="space-between" style={{ marginTop: '12px' }}>
                    <Col><Text>Add Text</Text></Col>
                    <Col>
                      <Switch 
                        checked={textMode} 
                        onChange={toggleTextMode}
                        checkedChildren="On" 
                        unCheckedChildren="Off"
                      />
                    </Col>
                  </Row>
                </>
              )}
            </Space>
          </Card>
        </TabPane>

        <TabPane tab={<span><EditOutlined /> Block</span>} key="2" disabled={!selectedBlock}>
          {selectedBlock && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card title="Dimensions" style={{ marginBottom: '16px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={8}>
                    <Text>Width</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={dimensions.width}
                      min={config.blocks?.minSize || 1}
                      max={config.blocks?.maxSize || 10}
                      step={0.5}
                      onChange={(value) => handleDimensionChange('width', value)}
                    />
                  </Col>
                  <Col span={8}>
                    <Text>Height</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={dimensions.height}
                      min={config.blocks?.minSize || 1}
                      max={config.blocks?.maxSize || 10}
                      step={0.5}
                      onChange={(value) => handleDimensionChange('height', value)}
                    />
                  </Col>
                  <Col span={8}>
                    <Text>Depth</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={dimensions.depth}
                      min={config.blocks?.minSize || 1}
                      max={config.blocks?.maxSize || 10}
                      step={0.5}
                      onChange={(value) => handleDimensionChange('depth', value)}
                    />
                  </Col>
                </Row>
              </Card>

              <Card title="Details" style={{ marginBottom: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text>Unit Number</Text>
                    <Input
                      value={blockDetails.unitNumber}
                      onChange={(e) => handleDetailsChange('unitNumber', e.target.value)}
                      placeholder="Enter unit number"
                    />
                  </div>
                  
                  <div>
                    <Text>Type</Text>
                    <Select
                      style={{ width: '100%' }}
                      value={blockDetails.type}
                      onChange={(value) => handleDetailsChange('type', value)}
                    >
                      <Option value="apartment">Apartment</Option>
                      <Option value="store">Store</Option>
                      <Option value="office">Office</Option>
                    </Select>
                  </div>

                  <div>
                    <Text>Status</Text>
                    <Select
                      style={{ width: '100%' }}
                      value={blockDetails.status}
                      onChange={(value) => handleDetailsChange('status', value)}
                    >
                      <Option value="available">Available</Option>
                      <Option value="sold">Sold</Option>
                      <Option value="reserved">Reserved</Option>
                    </Select>
                  </div>

                  <Button 
                    type="primary" 
                    onClick={handleApplyDetails}
                    block
                  >
                    Apply Changes
                  </Button>
                </Space>
              </Card>

              <Card title="Actions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {onBlockSell && (
                    <Button 
                      type="default" 
                      onClick={handleSellBlock}
                      block
                    >
                      Sell Block
                    </Button>
                  )}
                  <Button 
                    type="primary" 
                    danger 
                    onClick={() => onDeleteBlock(selectedBlock)}
                    block
                  >
                    Delete Block
                  </Button>
                </Space>
              </Card>
            </Space>
          )}
        </TabPane>

        <TabPane tab={<span><FontSizeOutlined /> Text</span>} key="3" disabled={!selectedText}>
          {selectedText && getSelectedText() && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card title="Text Properties">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text>Content</Text>
                    <Input
                      value={getSelectedText().text}
                      onChange={(e) => onUpdateText(selectedText, { text: e.target.value })}
                      placeholder="Enter text content"
                    />
                  </div>

                  <div>
                    <Text>Color</Text>
                    <Input
                      type="color"
                      value={getSelectedText().color}
                      onChange={(e) => onUpdateText(selectedText, { color: e.target.value })}
                    />
                  </div>

                  <div>
                    <Text>Font Size</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getSelectedText().fontSize}
                      min={0.1}
                      max={2}
                      step={0.1}
                      onChange={(value) => onUpdateText(selectedText, { fontSize: value })}
                    />
                  </div>

                  <Button 
                    type="primary" 
                    danger 
                    onClick={() => onDeleteText(selectedText)}
                    block
                  >
                    Delete Text
                  </Button>
                </Space>
              </Card>
            </Space>
          )}
        </TabPane>
      </Tabs>

      <Card title="Statistics" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Total Blocks: {blocks.length}</Text>
          <Text>Total Texts: {texts.length}</Text>
          {selectedBlock && <Text type="success">Block Selected</Text>}
          {selectedText && <Text type="warning">Text Selected</Text>}
        </Space>
      </Card>
    </div>
  );
};

export default ControlPanel;