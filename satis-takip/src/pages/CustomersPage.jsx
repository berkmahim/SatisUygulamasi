import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const { Title } = Typography;

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/api/customers`);
      setCustomers(data);
    } catch (error) {
      message.error('Müşteriler yüklenirken bir hata oluştu');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDeleteCustomer = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/customers/${id}`);
      message.success('Müşteri başarıyla silindi');
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Müşteri silinirken bir hata oluştu');
    }
  };

  const handleUpdateCustomer = async (values) => {
    try {
      const customerId = selectedCustomer._id;
      await axios.put(`${BASE_URL}/api/customers/${customerId}`, values);
      message.success('Müşteri bilgileri güncellendi');
      setModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Müşteri güncellenirken bir hata oluştu');
    }
  };

  const handleCreateCustomer = async (values) => {
    try {
      await axios.post(`${BASE_URL}/api/customers`, values);
      message.success('Müşteri başarıyla oluşturuldu');
      setModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Müşteri oluşturulurken bir hata oluştu');
    }
  };

  const columns = [
    {
      title: 'Ad',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Soyad',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'TC No',
      dataIndex: 'tcNo',
      key: 'tcNo',
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            onClick={() => navigate(`/customers/${record._id}`)}
          >
            Detay
          </Button>
          <Button
            onClick={() => {
              setSelectedCustomer(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Düzenle
          </Button>
          <Button 
            danger
            onClick={() => {
              Modal.confirm({
                title: 'Müşteri Silme',
                content: 'Bu müşteriyi silmek istediğinizden emin misiniz?',
                okText: 'Evet',
                cancelText: 'Hayır',
                onOk: () => handleDeleteCustomer(record._id)
              });
            }}
          >
            Sil
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Müşteriler</Title>
        <Button type="primary" onClick={() => setModalVisible(true)}>
          Yeni Müşteri
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="_id"
      />

      <Modal
        title={form.getFieldValue('_id') ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
        open={modalVisible}
        onOk={form.submit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedCustomer(null);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (selectedCustomer) {
              handleUpdateCustomer(values);
            } else {
              handleCreateCustomer(values);
            }
          }}
        >
          <Form.Item
            name="firstName"
            label="Ad"
            rules={[{ required: true, message: 'Lütfen adı giriniz' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Soyad"
            rules={[{ required: true, message: 'Lütfen soyadı giriniz' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="tcNo"
            label="TC No"
            rules={[{ required: true, message: 'Lütfen TC No giriniz' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Telefon"
            rules={[{ required: true, message: 'Lütfen telefon numarası giriniz' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: 'Lütfen e-posta adresi giriniz' },
              { type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
