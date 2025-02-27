import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, DatePicker, Table, Typography, Spin, message, Tag, Empty } from 'antd';
import { Pie } from '@ant-design/plots';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import locale from 'antd/es/date-picker/locale/tr_TR';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ProjectReports = () => {
  const { id: projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [unitTypeData, setUnitTypeData] = useState(null);
  const [roomCountData, setRoomCountData] = useState(null);
  const [payments, setPayments] = useState({ receivedPayments: [], expectedPayments: [] });
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [expectedPaymentDateRange, setExpectedPaymentDateRange] = useState([null, null]);
  const [filteredExpectedPayments, setFilteredExpectedPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);

  // Birim tipi ve oda sayısı dağılımını al
  const fetchUnitTypeDistribution = async () => {
    try {
      const { data } = await axios.get(`/api/reports/projects/${projectId}/unit-types`);
      
      setUnitTypeData(data.unitStatus);
      setRoomCountData(data.roomCounts);
    } catch (error) {
      message.error('Birim tipi dağılımı alınamadı');
      console.error(error);
    }
  };

  // Ödemeleri al
  const fetchPayments = async () => {
    try {
      if (!dateRange || !dateRange[0] || !dateRange[1]) return;
      
      const { data } = await axios.get(`/api/reports/projects/${projectId}/payments`, {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }
      });
      
      setPayments(data);
      
      // Bekleyen ve gecikmiş ödemeleri ayır
      const pending = data.expectedPayments.filter(payment => payment.status !== 'overdue');
      const overdue = data.expectedPayments.filter(payment => payment.status === 'overdue');
      
      setFilteredExpectedPayments(pending);
      setOverduePayments(overdue);
    } catch (error) {
      message.error('Ödemeler alınamadı');
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUnitTypeDistribution(),
        fetchPayments()
      ]);
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    fetchPayments();
  }, [dateRange]);
  
  // Beklenen ödemeleri tarih aralığına göre filtrele
  useEffect(() => {
    if (!payments.expectedPayments || !payments.expectedPayments.length) {
      setFilteredExpectedPayments([]);
      return;
    }
    
    // Önce bekleyen ve gecikmiş ödemeleri ayır
    const pending = payments.expectedPayments.filter(payment => payment.status !== 'overdue');
    
    if (!expectedPaymentDateRange[0] && !expectedPaymentDateRange[1]) {
      // Tarih filtresi yoksa tüm bekleyen ödemeleri göster
      setFilteredExpectedPayments(pending);
      return;
    }
    
    const filtered = pending.filter(payment => {
      const dueDate = dayjs(payment.dueDate);
      
      // Eğer bir başlangıç tarihi varsa ve ödeme tarihi bundan küçükse filtrele
      if (expectedPaymentDateRange[0] && dueDate.isBefore(expectedPaymentDateRange[0], 'day')) {
        return false;
      }
      
      // Eğer bir bitiş tarihi varsa ve ödeme tarihi bundan büyükse filtrele
      if (expectedPaymentDateRange[1] && dueDate.isAfter(expectedPaymentDateRange[1], 'day')) {
        return false;
      }
      
      return true;
    });
    
    setFilteredExpectedPayments(filtered);
  }, [expectedPaymentDateRange, payments.expectedPayments]);

  // Gecikmiş ödemeleri tarih aralığına göre filtrele
  useEffect(() => {
    if (!payments.expectedPayments || !payments.expectedPayments.length) {
      setOverduePayments([]);
      return;
    }
    
    // Gecikmiş ödemeleri ayır
    const overdue = payments.expectedPayments.filter(payment => payment.status === 'overdue');
    setOverduePayments(overdue);
  }, [payments.expectedPayments]);

  // Grafik konfigürasyonu
  const pieConfig = {
    appendPadding: 10,
    angleField: 'count',
    colorField: 'type',
    radius: 0.8,
    label: false, // Etiketleri devre dışı bırak
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: `${datum.count} adet` };
      },
    },
    interactions: [{ type: 'element-active' }]
  };

  // Tablo kolonları
  const receivedColumns = [
    { title: 'Müşteri', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Birim', dataIndex: 'blockInfo', key: 'blockInfo' },
    { 
      title: 'Tutar', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (amount) => `${amount.toLocaleString('tr-TR')} ₺`
    },
    { 
      title: 'Ödenen', 
      dataIndex: 'paidAmount', 
      key: 'paidAmount',
      render: (amount) => `${amount.toLocaleString('tr-TR')} ₺`
    },
    { 
      title: 'Ödeme Tarihi', 
      dataIndex: 'paidDate', 
      key: 'paidDate',
      render: (date) => dayjs(date).format('DD.MM.YYYY')
    }
  ];

  const expectedColumns = [
    { title: 'Müşteri', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Birim', dataIndex: 'blockInfo', key: 'blockInfo' },
    { 
      title: 'Tutar', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (amount) => `${amount.toLocaleString('tr-TR')} ₺`
    },
    { 
      title: 'Vade Tarihi', 
      dataIndex: 'dueDate', 
      key: 'dueDate',
      render: (date) => dayjs(date).format('DD.MM.YYYY')
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'overdue' ? 'red' : 'orange'}>
          {status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
        </Tag>
      )
    }
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Proje Raporları</Title>
        
        <Row gutter={[16, 16]}>
          {/* Birim Tipi Dağılımı */}
          <Col xs={24} lg={12}>
            <Card title="Birim Satış Durumu">
              <Table
                dataSource={unitTypeData}
                columns={[
                  { title: 'Tip', dataIndex: 'type', key: 'type' },
                  { title: 'Birim No', dataIndex: 'unitNumber', key: 'unitNumber' },
                  { title: 'Oda Sayısı', dataIndex: 'roomCount', key: 'roomCount' },
                  {
                    title: 'Durum',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => (
                      <Tag color={status === 'Satıldı' ? 'red' : 'green'}>
                        {status}
                      </Tag>
                    ),
                  },
                ]}
                pagination={false}
                rowKey={(record) => record._id}
              />
            </Card>
          </Col>

          {/* Oda Sayısı Dağılımı */}
          <Col xs={24} lg={12}>
            <Card title="Satılan Dairelerin Oda Sayısı Dağılımı">
              {Array.isArray(roomCountData) && roomCountData.length > 0 ? (
                <Pie {...pieConfig} data={roomCountData.map(item => ({
                  type: item.type,
                  count: item.count,
                  value: item.count
                }))} />
              ) : (
                <Empty description="Henüz satılan daire bulunmamaktadır" />
              )}
            </Card>
          </Col>

          {/* Ödemeler */}
          <Col span={24}>
            <Card 
              title="Ödemeler" 
              extra={
                <RangePicker 
                  locale={locale}
                  value={dateRange}
                  onChange={setDateRange}
                />
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Title level={4}>Alınan Ödemeler</Title>
                  <Table 
                    dataSource={payments.receivedPayments}
                    columns={receivedColumns}
                    rowKey={(record) => `received-${record._id || `${record.customerName}-${record.paidDate}-${record.amount}`}`}
                  />
                </Col>
                <Col span={24}>
                  <Title level={4}>Beklenen Ödemeler</Title>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <RangePicker
                      locale={locale}
                      value={expectedPaymentDateRange}
                      onChange={setExpectedPaymentDateRange}
                      placeholder={['Vade başlangıç', 'Vade bitiş']}
                      format="DD.MM.YYYY"
                    />
                  </div>
                  <Table 
                    dataSource={filteredExpectedPayments}
                    columns={expectedColumns.filter(col => col.key !== 'status')} // Durum sütununu kaldır
                    rowKey={(record) => `expected-${record._id || `${record.customerName}-${record.dueDate}-${record.amount}`}`}
                  />
                </Col>
                
                <Col span={24}>
                  <Title level={4} style={{ color: '#ff4d4f' }}>Gecikmiş Ödemeler</Title>
                  <Table 
                    dataSource={overduePayments}
                    columns={[
                      { title: 'Müşteri', dataIndex: 'customerName', key: 'customerName' },
                      { title: 'Birim', dataIndex: 'blockInfo', key: 'blockInfo' },
                      { 
                        title: 'Tutar', 
                        dataIndex: 'amount', 
                        key: 'amount',
                        render: (amount) => `${amount.toLocaleString('tr-TR')} ₺`,
                        sorter: (a, b) => a.amount - b.amount
                      },
                      { 
                        title: 'Vade Tarihi', 
                        dataIndex: 'dueDate', 
                        key: 'dueDate',
                        render: (date) => dayjs(date).format('DD.MM.YYYY'),
                        sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix()
                      },
                      {
                        title: 'Gecikme (Gün)',
                        key: 'delayDays',
                        render: (_, record) => {
                          const dueDate = dayjs(record.dueDate);
                          const today = dayjs();
                          const days = today.diff(dueDate, 'day');
                          return <Tag color="red">{days} gün</Tag>;
                        },
                        sorter: (a, b) => {
                          const dueDateA = dayjs(a.dueDate);
                          const dueDateB = dayjs(b.dueDate);
                          const today = dayjs();
                          return today.diff(dueDateA, 'day') - today.diff(dueDateB, 'day');
                        }
                      }
                    ]}
                    rowKey={(record) => `overdue-${record._id || `${record.customerName}-${record.dueDate}-${record.amount}`}`}
                    rowClassName={() => 'overdue-row'}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
      <style jsx="true">{`
        .overdue-row {
          background-color: rgba(255, 77, 79, 0.05);
        }
        .overdue-row:hover td {
          background-color: rgba(255, 77, 79, 0.1) !important;
        }
        .ant-table-thead > tr > th {
          background-color: #fff;
        }
        .ant-table-tbody > tr.overdue-row:hover > td {
          background-color: rgba(255, 77, 79, 0.1) !important;
        }
      `}</style>
    </Spin>
  );
};

export default ProjectReports;
