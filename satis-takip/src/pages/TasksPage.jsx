import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  message,
  Typography,
  Tabs,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';
import locale from 'antd/es/date-picker/locale/tr_TR';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);
dayjs.locale('tr');

const { Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); 
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned');
  const [taskCounts, setTaskCounts] = useState({
    assigned: 0,
    created: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllTasks(); 
    fetchTasks();
    fetchUsers();
    fetchCustomers();
    fetchProjects();
  }, []);

  useEffect(() => {
    updateTaskCounts();
  }, [allTasks]); 

  const fetchAllTasks = async () => {
    try {
      const { data } = await axios.get('/api/tasks'); 
      setAllTasks(data);
    } catch (error) {
      console.error('Tüm görevleri getirme hatası:', error);
    }
  };

  const fetchTasks = async (filter = '') => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/tasks${filter}`);
      setTasks(data);
    } catch (error) {
      message.error('Görevler yüklenirken bir hata oluştu.');
      console.error('Görevleri getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/auth/users');
      const processedUsers = data.map(user => ({
        ...user,
        name: user.fullName || user.username || 'İsimsiz Kullanıcı'
      }));
      setUsers(processedUsers);
    } catch (error) {
      console.error('Kullanıcıları getirme hatası:', error);
      const { user: currentUser } = useAuth();
      setUsers([{
        _id: currentUser._id,
        name: currentUser.fullName || currentUser.username || 'İsimsiz Kullanıcı'
      }]);
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

  const updateTaskCounts = () => {
    const now = dayjs();
    
    const counts = {
      assigned: allTasks.filter(task => task.assignedTo?._id === currentUser._id).length,
      created: allTasks.filter(task => task.createdBy?._id === currentUser._id).length,
      pending: allTasks.filter(task => task.status === 'pending').length,
      inProgress: allTasks.filter(task => task.status === 'in_progress').length,
      completed: allTasks.filter(task => task.status === 'completed').length,
      overdue: allTasks.filter(task => 
        dayjs(task.dueDate).isBefore(now) && 
        task.status !== 'completed' && 
        task.status !== 'cancelled'
      ).length
    };
    
    setTaskCounts(counts);
  };

  const handleTabChange = (activeKey) => {
    setActiveTab(activeKey);
    
    switch (activeKey) {
      case 'assigned':
        fetchTasks('?type=assigned');
        break;
      case 'created':
        fetchTasks('?type=created');
        break;
      case 'pending':
        fetchTasks('?status=pending');
        break;
      case 'inProgress':
        fetchTasks('?status=in_progress');
        break;
      case 'completed':
        fetchTasks('?status=completed');
        break;
      case 'overdue':
        fetchTasks('?due=overdue');
        break;
      default:
        fetchTasks('?type=assigned');
        break;
    }
  };

  const showTaskModal = (task = null) => {
    setEditingTask(task);
    
    if (task) {
      form.setFieldsValue({
        ...task,
        dueDate: dayjs(task.dueDate),
        reminderDate: task.reminderDate ? dayjs(task.reminderDate) : undefined,
        assignedTo: task.assignedTo._id,
        relatedCustomer: task.relatedCustomer?._id,
        relatedProject: task.relatedProject?._id
      });
    } else {
      form.resetFields();
      
      form.setFieldsValue({
        dueDate: dayjs().add(7, 'day'),
        status: 'pending',
        priority: 'medium'
      });
    }
    
    setIsModalVisible(true);
  };

  const handleTaskSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const assignedUser = users.find(user => user._id === values.assignedTo);
      
      const formattedValues = {
        ...values,
        assignedTo: values.assignedTo, 
        dueDate: values.dueDate.toISOString(),
        reminderDate: values.reminderDate ? values.reminderDate.toISOString() : undefined
      };
      
      if (editingTask) {
        const isCreator = editingTask.createdBy._id === currentUser._id;
        const isAssignee = editingTask.assignedTo._id === currentUser._id;
        const isAdmin = currentUser.role === 'admin';
        
        let updatedData = formattedValues;
        
        if (isAssignee && !isCreator && !isAdmin) {
          updatedData = { status: values.status };
        } 
        else if (isCreator && !isAssignee && !isAdmin) {
          const { status, ...taskWithoutStatus } = formattedValues;
          updatedData = taskWithoutStatus;
        }
        
        await axios.put(`/api/tasks/${editingTask._id}`, updatedData);
        message.success('Görev başarıyla güncellendi');
      } else {
        await axios.post(`${BASE_URL}/api/tasks`, formattedValues);
        message.success('Görev başarıyla oluşturuldu');
      }
      
      form.resetFields();
      setIsModalVisible(false);
      setEditingTask(null);
      fetchAllTasks(); 
      fetchTasks(activeTab === 'assigned' ? '?type=assigned' : 
                activeTab === 'created' ? '?type=created' : '');
    } catch (error) {
      console.error('Görev kaydetme hatası:', error);
      message.error('Görev kaydedilirken bir hata oluştu: ' + (error.response?.data?.message || error.message));
    }
  };

  const showDeleteConfirm = (task) => {
    confirm({
      title: 'Bu görevi silmek istediğinizden emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await axios.delete(`/api/tasks/${task._id}`);
          message.success('Görev başarıyla silindi');
          fetchAllTasks(); 
          fetchTasks(activeTab === 'assigned' ? '?type=assigned' : 
                    activeTab === 'created' ? '?type=created' : '');
        } catch (error) {
          console.error('Görev silme hatası:', error);
          message.error('Görev silinirken bir hata oluştu');
        }
      }
    });
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      message.success('Görev durumu güncellendi');
      fetchAllTasks(); 
      fetchTasks(activeTab === 'assigned' ? '?type=assigned' : 
                activeTab === 'created' ? '?type=created' : '');
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      message.error('Görev durumu güncellenirken bir hata oluştu: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="blue">Beklemede</Tag>;
      case 'in_progress':
        return <Tag color="orange">Devam Ediyor</Tag>;
      case 'completed':
        return <Tag color="green">Tamamlandı</Tag>;
      case 'cancelled':
        return <Tag color="red">İptal Edildi</Tag>;
      default:
        return <Tag>Bilinmiyor</Tag>;
    }
  };

  const getPriorityTag = (priority) => {
    switch (priority) {
      case 'low':
        return <Tag color="cyan">Düşük</Tag>;
      case 'medium':
        return <Tag color="blue">Orta</Tag>;
      case 'high':
        return <Tag color="orange">Yüksek</Tag>;
      case 'urgent':
        return <Tag color="red">Acil</Tag>;
      default:
        return <Tag>Bilinmiyor</Tag>;
    }
  };

  const isDueDateOverdue = (dueDate) => {
    return dayjs(dueDate).isBefore(dayjs()) && dueDate;
  };

  const canEditTask = (task) => {
    return task.createdBy._id === currentUser._id || currentUser.role === 'admin';
  };

  const canChangeStatus = (task) => {
    return task.assignedTo._id === currentUser._id || currentUser.role === 'admin';
  };

  const columns = [
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => navigate(`/tasks/${record._id}`)}
          >
            {text}
          </Button>
          {isDueDateOverdue(record.dueDate) && record.status !== 'completed' && (
            <Tag color="red">Gecikmiş</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        canChangeStatus(record) ? (
          <Select
            value={status}
            style={{ width: 140 }}
            onChange={(value) => handleStatusChange(record._id, value)}
          >
            <Select.Option value="pending">Beklemede</Select.Option>
            <Select.Option value="in_progress">Devam Ediyor</Select.Option>
            <Select.Option value="completed">Tamamlandı</Select.Option>
            <Select.Option value="cancelled">İptal Edildi</Select.Option>
          </Select>
        ) : (
          <span>
            {status === 'pending' && 'Beklemede'}
            {status === 'in_progress' && 'Devam Ediyor'}
            {status === 'completed' && 'Tamamlandı'}
            {status === 'cancelled' && 'İptal Edildi'}
          </span>
        )
      )
    },
    {
      title: 'Öncelik',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority)
    },
    {
      title: 'Vade Tarihi',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => (
        <span style={isDueDateOverdue(date) ? { color: 'red' } : {}}>
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      )
    },
    {
      title: 'Atanan',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (user) => {
        if (!user) return 'Atanmamış';
        return user.fullName || user.username || 'Atanmamış';
      }
    },
    {
      title: 'Oluşturan',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (user) => {
        if (!user) return 'Bilinmiyor';
        return user.fullName || user.username || 'Bilinmiyor';
      }
    },
    {
      title: 'İlgili Müşteri',
      dataIndex: 'relatedCustomer',
      key: 'relatedCustomer',
      render: (customer) => customer ? `${customer.firstName} ${customer.lastName}` : '-'
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/tasks/${record._id}`)}
            type="text"
          />
          {canEditTask(record) && (
            <>
              <Button 
                icon={<EditOutlined />} 
                onClick={() => showTaskModal(record)}
                type="text"
              />
              <Button 
                icon={<DeleteOutlined />} 
                onClick={() => showDeleteConfirm(record)}
                type="text"
                danger
              />
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        title={<Title level={3}>Görevler</Title>}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showTaskModal()}
          >
            Yeni Görev
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane 
            tab={
              <span>
                <Badge count={taskCounts.assigned} showZero offset={[10, 0]}>
                  <span>Size Atanan</span>
                </Badge>
              </span>
            } 
            key="assigned" 
          />
          <TabPane 
            tab={
              <span>
                <Badge count={taskCounts.created} showZero offset={[10, 0]}>
                  <span>Atadığınız</span>
                </Badge>
              </span>
            } 
            key="created" 
          />
          <TabPane 
            tab={
              <span>
                <Badge count={taskCounts.pending} showZero offset={[10, 0]}>
                  <span>Beklemede</span>
                </Badge>
              </span>
            } 
            key="pending" 
          />
          <TabPane 
            tab={
              <span>
                <Badge count={taskCounts.inProgress} showZero offset={[10, 0]}>
                  <span>Devam Eden</span>
                </Badge>
              </span>
            } 
            key="inProgress" 
          />
          <TabPane 
            tab={
              <span>
                <Badge count={taskCounts.completed} showZero offset={[10, 0]}>
                  <span>Tamamlanan</span>
                </Badge>
              </span>
            } 
            key="completed" 
          />
          <TabPane 
            tab={
              <span>
                <Badge count={taskCounts.overdue} showZero offset={[10, 0]} color="red">
                  <span style={{ color: taskCounts.overdue > 0 ? 'red' : undefined }}>
                    Gecikmiş
                  </span>
                </Badge>
              </span>
            } 
            key="overdue" 
          />
        </Tabs>

        <Table 
          dataSource={tasks} 
          columns={columns} 
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Görev bulunamadı' }}
        />
      </Card>

      <Modal
        title={editingTask ? 'Görev Düzenle' : 'Yeni Görev'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleTaskSubmit}
        width={700}
        okText={editingTask ? 'Güncelle' : 'Oluştur'}
        cancelText="İptal"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: 'Lütfen görev başlığını girin' }]}
          >
            <Input placeholder="Görev başlığını girin" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
          >
            <TextArea rows={4} placeholder="Görev açıklaması girin" />
          </Form.Item>

          <Form.Item
            name="assignedTo"
            label="Atanan Kişi"
            rules={[{ required: true, message: 'Lütfen görevin atanacağı kişiyi seçin' }]}
          >
            <Select placeholder="Bir kullanıcı seçin">
              {users.map(user => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Durum"
            rules={[{ required: true, message: 'Lütfen görev durumunu seçin' }]}
          >
            <Select placeholder="Durum seçin">
              <Select.Option value="pending">Beklemede</Select.Option>
              <Select.Option value="in_progress">Devam Ediyor</Select.Option>
              <Select.Option value="completed">Tamamlandı</Select.Option>
              <Select.Option value="cancelled">İptal Edildi</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Öncelik"
            rules={[{ required: true, message: 'Lütfen görev önceliğini seçin' }]}
          >
            <Select placeholder="Öncelik seçin">
              <Select.Option value="low">Düşük</Select.Option>
              <Select.Option value="medium">Orta</Select.Option>
              <Select.Option value="high">Yüksek</Select.Option>
              <Select.Option value="urgent">Acil</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Vade Tarihi"
            rules={[{ required: true, message: 'Lütfen vade tarihi seçin' }]}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              style={{ width: '100%' }}
              locale={locale}
            />
          </Form.Item>

          <Form.Item
            name="reminderDate"
            label="Hatırlatma Tarihi"
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              style={{ width: '100%' }}
              locale={locale}
            />
          </Form.Item>

          <Form.Item
            name="relatedCustomer"
            label="İlgili Müşteri"
          >
            <Select 
              placeholder="Müşteri seçin" 
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {customers.map(customer => (
                <Select.Option key={customer._id} value={customer._id}>
                  {customer.firstName} {customer.lastName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="relatedProject"
            label="İlgili Proje"
          >
            <Select 
              placeholder="Proje seçin" 
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {projects.map(project => (
                <Select.Option key={project._id} value={project._id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksPage;
