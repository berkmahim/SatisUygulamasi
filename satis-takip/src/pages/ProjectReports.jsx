import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, DatePicker, Table, Typography, Spin, message, Tag, Empty, Button, Space } from 'antd';
import { Pie } from '@ant-design/plots';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import locale from 'antd/es/date-picker/locale/tr_TR';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const [projectInfo, setProjectInfo] = useState({ name: '' });

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

  // Proje bilgilerini al
  const fetchProjectInfo = async () => {
    try {
      const { data } = await axios.get(`/api/projects/${projectId}`);
      setProjectInfo(data);
    } catch (error) {
      console.error('Proje bilgileri alınamadı:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        await Promise.all([
          fetchProjectInfo(),
          fetchUnitTypeDistribution(),
          fetchPayments()
        ]);
        
        // API yanıtını konsola yazdır (debug için)
        console.log('API Yanıtı:', payments);
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
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
    { 
      title: 'Birim', 
      key: 'unitInfo',
      render: (_, record) => {
        if (record.unitNumber) {
          return record.unitNumber;
        } else if (record.blockNumber) {
          return record.blockNumber;
        } else if (record.blockInfo) {
          return record.blockInfo;
        }
        return <Tag color="blue">Birim Bilgisi Ekleyin</Tag>;
      }
    },
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
    { 
      title: 'Birim', 
      key: 'unitInfo',
      render: (_, record) => {
        if (record.unitNumber) {
          return record.unitNumber;
        } else if (record.blockNumber) {
          return record.blockNumber;
        } else if (record.blockInfo) {
          return record.blockInfo;
        }
        return <Tag color="blue">Birim Bilgisi Ekleyin</Tag>;
      }
    },
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

  // Özel veri formatları için hazırlık
  const prepareDataForExport = (data, type) => {
    return data.map(item => {
      let newItem = {};
      
      // Birim bilgisi fonksiyonu
      const getUnitInfo = (item) => {
        if (item.unitNumber) {
          return item.unitNumber;
        } else if (item.blockNumber) {
          return item.blockNumber;
        } else if (item.blockInfo) {
          return item.blockInfo;
        }
        return 'Birim Bilgisi Eksik';
      };

      // Tüm tablolar için ortak alanlar
      if (type === 'unitType') {
        newItem = {
          'Tip': item.type,
          'Birim No': item.unitNumber,
          'Oda Sayısı': item.roomCount,
          'Durum': item.status
        };
      }
      else if (type === 'roomCount') {
        newItem = {
          'Oda Sayısı': item.type,
          'Adet': item.count
        };
      }
      // Beklenen ödemeler için
      else if (type === 'expected') {
        newItem = {
          'Müşteri': item.customerName,
          'Birim': getUnitInfo(item),
          'Tutar': item.amount ? `${item.amount.toLocaleString('tr-TR')} ₺` : '',
          'Vade Tarihi': item.dueDate ? dayjs(item.dueDate).format('DD.MM.YYYY') : ''
        };
      }
      // Gecikmiş ödemeler için
      else if (type === 'overdue') {
        const dueDate = dayjs(item.dueDate);
        const today = dayjs();
        
        newItem = {
          'Müşteri': item.customerName,
          'Birim': getUnitInfo(item),
          'Tutar': item.amount ? `${item.amount.toLocaleString('tr-TR')} ₺` : '',
          'Vade Tarihi': item.dueDate ? dayjs(item.dueDate).format('DD.MM.YYYY') : '',
          'Gecikme (Gün)': `${today.diff(dueDate, 'day')} gün`
        };
      }
      // Alınan ödemeler için
      else if (type === 'received') {
        newItem = {
          'Müşteri': item.customerName,
          'Birim': getUnitInfo(item),
          'Toplam Tutar': item.amount ? `${item.amount.toLocaleString('tr-TR')} ₺` : '',
          'Ödenen Tutar': item.paidAmount ? `${item.paidAmount.toLocaleString('tr-TR')} ₺` : '',
          'Ödeme Tarihi': item.paidDate ? dayjs(item.paidDate).format('DD.MM.YYYY') : '',
          'Açıklama': item.description || ''
        };
      }
      
      return newItem;
    });
  };

  // Excel dosyası oluşturma ve indirme
  const exportToExcel = (data, fileName, type) => {
    const exportData = prepareDataForExport(data, type);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");
    
    // Sütun genişliklerini ayarla
    const maxWidth = 20;
    const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));
    worksheet['!cols'] = colWidths;
    
    // Excel dosyasını oluştur
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Dosya adına proje adını ekle
    const safeProjectName = projectInfo.name ? `${projectInfo.name.replace(/[^a-z0-9]/gi, '_')}_` : '';
    saveAs(blob, `${safeProjectName}${fileName}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    
    message.success('Excel dosyası başarıyla indirildi');
  };

  // PDF dosyası oluşturma ve indirme
  const exportToPDF = (data, fileName, type) => {
    const exportData = prepareDataForExport(data, type);
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Başlık ve tarih ekle
    doc.setFontSize(18);
    doc.text(`${projectInfo.name ? projectInfo.name + ' - ' : ''}${fileName.replace(/_/g, ' ')}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Oluşturulma Tarihi: ${dayjs().format('DD.MM.YYYY')}`, 14, 30);
    
    // Tablo oluştur
    const tableColumn = Object.keys(exportData[0] || {});
    const tableRows = exportData.map(item => {
      return tableColumn.map(key => item[key] || '');
    });
    
    // AutoTable oluştur
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Dosya adına proje adını ekle
    const safeProjectName = projectInfo.name ? `${projectInfo.name.replace(/[^a-z0-9]/gi, '_')}_` : '';
    doc.save(`${safeProjectName}${fileName}_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    message.success('PDF dosyası başarıyla indirildi');
  };
  
  // Tablolara ek birim detayları eklemek için useEffect
  useEffect(() => {
    if (payments.receivedPayments && payments.receivedPayments.length) {
      console.log('Örnek ödeme verisi:', payments.receivedPayments[0]);
    }
  }, [payments]);

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Proje Raporları</Title>
        
        <Row gutter={[16, 16]}>
          {/* Birim Tipi Dağılımı */}
          <Col xs={24} lg={12}>
            <Card 
              title="Birim Satış Durumu"
              extra={
                <Space>
                  <Button 
                    icon={<FileExcelOutlined />} 
                    onClick={() => exportToExcel(unitTypeData || [], 'Birim_Satis_Durumu', 'unitType')}
                    disabled={!unitTypeData || unitTypeData.length === 0}
                  >
                    Excel
                  </Button>
                  <Button 
                    icon={<FilePdfOutlined />}
                    onClick={() => exportToPDF(
                      unitTypeData || [], 
                      'Birim_Satis_Durumu',
                      'unitType'
                    )}
                    disabled={!unitTypeData || unitTypeData.length === 0}
                  >
                    PDF
                  </Button>
                </Space>
              }
            >
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
            <Card 
              title="Satılan Dairelerin Oda Sayısı Dağılımı"
              extra={
                <Space>
                  <Button 
                    icon={<FileExcelOutlined />} 
                    onClick={() => exportToExcel(roomCountData || [], 'Oda_Sayisi_Dagilimi', 'roomCount')}
                    disabled={!roomCountData || roomCountData.length === 0}
                  >
                    Excel
                  </Button>
                  <Button 
                    icon={<FilePdfOutlined />}
                    onClick={() => exportToPDF(
                      roomCountData || [], 
                      'Oda_Sayisi_Dagilimi',
                      'roomCount'
                    )}
                    disabled={!roomCountData || roomCountData.length === 0}
                  >
                    PDF
                  </Button>
                </Space>
              }
            >
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
                  <Title level={4} style={{ display: 'inline-block', marginRight: '16px' }}>Alınan Ödemeler</Title>
                  <Space>
                    <Button 
                      icon={<FileExcelOutlined />} 
                      onClick={() => exportToExcel(
                        payments.receivedPayments, 
                        'Alinan_Odemeler',
                        'received'
                      )}
                      disabled={!payments.receivedPayments || payments.receivedPayments.length === 0}
                    >
                      Excel
                    </Button>
                    <Button 
                      icon={<FilePdfOutlined />}
                      onClick={() => exportToPDF(
                        payments.receivedPayments,
                        'Alinan_Odemeler',
                        'received'
                      )}
                      disabled={!payments.receivedPayments || payments.receivedPayments.length === 0}
                    >
                      PDF
                    </Button>
                  </Space>
                  <Table 
                    dataSource={payments.receivedPayments}
                    columns={receivedColumns}
                    rowKey={(record) => `received-${record._id || `${record.customerName}-${record.paidDate}-${record.amount}`}`}
                  />
                </Col>
                <Col span={24}>
                  <Title level={4} style={{ display: 'inline-block', marginRight: '16px' }}>Beklenen Ödemeler</Title>
                  <Space>
                    <Button 
                      icon={<FileExcelOutlined />} 
                      onClick={() => exportToExcel(
                        filteredExpectedPayments, 
                        'Beklenen_Odemeler',
                        'expected'
                      )}
                      disabled={!filteredExpectedPayments || filteredExpectedPayments.length === 0}
                    >
                      Excel
                    </Button>
                    <Button 
                      icon={<FilePdfOutlined />}
                      onClick={() => exportToPDF(
                        filteredExpectedPayments,
                        'Beklenen_Odemeler',
                        'expected'
                      )}
                      disabled={!filteredExpectedPayments || filteredExpectedPayments.length === 0}
                    >
                      PDF
                    </Button>
                  </Space>
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
                  <Title level={4} style={{ color: '#ff4d4f', display: 'inline-block', marginRight: '16px' }}>Gecikmiş Ödemeler</Title>
                  <Space>
                    <Button 
                      icon={<FileExcelOutlined />} 
                      onClick={() => exportToExcel(
                        overduePayments, 
                        'Gecikmis_Odemeler',
                        'overdue'
                      )}
                      disabled={!overduePayments || overduePayments.length === 0}
                      style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                    >
                      Excel
                    </Button>
                    <Button 
                      icon={<FilePdfOutlined />}
                      onClick={() => exportToPDF(
                        overduePayments,
                        'Gecikmis_Odemeler',
                        'overdue'
                      )}
                      disabled={!overduePayments || overduePayments.length === 0}
                      style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                    >
                      PDF
                    </Button>
                  </Space>
                  <Table 
                    dataSource={overduePayments}
                    columns={[
                      { title: 'Müşteri', dataIndex: 'customerName', key: 'customerName' },
                      { title: 'Birim', dataIndex: 'blockNumber', key: 'blockNumber' },
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
