import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Table, Typography, Spin, Alert } from 'antd';

const { Title, Text } = Typography;

const CustomerDetailPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

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

    fetchCustomerDetails();
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
      title: 'Birim No',
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
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('tr-TR')
    },
    {
      title: 'Tutar',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₺${amount.toLocaleString('tr-TR')}`
    },
    {
      title: 'Ödeme Tipi',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Müşteri Detayları</Title>
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Kişisel Bilgiler">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Text strong>Ad Soyad:</Text>
                <div>{customer.firstName} {customer.lastName}</div>
              </Col>
              <Col span={8}>
                <Text strong>TC No:</Text>
                <div>{customer.tcNo}</div>
              </Col>
              <Col span={8}>
                <Text strong>Telefon:</Text>
                <div>{customer.phone}</div>
              </Col>
              <Col span={8}>
                <Text strong>E-posta:</Text>
                <div>{customer.email}</div>
              </Col>
              <Col span={16}>
                <Text strong>Adres:</Text>
                <div>{customer.address}</div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Sahip Olduğu Birimler">
            <Table
              dataSource={blocks}
              columns={blockColumns}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Ödeme Geçmişi">
            <Table
              dataSource={payments}
              columns={paymentColumns}
              rowKey="_id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerDetailPage;
