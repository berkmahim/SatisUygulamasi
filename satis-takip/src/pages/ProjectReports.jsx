import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Row, Col, Card, Table, DatePicker, Typography,
  Statistic, Tag, Spin, Empty, Divider, message, Button, Space, Collapse
} from 'antd';
import { Pie } from '@ant-design/plots';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import locale from 'antd/es/date-picker/locale/tr_TR';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const BASE_URL = import.meta.env.VITE_API_URL;
const ProjectReports = () => {
  const { id: projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [unitTypeData, setUnitTypeData] = useState(null);
  const [roomCountData, setRoomCountData] = useState(null);
  const [referenceDistributionData, setReferenceDistributionData] = useState(null);
  const [payments, setPayments] = useState({ receivedPayments: [], expectedPayments: [] });
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [expectedPaymentDateRange, setExpectedPaymentDateRange] = useState([null, null]);
  const [filteredExpectedPayments, setFilteredExpectedPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [projectInfo, setProjectInfo] = useState({ name: '' });
  const [totals, setTotals] = useState({
    received: 0,
    expected: 0,
    overdue: 0
  });
  const [unitStatusCollapsed, setUnitStatusCollapsed] = useState(false);

  // Birim tipi ve oda sayısı dağılımını al
  const fetchUnitTypeDistribution = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/reports/projects/${projectId}/unit-types`);
      
      
      setUnitTypeData(data.unitStatus);
      setRoomCountData(data.roomCounts);
      setReferenceDistributionData(data.referenceDistribution);
    } catch (error) {
      message.error('Birim tipi dağılımı alınamadı');
      console.error(error);
    }
  };

  // Ödemeleri al
  const fetchPayments = async () => {
    try {
      if (!dateRange || !dateRange[0] || !dateRange[1]) return;
      
      console.log('Ödeme verileri alınıyor...', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      });
      
      const { data } = await axios.get(`${BASE_URL}/api/reports/projects/${projectId}/payments`, {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }
      });
      
      console.log('Alınan ödeme verileri:', data);
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
      const { data } = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
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

  // Tarih aralığı değiştiğinde ödemeleri yeniden getir
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      console.log('Tarih aralığı değişti, ödemeler yeniden alınıyor');
      fetchPayments();
    }
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
    
    console.log('Filtrelenmiş beklenen ödemeler:', filtered);
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

  // Pasta grafik konfigürasyonu
  const renderPieChart = (data, angleField = 'value', colorField = 'type') => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return <Empty description="Veri yok" />;
    }

    // Filter out any invalid data entries
    const validData = data.filter(item => item && typeof item === 'object' && item[angleField] != null && item[colorField] != null);
    
    if (validData.length === 0) {
      return <Empty description="Veri yok" />;
    }

    return (
      <Pie
        data={validData}
        angleField={angleField}
        colorField={colorField}
        radius={0.8}
        label={{
          type: 'inner',
          offset: '-30%',
          formatter: (datum) => {
            // Safety check for datum and the required field
            if (!datum || datum[angleField] == null) {
              return '';
            }
            return `${datum[angleField]}`;
          },
          style: {
            fontSize: 14,
            textAlign: 'center',
          },
        }}
        legend={{
          position: 'bottom',
        }}
      />
    );
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
      render: (amount) => amount ? `${amount.toLocaleString('tr-TR')} ₺` : '0,00 ₺'
    },
    { 
      title: 'Ödenen', 
      dataIndex: 'paidAmount', 
      key: 'paidAmount',
      render: (amount) => amount ? `${amount.toLocaleString('tr-TR')} ₺` : '0,00 ₺'
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
      render: (amount) => amount ? `${amount.toLocaleString('tr-TR')} ₺` : '0,00 ₺'
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

  // Oda sayısı dağılımı tablosu için kolonlar
  const roomCountColumns = [
    { title: 'Oda Sayısı', dataIndex: 'type', key: 'type' },
    { title: 'Satılan Adet', dataIndex: 'count', key: 'count' }
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
          'Satılan Adet': item.count
        };
      }
      else if (type === 'referenceDistribution') {
        newItem = {
          'Referans': item.type,
          'Satılan Adet': item.count
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
    // Veriyi dışa aktarım için hazırla
    const exportData = prepareDataForExport(data, type);
    
    // Doküman oluştur - Türkçe karakter desteği için Unicode seçildi
    const doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });
    
    // Metin kodlama ayarları
    doc.setLanguage("tr");
    
    // Başlık ekle - ASCII olmayan karakterler yerine alternatif metin kullanılabilir
    const safeProjectName = projectInfo.name ? projectInfo.name : '';
    doc.setFontSize(16);
    
    // Başlık için direkt encoding sorununu aşmak için ASCII karakterlerini kullan
    doc.text(`${safeProjectName} - ${fileName.replace(/_/g, ' ')}`, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    // Tarih ekle - Sabit ASCII metni
    doc.setFontSize(10);
    doc.text(`Olusturulma Tarihi: ${dayjs().format('DD.MM.YYYY')}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    
    // Tablo için veri hazırla
    const tableColumn = Object.keys(exportData[0] || {});
    const tableRows = exportData.map(item => {
      return tableColumn.map(key => {
        // Türkçe karakterlerin dönüştürülmesi
        return (item[key] || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      });
    });
    
    // AutoTable oluştur
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Dosya adına proje adını ekle
    const safeProjectNameForFile = projectInfo.name ? `${projectInfo.name.replace(/[^a-z0-9]/gi, '_')}_` : '';
    doc.save(`${safeProjectNameForFile}${fileName}_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    message.success('PDF dosyası başarıyla indirildi');
  };
  
  // Tablolara ek birim detayları eklemek için useEffect
  useEffect(() => {
    if (payments.receivedPayments && payments.receivedPayments.length) {
      console.log('Örnek ödeme verisi:', payments.receivedPayments[0]);
    }
  }, [payments]);

  // Toplam miktarları hesapla
  const calculateTotals = () => {
    // Alınan ödemelerin toplamı
    const receivedTotal = payments.receivedPayments.reduce((sum, payment) => {
      return sum + (payment.paidAmount || 0);
    }, 0);
    
    // Beklenen ödemelerin toplamı (filtrelenmiş)
    const expectedTotal = filteredExpectedPayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);
    
    // Gecikmiş ödemelerin toplamı
    const overdueTotal = overduePayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);
    
    setTotals({
      received: receivedTotal,
      expected: expectedTotal,
      overdue: overdueTotal
    });
    
    console.log('Toplam tutarlar hesaplandı:', {
      receivedTotal,
      expectedTotal,
      overdueTotal
    });
  };
  
  // Ödemelerin veya filtrelerin değişimi ile toplam tutarları yeniden hesapla
  useEffect(() => {
    calculateTotals();
  }, [payments.receivedPayments, filteredExpectedPayments, overduePayments]);

  // Boş veri kontrolü için güvenlik fonksiyonu
  const safeData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [{ type: 'Veri Yok', count: 0 }];
    }
    return data;
  };

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '12px 24px' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>Proje Raporları</Title>
        
        <Row gutter={[16, 16]}>
          {/* Birim Tipi Dağılımı */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12}>
            <Card 
              title="Birim Satış Durumu"
              extra={
                <Space wrap>
                  <Button 
                    type="text"
                    icon={unitStatusCollapsed ? <DownOutlined /> : <UpOutlined />}
                    onClick={() => setUnitStatusCollapsed(!unitStatusCollapsed)}
                    style={{ border: 'none' }}
                  />
                  <Button 
                    icon={<FileExcelOutlined />} 
                    onClick={() => exportToExcel(unitTypeData || [], 'Birim_Satis_Durumu', 'unitType')}
                    disabled={!unitTypeData || unitTypeData.length === 0}
                    size="small"
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
                    size="small"
                  >
                    PDF
                  </Button>
                </Space>
              }
            >
              {!unitStatusCollapsed && (
                <Table
                  dataSource={unitTypeData}
                  scroll={{ x: 600 }}
                  size="small"
                  columns={[
                    { 
                      title: 'Tip', 
                      dataIndex: 'type', 
                      key: 'type',
                      sorter: (a, b) => (a.type || '').localeCompare(b.type || '', 'tr', { numeric: true })
                    },
                    { 
                      title: 'Birim No', 
                      dataIndex: 'unitNumber', 
                      key: 'unitNumber',
                      sorter: (a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || '', 'tr', { numeric: true })
                    },
                    { 
                      title: 'Oda Sayısı', 
                      dataIndex: 'roomCount', 
                      key: 'roomCount',
                      sorter: (a, b) => {
                        const aRoom = a.roomCount || '';
                        const bRoom = b.roomCount || '';
                        // Handle numeric and non-numeric room counts
                        if (aRoom === bRoom) return 0;
                        if (aRoom === '') return 1;
                        if (bRoom === '') return -1;
                        if (aRoom === 'Belirtilmemiş') return 1;
                        if (bRoom === 'Belirtilmemiş') return -1;
                        if (aRoom === '-') return 1;
                        if (bRoom === '-') return -1;
                        // Try numeric comparison first
                        const aNum = parseInt(aRoom);
                        const bNum = parseInt(bRoom);
                        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                        return aRoom.localeCompare(bRoom, 'tr', { numeric: true });
                      }
                    },
                    {
                      title: 'Durum',
                      dataIndex: 'status',
                      key: 'status',
                      sorter: (a, b) => {
                        const statusOrder = { 'Müsait': 0, 'Satıldı': 1 };
                        const aStatus = a.status || 'Müsait';
                        const bStatus = b.status || 'Müsait';
                        return (statusOrder[aStatus] || 0) - (statusOrder[bStatus] || 0);
                      },
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
              )}
              {unitStatusCollapsed && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100px',
                  backgroundColor: '#f0f2f5',
                  color: '#8c8c8c',
                  fontSize: '14px'
                }}>
                  Tablo Kapatıldı
                </div>
              )}
            </Card>
          </Col>

          {/* Oda Sayısı Dağılımı */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12}>
            <Card 
              title="Satılan Birimlerin Dağılımı"
              extra={
                <Space wrap>
                  <Button 
                    icon={<FileExcelOutlined />} 
                    onClick={() => exportToExcel(roomCountData || [], 'Birim_Dagilimi', 'roomCount')}
                    disabled={!roomCountData || roomCountData.length === 0}
                    size="small"
                  >
                    Excel
                  </Button>
                  <Button 
                    icon={<FilePdfOutlined />}
                    onClick={() => exportToPDF(
                      roomCountData || [], 
                      'Birim_Dagilimi',
                      'roomCount'
                    )}
                    disabled={!roomCountData || roomCountData.length === 0}
                    size="small"
                  >
                    PDF
                  </Button>
                </Space>
              }
            >
              {Array.isArray(roomCountData) && roomCountData.length > 0 ? (
                <>
                  <Table 
                    dataSource={roomCountData}
                    columns={roomCountColumns}
                    pagination={false}
                    rowKey={(record) => record.type}
                    size="small"
                    scroll={{ x: 300 }}
                    style={{ marginBottom: 20 }}
                  />
                  <Spin spinning={loading}>
                    {roomCountData && roomCountData.length > 0 ? (
                      renderPieChart(
                        roomCountData.map(item => ({
                          type: item.type,
                          value: item.count
                        })),
                        'value',
                        'type'
                      )
                    ) : (
                      <Empty description="Veri yok" />
                    )}
                  </Spin>
                </>
              ) : (
                <Empty description="Henüz satılan daire bulunmamaktadır" />
              )}
            </Card>
          </Col>

          {/* Referans Dağılımı */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12}>
            <Card 
              title="Satılan Birimlerin Referans Dağılımı"
              extra={
                <Space wrap>
                  <Button 
                    icon={<FileExcelOutlined />} 
                    onClick={() => exportToExcel(referenceDistributionData || [], 'Referans_Dagilimi', 'referenceDistribution')}
                    disabled={!referenceDistributionData || referenceDistributionData.length === 0}
                    size="small"
                  >
                    Excel
                  </Button>
                  <Button 
                    icon={<FilePdfOutlined />}
                    onClick={() => exportToPDF(
                      referenceDistributionData || [], 
                      'Referans_Dagilimi',
                      'referenceDistribution'
                    )}
                    disabled={!referenceDistributionData || referenceDistributionData.length === 0}
                    size="small"
                  >
                    PDF
                  </Button>
                </Space>
              }
            >
              {Array.isArray(referenceDistributionData) && referenceDistributionData.length > 0 ? (
                <>
                  <Table 
                    dataSource={referenceDistributionData}
                    columns={[
                      { title: 'Referans', dataIndex: 'type', key: 'type' },
                      { title: 'Satılan Adet', dataIndex: 'count', key: 'count' }
                    ]}
                    pagination={false}
                    rowKey={(record) => record.type}
                    size="small"
                    scroll={{ x: 300 }}
                    style={{ marginBottom: 20 }}
                  />
                  <Spin spinning={loading}>
                    {referenceDistributionData && referenceDistributionData.length > 0 ? (
                      renderPieChart(
                        referenceDistributionData.map(item => ({
                          type: item.type,
                          value: item.count
                        })),
                        'value',
                        'type'
                      )
                    ) : (
                      <Empty description="Veri yok" />
                    )}
                  </Spin>
                </>
              ) : (
                <Empty description="Henüz referansla satılan birim bulunmamaktadır" />
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
                  onChange={(dates) => {
                    console.log('Ana tarih filtresi değişti:', dates);
                    setDateRange(dates);
                  }}
                  format="DD.MM.YYYY"
                  size="small"
                />
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <Title level={4} style={{ margin: 0, flex: '1', minWidth: '200px' }}>Alınan Ödemeler</Title>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <Statistic 
                        title="Toplam Alınan" 
                        value={totals.received} 
                        precision={2} 
                        suffix="₺" 
                        valueStyle={{ color: '#3f8600' }}
                      />
                      <Space wrap>
                        <Button 
                          icon={<FileExcelOutlined />} 
                          onClick={() => exportToExcel(
                            payments.receivedPayments, 
                            'Alinan_Odemeler',
                            'received'
                          )}
                          disabled={!payments.receivedPayments || payments.receivedPayments.length === 0}
                          size="small"
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
                          size="small"
                        >
                          PDF
                        </Button>
                      </Space>
                    </div>
                  </div>
                  <Table 
                    dataSource={payments.receivedPayments}
                    columns={receivedColumns}
                    rowKey={(record) => `received-${record._id || `${record.customerName}-${record.paidDate}-${record.amount}`}`}
                    scroll={{ x: 800 }}
                    size="small"
                    summary={pageData => {
                      let totalPaid = 0;
                      pageData.forEach(({ paidAmount }) => {
                        totalPaid += paidAmount || 0;
                      });
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3}>
                            <strong>Toplam</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <strong>{totalPaid.toLocaleString('tr-TR')} ₺</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} colSpan={1}></Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Col>
                <Col span={24}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <Title level={4} style={{ margin: 0, flex: '1', minWidth: '200px' }}>Beklenen Ödemeler</Title>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <Statistic 
                        title="Toplam Beklenen" 
                        value={totals.expected} 
                        precision={2} 
                        suffix="₺" 
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <Space wrap>
                        <Button 
                          icon={<FileExcelOutlined />} 
                          onClick={() => exportToExcel(
                            filteredExpectedPayments, 
                            'Beklenen_Odemeler',
                            'expected'
                          )}
                          disabled={!filteredExpectedPayments || filteredExpectedPayments.length === 0}
                          size="small"
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
                          size="small"
                        >
                          PDF
                        </Button>
                      </Space>
                    </div>
                  </div>
                  <div style={{ 
                    marginBottom: '16px', 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap'
                  }}>
                    <RangePicker
                      locale={locale}
                      value={expectedPaymentDateRange}
                      onChange={(dates) => {
                        console.log('Beklenen ödemeler için tarih filtresi değişti:', dates);
                        setExpectedPaymentDateRange(dates);
                      }}
                      placeholder={['Vade başlangıç', 'Vade bitiş']}
                      format="DD.MM.YYYY"
                      size="small"
                    />
                  </div>
                  <Table 
                    dataSource={filteredExpectedPayments}
                    columns={expectedColumns.filter(col => col.key !== 'status')} // Durum sütununu kaldır
                    rowKey={(record) => `expected-${record._id || `${record.customerName}-${record.dueDate}-${record.amount}`}`}
                    scroll={{ x: 700 }}
                    size="small"
                    summary={pageData => {
                      let totalExpected = 0;
                      pageData.forEach(({ amount }) => {
                        totalExpected += amount || 0;
                      });
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={2}>
                            <strong>Toplam</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <strong>{totalExpected.toLocaleString('tr-TR')} ₺</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} colSpan={1}></Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Col>

                <Col span={24}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <Title level={4} style={{ margin: 0, color: '#ff4d4f', flex: '1', minWidth: '200px' }}>Gecikmiş Ödemeler</Title>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <Statistic 
                        title="Toplam Gecikmiş" 
                        value={totals.overdue} 
                        precision={2} 
                        suffix="₺" 
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                      <Space wrap>
                        <Button 
                          icon={<FileExcelOutlined />} 
                          onClick={() => exportToExcel(
                            overduePayments, 
                            'Gecikmis_Odemeler',
                            'overdue'
                          )}
                          disabled={!overduePayments || overduePayments.length === 0}
                          style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                          size="small"
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
                          size="small"
                        >
                          PDF
                        </Button>
                      </Space>
                    </div>
                  </div>
                  <Table 
                    dataSource={overduePayments}
                    scroll={{ x: 800 }}
                    size="small"
                    columns={[
                      { title: 'Müşteri', dataIndex: 'customerName', key: 'customerName' },
                      { title: 'Birim', dataIndex: 'blockNumber', key: 'blockNumber' },
                      { 
                        title: 'Tutar', 
                        dataIndex: 'amount', 
                        key: 'amount',
                        render: (amount) => amount ? `${amount.toLocaleString('tr-TR')} ₺` : '0,00 ₺',
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
                    summary={pageData => {
                      let totalOverdue = 0;
                      pageData.forEach(({ amount }) => {
                        totalOverdue += amount || 0;
                      });
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={2}>
                            <strong>Toplam</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <strong>{totalOverdue.toLocaleString('tr-TR')} ₺</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
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
