import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Table, Typography, Spin, Alert, Tabs } from 'antd';
import CustomerNotes from '../components/CustomerNotes';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CustomerDetailPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerTasks, setCustomerTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const { data } = await axios.get(`/api/customers/${id}/details`);
        setCustomerDetails(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Müşteri detayları yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    const fetchCustomerTasks = async () => {
      setLoadingTasks(true);
      try {
        const { data } = await axios.get(`/api/tasks?relatedCustomer=${id}`);
        setCustomerTasks(data);
      } catch (err) {
        console.error('Müşteri görevleri yüklenirken bir hata oluştu:', err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchCustomerDetails();
    fetchCustomerTasks();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Hata"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  const { customer, blocks, payments } = customerDetails;

  const blockColumns = [
    {
      title: 'Proje',
      dataIndex: ['projectId', 'name'],
      key: 'project'
    },
    {
      title: 'Birim Numarası',
      dataIndex: 'unitNumber',
      key: 'unitNumber'
    },
    {
      title: 'Tipi',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type === 'apartment' ? 'Daire' : 'Dükkan'
    },
    {
      title: 'Metrekare',
      dataIndex: 'squareMeters',
      key: 'squareMeters'
    },
    {
      title: 'Oda Sayısı',
      dataIndex: 'roomCount',
      key: 'roomCount'
    }
  ];

  const paymentColumns = [
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('tr-TR')
    },
    {
      title: 'Tutar',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount.toLocaleString('tr-TR')} ₺`
    },
    {
      title: 'Ödeme Tipi',
      dataIndex: 'paymentType',
      key: 'paymentType'
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Kayıt Tarihi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('tr-TR')
    }
  ];

  const taskColumns = [
    {
      title: 'Görev',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        switch (status) {
          case 'pending': return 'Beklemede';
          case 'in_progress': return 'Devam Ediyor';
          case 'completed': return 'Tamamlandı';
          case 'cancelled': return 'İptal Edildi';
          default: return status;
        }
      }
    },
    {
      title: 'Öncelik',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        switch (priority) {
          case 'low': return 'Düşük';
          case 'medium': return 'Orta';
          case 'high': return 'Yüksek';
          case 'urgent': return 'Acil';
          default: return priority;
        }
      }
    },
    {
      title: 'Vade Tarihi',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => new Date(date).toLocaleDateString('tr-TR')
    },
    {
      title: 'Atanan',
      dataIndex: ['assignedTo', 'name'],
      key: 'assignedTo'
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card title={<Title level={3}>{customer.firstName} {customer.lastName}</Title>}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Text strong>TC Kimlik No:</Text>
            <div>{customer.tcNo}</div>
          </Col>
          <Col span={8}>
            <Text strong>E-posta:</Text>
            <div>{customer.email}</div>
          </Col>
          <Col span={8}>
            <Text strong>Telefon:</Text>
            <div>{customer.phone}</div>
          </Col>
          {customer.secondaryPhone && (
            <Col span={8}>
              <Text strong>İkinci Telefon:</Text>
              <div>{customer.secondaryPhone}</div>
            </Col>
          )}
          {customer.address && (
            <Col span={16}>
              <Text strong>Adres:</Text>
              <div>{customer.address}</div>
            </Col>
          )}
          {customer.city && (
            <Col span={8}>
              <Text strong>Şehir:</Text>
              <div>{customer.city}</div>
            </Col>
          )}
          {customer.occupation && (
            <Col span={8}>
              <Text strong>Meslek:</Text>
              <div>{customer.occupation}</div>
            </Col>
          )}
          {customer.birthDate && (
            <Col span={8}>
              <Text strong>Doğum Tarihi:</Text>
              <div>{new Date(customer.birthDate).toLocaleDateString('tr-TR')}</div>
            </Col>
          )}
          {customer.customerStatus && (
            <Col span={8}>
              <Text strong>Müşteri Durumu:</Text>
              <div>
                {customer.customerStatus === 'lead' && 'Aday Müşteri'}
                {customer.customerStatus === 'prospect' && 'Potansiyel Müşteri'}
                {customer.customerStatus === 'active' && 'Aktif Müşteri'}
                {customer.customerStatus === 'inactive' && 'İnaktif Müşteri'}
              </div>
            </Col>
          )}
          {customer.customerSource && (
            <Col span={8}>
              <Text strong>Müşteri Kaynağı:</Text>
              <div>
                {customer.customerSource === 'referral' && 'Referans'}
                {customer.customerSource === 'advertisement' && 'Reklam'}
                {customer.customerSource === 'website' && 'Web Sitesi'}
                {customer.customerSource === 'social_media' && 'Sosyal Medya'}
                {customer.customerSource === 'direct' && 'Doğrudan Başvuru'}
                {customer.customerSource === 'other' && 'Diğer'}
              </div>
            </Col>
          )}
        </Row>
      </Card>

      <Tabs defaultActiveKey="units" style={{ marginTop: 20 }}>
        <TabPane tab="Sahip Olunan Birimler" key="units">
          <Card>
            <Table 
              columns={blockColumns} 
              dataSource={blocks} 
              rowKey="_id" 
              pagination={false}
              locale={{ emptyText: 'Bu müşteriye ait birim bulunamadı' }} 
            />
          </Card>
        </TabPane>
        
        <TabPane tab="Ödeme Geçmişi" key="payments">
          <Card>
            <Table 
              columns={paymentColumns} 
              dataSource={payments} 
              rowKey="_id" 
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Ödeme geçmişi bulunamadı' }} 
            />
          </Card>
        </TabPane>

        <TabPane tab="Notlar" key="notes">
          <CustomerNotes customerId={id} />
        </TabPane>

        <TabPane tab="Görevler" key="tasks">
          <Card>
            <Table
              columns={taskColumns}
              dataSource={customerTasks}
              rowKey="_id"
              loading={loadingTasks}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Bu müşteri ile ilgili görev bulunamadı' }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CustomerDetailPage;
