import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Typography, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Divider, 
  message,
  Tooltip,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PhoneOutlined, 
  MessageOutlined, 
  MailOutlined, 
  UserOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';

dayjs.extend(relativeTime);
dayjs.locale('tr');

const { Title, Text } = Typography;
const { TextArea } = Input;

const CustomerNotes = ({ customerId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (customerId) {
      fetchNotes();
    }
  }, [customerId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/customer-notes/${customerId}`);
      setNotes(data);
    } catch (error) {
      message.error('Müşteri notları yüklenirken bir hata oluştu.');
      console.error('Notları getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNoteModal = (note = null) => {
    setEditingNote(note);
    
    if (note) {
      form.setFieldsValue({
        title: note.title,
        content: note.content,
        type: note.type,
        isPrivate: note.isPrivate
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: 'other',
        isPrivate: false
      });
    }
    
    setIsModalVisible(true);
  };

  const handleNoteSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingNote) {
        await axios.put(`/api/customer-notes/${editingNote._id}`, values);
        message.success('Not başarıyla güncellendi');
      } else {
        await axios.post('/api/customer-notes', {
          ...values,
          customerId
        });
        message.success('Not başarıyla eklendi');
      }
      
      setIsModalVisible(false);
      fetchNotes();
    } catch (error) {
      console.error('Not kaydetme hatası:', error);
      message.error('Not kaydedilirken bir hata oluştu');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`/api/customer-notes/${noteId}`);
      message.success('Not başarıyla silindi');
      fetchNotes();
    } catch (error) {
      console.error('Not silme hatası:', error);
      message.error('Not silinirken bir hata oluştu');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <UserOutlined />;
      case 'call':
        return <PhoneOutlined />;
      case 'email':
        return <MailOutlined />;
      default:
        return <MessageOutlined />;
    }
  };

  const getTypeTag = (type) => {
    switch (type) {
      case 'meeting':
        return <Tag color="blue" icon={<UserOutlined />}>Görüşme</Tag>;
      case 'call':
        return <Tag color="green" icon={<PhoneOutlined />}>Telefon</Tag>;
      case 'email':
        return <Tag color="purple" icon={<MailOutlined />}>E-posta</Tag>;
      default:
        return <Tag color="cyan" icon={<MessageOutlined />}>Diğer</Tag>;
    }
  };

  return (
    <Card 
      title={<Title level={4}>Müşteri Notları</Title>}
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => showNoteModal()}
        >
          Not Ekle
        </Button>
      }
      loading={loading}
    >
      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="secondary">Bu müşteri için henüz not eklenmemiş.</Text>
        </div>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={notes}
          renderItem={note => (
            <List.Item
              style={{ 
                padding: '16px', 
                backgroundColor: note.isPrivate ? '#fffbe6' : 'transparent',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '8px'
              }}
              actions={[
                <Text type="secondary">
                  {dayjs(note.createdAt).fromNow()}
                </Text>,
                <Space>
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => showNoteModal(note)}
                  />
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteNote(note._id)}
                  />
                </Space>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{note.title}</Text>
                    {getTypeTag(note.type)}
                    {note.isPrivate && (
                      <Tooltip title="Özel Not - Sadece siz görebilirsiniz">
                        <Tag icon={<LockOutlined />} color="orange">Özel</Tag>
                      </Tooltip>
                    )}
                  </Space>
                }
                description={
                  <Text type="secondary">
                    {note.userId?.name || 'Bilinmeyen Kullanıcı'} tarafından eklendi
                  </Text>
                }
              />
              <div style={{ marginTop: '10px', whiteSpace: 'pre-line' }}>
                {note.content}
              </div>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleNoteSubmit}
        okText={editingNote ? 'Güncelle' : 'Ekle'}
        cancelText="İptal"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: 'Lütfen not başlığını girin' }]}
          >
            <Input placeholder="Not başlığını girin" />
          </Form.Item>

          <Form.Item
            name="content"
            label="İçerik"
            rules={[{ required: true, message: 'Lütfen not içeriğini girin' }]}
          >
            <TextArea rows={4} placeholder="Not içeriğini girin" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Not Türü"
            rules={[{ required: true, message: 'Lütfen not türünü seçin' }]}
          >
            <Select placeholder="Not türü seçin">
              <Select.Option value="meeting">Görüşme</Select.Option>
              <Select.Option value="call">Telefon</Select.Option>
              <Select.Option value="email">E-posta</Select.Option>
              <Select.Option value="other">Diğer</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isPrivate"
            label="Özel Not"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren={<LockOutlined />} 
              unCheckedChildren={<UnlockOutlined />} 
            />
          </Form.Item>
          <Text type="secondary">
            Özel notları sadece siz görebilirsiniz. Diğer notlar tüm ekip üyeleri tarafından görülebilir.
          </Text>
        </Form>
      </Modal>
    </Card>
  );
};

export default CustomerNotes;
