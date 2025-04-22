import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Typography, Descriptions, Tag, Button, Space, 
  Modal, Form, Input, Select, DatePicker, message, Divider, Timeline
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, ArrowLeftOutlined, 
  CalendarOutlined, UserOutlined, TeamOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const statusColors = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red'
};

const statusLabels = {
  pending: 'Beklemede',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi'
};

const priorityColors = {
  low: 'green',
  medium: 'orange',
  high: 'red'
};

const priorityLabels = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek'
};

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchTaskDetails();
    fetchUsers();
    fetchCustomers();
    fetchProjects();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/tasks/${id}`);
      setTask(data);
    } catch (error) {
      console.error('Görev detayları getirme hatası:', error);
      message.error('Görev detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users');
      setUsers(data);
    } catch (error) {
      console.error('Kullanıcıları getirme hatası:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get('/api/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Müşterileri getirme hatası:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setProjects(data);
    } catch (error) {
      console.error('Projeleri getirme hatası:', error);
    }
  };

  // Kullanıcı bu görevi güncelleyebilir mi?
  const canEditTask = () => {
    if (!task || !user) return false;
    return task.createdBy._id === user._id || user.role === 'admin';
  };

  // Kullanıcı bu görevin durumunu değiştirebilir mi?
  const canChangeStatus = () => {
    if (!task || !user) return false;
    return task.assignedTo._id === user._id || user.role === 'admin';
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/api/tasks/${id}`, { status: newStatus });
      message.success('Görev durumu güncellendi');
      fetchTaskDetails();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      message.error('Görev durumu güncellenirken bir hata oluştu');
    }
  };

  const showEditModal = () => {
    if (task) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo._id,
        dueDate: dayjs(task.dueDate),
        reminderDate: task.reminderDate ? dayjs(task.reminderDate) : undefined,
        relatedCustomer: task.relatedCustomer?._id,
        relatedProject: task.relatedProject?._id
      });
    }
    setIsEditModalVisible(true);
  };

  const handleEditTask = async (values) => {
    try {
      // Mevcut görevi alalım
      const taskData = { ...values };
      
      // Kullanıcı görevin oluşturucusu ve atanan kişi aynı anda değilse ve admin değilse
      const isCreator = task.createdBy._id === user._id;
      const isAssignee = task.assignedTo._id === user._id;
      const isAdmin = user.role === 'admin';
      
      // Tarih formatlarını ayarla
      taskData.dueDate = values.dueDate.toISOString();
      taskData.reminderDate = values.reminderDate ? values.reminderDate.toISOString() : null;
      
      // Sadece atanan kişiyse ve oluşturucu değilse, sadece status alanını gönder
      if (isAssignee && !isCreator && !isAdmin) {
        await axios.put(`/api/tasks/${id}`, {
          status: values.status
        });
      } 
      // Sadece oluşturucuysa ve atanan kişi değilse, status alanını hariç tut
      else if (isCreator && !isAssignee && !isAdmin) {
        const { status, ...taskWithoutStatus } = taskData;
        await axios.put(`${BASE_URL}/api/tasks/${id}`, taskWithoutStatus);
      }
      // Hem oluşturucu hem atanan kişiyse veya admin ise, her şeyi gönder
      else {
        await axios.put(`${BASE_URL}/api/tasks/${id}`, taskData);
      }
      
      message.success('Görev başarıyla güncellendi');
      setIsEditModalVisible(false);
      fetchTaskDetails();
    } catch (error) {
      console.error('Görev güncelleme hatası:', error);
      message.error('Görev güncellenirken bir hata oluştu: ' + (error.response?.data?.message || error.message));
    }
  };

  const showDeleteConfirm = () => {
    confirm({
      title: 'Bu görevi silmek istediğinizden emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: handleDeleteTask
    });
  };

  const handleDeleteTask = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/tasks/${id}`);
      message.success('Görev başarıyla silindi');
      navigate('/tasks');
    } catch (error) {
      console.error('Görev silme hatası:', error);
      message.error('Görev silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!task) {
    return <div>Görev bulunamadı.</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/tasks')}
        style={{ marginBottom: 16 }}
      >
        Görevlere Dön
      </Button>

      <Card
        title={
          <Space align="center">
            <Title level={3}>{task.title}</Title>
            <Tag color={statusColors[task.status]}>{statusLabels[task.status]}</Tag>
            <Tag color={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Tag>
          </Space>
        }
        extra={
          <Space>
            {canChangeStatus() && task.status !== 'completed' && (
              <Button 
                type="primary" 
                onClick={() => handleStatusChange('completed')}
              >
                Tamamlandı Olarak İşaretle
              </Button>
            )}
            {canEditTask() && (
              <>
                <Button 
                  icon={<EditOutlined />} 
                  onClick={showEditModal}
                  type="primary"
                  ghost
                >
                  Düzenle
                </Button>
                <Button 
                  icon={<DeleteOutlined />} 
                  onClick={showDeleteConfirm}
                  danger
                >
                  Sil
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Descriptions layout="vertical" column={2} bordered>
          <Descriptions.Item label="Açıklama" span={2}>
            {task.description || 'Açıklama bulunmuyor.'}
          </Descriptions.Item>

          <Descriptions.Item label="Atanan">
            <Space>
              <UserOutlined />
              {task.assignedTo?.fullName || task.assignedTo?.username || 'Atanmamış'}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Oluşturan">
            <Space>
              <TeamOutlined />
              {task.createdBy?.fullName || task.createdBy?.username || 'Bilinmiyor'}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Vade Tarihi">
            <Space>
              <CalendarOutlined />
              {dayjs(task.dueDate).format('DD.MM.YYYY')}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Oluşturulma Tarihi">
            <Space>
              <CalendarOutlined />
              {dayjs(task.createdAt).format('DD.MM.YYYY HH:mm')}
            </Space>
          </Descriptions.Item>

          {task.relatedCustomer && (
            <Descriptions.Item label="İlgili Müşteri" span={2}>
              {task.relatedCustomer.firstName} {task.relatedCustomer.lastName}
            </Descriptions.Item>
          )}

          {task.relatedProject && (
            <Descriptions.Item label="İlgili Proje" span={2}>
              {task.relatedProject.name}
            </Descriptions.Item>
          )}
        </Descriptions>

        {canChangeStatus() && task.status !== 'completed' && (
          <div style={{ marginTop: 24 }}>
            <Divider>Durumu Değiştir</Divider>
            <Space>
              {task.status !== 'pending' && (
                <Button onClick={() => handleStatusChange('pending')}>Beklemede</Button>
              )}
              {task.status !== 'in_progress' && (
                <Button onClick={() => handleStatusChange('in_progress')} type="primary">Devam Ediyor</Button>
              )}
              {task.status !== 'cancelled' && (
                <Button onClick={() => handleStatusChange('cancelled')} danger>İptal Edildi</Button>
              )}
            </Space>
          </div>
        )}
      </Card>

      <Modal
        title="Görev Düzenle"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditTask}
        >
          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: 'Lütfen görev başlığı giriniz' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="assignedTo"
            label="Atanan Kişi"
            rules={[{ required: true, message: 'Lütfen bir kişi seçiniz' }]}
          >
            <Select>
              {users.map(user => (
                <Option key={user._id} value={user._id}>
                  {user.fullName || user.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Öncelik"
            rules={[{ required: true, message: 'Lütfen öncelik seçiniz' }]}
          >
            <Select>
              <Option value="low">Düşük</Option>
              <Option value="medium">Orta</Option>
              <Option value="high">Yüksek</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Vade Tarihi"
            rules={[{ required: true, message: 'Lütfen vade tarihi seçiniz' }]}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reminderDate"
            label="Hatırlatma Tarihi"
          >
            <DatePicker 
              format="DD.MM.YYYY" 
              style={{ width: '100%' }} 
              showTime={{ format: 'HH:mm' }}
            />
          </Form.Item>

          <Form.Item
            name="relatedCustomer"
            label="İlgili Müşteri"
          >
            <Select allowClear>
              {customers.map(customer => (
                <Option key={customer._id} value={customer._id}>
                  {customer.firstName} {customer.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="relatedProject"
            label="İlgili Proje"
          >
            <Select allowClear>
              {projects.map(project => (
                <Option key={project._id} value={project._id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsEditModalVisible(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                Kaydet
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskDetailPage;
