import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  Typography, 
  Spin, 
  message,
  Space,
  Modal,
  Popconfirm 
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SettingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getBlockById, updateBlock } from '../services/blockService';
import { getAllReferences, createReference, deleteReference } from '../services/referenceService';

const { Title } = Typography;
const { Option } = Select;

const BlockDetail = () => {
  const { projectId, blockId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [block, setBlock] = useState(null);
  const [references, setReferences] = useState([]);
  const [isCreatingReference, setIsCreatingReference] = useState(false);
  const [referenceManagementVisible, setReferenceManagementVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch block data and references in parallel
        const [blockData, referencesData] = await Promise.all([
          getBlockById(blockId),
          getAllReferences()
        ]);
        
        setBlock(blockData);
        setReferences(referencesData);
        
        // Set form values
        const ownerName = blockData.owner 
          ? `${blockData.owner.firstName || ''} ${blockData.owner.lastName || ''}`.trim()
          : '';
          
        const formValues = {
          type: blockData.type || 'apartment',
          unitNumber: blockData.unitNumber || '',
          owner: ownerName,
          reference: blockData.reference?._id || undefined,
          squareMeters: blockData.squareMeters || 0,
          roomCount: blockData.roomCount || ''
        };
        
        form.setFieldsValue(formValues);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Blok bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (blockId) {
      fetchData();
    }
  }, [blockId, form]);

  const handleCreateReference = async (referenceName) => {
    if (!referenceName || referenceName.trim() === '') {
      message.error('Referans adı boş olamaz');
      return;
    }

    setIsCreatingReference(true);
    try {
      const newReference = await createReference({ name: referenceName.trim() });
      setReferences(prev => [...prev, newReference]);
      form.setFieldValue('reference', newReference._id);
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
      if (form.getFieldValue('reference') === referenceId) {
        form.setFieldValue('reference', undefined);
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

  const handleSubmit = async (values) => {
    try {
      setUpdating(true);
      
      console.log('BlockDetail - Form values before submit:', values);
      
      // Eğer blok zaten satılmışsa (owner ObjectId var), owner field'ını gönderme
      const submitValues = { ...values };
      if (block?.owner && typeof block.owner === 'object') {
        delete submitValues.owner;
      }
      
      console.log('BlockDetail - Final submit values:', submitValues);
      
      await updateBlock(blockId, submitValues);
      message.success('Blok başarıyla güncellendi');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error updating block:', error);
      message.error('Blok güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>Blok Detayları</Title>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Geri Dön
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: '600px' }}
        >
          <Form.Item
            label="Blok Tipi"
            name="type"
            rules={[{ required: true, message: 'Blok tipi seçiniz' }]}
          >
            <Select placeholder="Blok tipi seçiniz">
              <Option value="apartment">Daire</Option>
              <Option value="store">Dükkan</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Birim Numarası"
            name="unitNumber"
          >
            <Input placeholder="Birim numarası girin" />
          </Form.Item>

          <Form.Item
            label="Sahibi"
            name="owner"
            extra="Satılmış birimler için müşteri adı otomatik görüntülenir"
          >
            <Input placeholder="Sahibi adını girin (manuel)" disabled={!!block?.owner} />
          </Form.Item>

          <Form.Item 
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Referans</span>
                {form.getFieldValue('reference') && (
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={() => {
                      console.log('BlockDetail - Before removing reference:', form.getFieldValue('reference'));
                      form.setFieldValue('reference', null);
                      console.log('BlockDetail - After removing reference:', form.getFieldValue('reference'));
                      message.success('Referans kaldırıldı');
                    }}
                    style={{ padding: '0 4px', fontSize: '12px' }}
                  >
                    Kaldır
                  </Button>
                )}
                <Button
                  size="small"
                  type="link"
                  icon={<SettingOutlined />}
                  onClick={() => setReferenceManagementVisible(true)}
                  style={{ padding: '0 4px', fontSize: '12px' }}
                >
                  Yönet
                </Button>
              </div>
            } 
            name="reference"
          >
            <Select
              placeholder="Referans seçin"
              allowClear
              showSearch
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
          </Form.Item>

          <Form.Item
            label="Metrekare"
            name="squareMeters"
          >
            <InputNumber 
              placeholder="Metrekare girin"
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Oda Sayısı"
            name="roomCount"
          >
            <Input placeholder="Oda sayısını girin" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={updating}
              >
                Güncelle
              </Button>
              <Button onClick={() => navigate(`/projects/${projectId}`)}>
                İptal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

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
            <Typography.Text type="secondary">Henüz referans oluşturulmamış.</Typography.Text>
          ) : (
            references.map((ref) => (
              <Card key={ref._id} size="small" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography.Text strong>{ref.name}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                      {ref.usageCount > 0 ? `${ref.usageCount} birimde kullanılıyor` : 'Henüz kullanılmıyor'}
                    </Typography.Text>
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

export default BlockDetail;
