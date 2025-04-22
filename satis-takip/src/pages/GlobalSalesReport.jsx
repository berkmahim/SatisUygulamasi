import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, DatePicker, Spin, Button, 
  Statistic, Tabs, Select, Table, Space, Alert, message, Empty 
} from 'antd';
import { 
  DownloadOutlined, FilePdfOutlined, FileExcelOutlined,
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

// dayjs Türkçe dil ayarı
dayjs.locale('tr');

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);
const BASE_URL = import.meta.env.VITE_API_URL;
const GlobalSalesReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'), 
    dayjs().endOf('month')
  ]);
  const [unitTypeData, setUnitTypeData] = useState([]);
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [paymentData, setPaymentData] = useState({
    received: 0,
    expected: 0,
    overdue: 0
  });
  const [paymentTableData, setPaymentTableData] = useState([]);

  // Para formatı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const [startDateObj, endDateObj] = dateRange;
      const formattedStartDate = startDateObj.format('YYYY-MM-DD');
      const formattedEndDate = endDateObj.format('YYYY-MM-DD');
      
      // Tüm rapor verilerini paralel olarak al
      const [
        unitTypeResponse,
        monthlySalesResponse,
        paymentResponse
      ] = await Promise.all([
        axios.get(`${BASE_URL}/api/reports/global/unit-types`, {
          params: { startDate: formattedStartDate, endDate: formattedEndDate }
        }),
        axios.get(`${BASE_URL}/api/reports/global/monthly-sales`, {
          params: { startDate: formattedStartDate, endDate: formattedEndDate }
        }),
        axios.get(`${BASE_URL}/api/reports/global/payments`, {
          params: { startDate: formattedStartDate, endDate: formattedEndDate }
        })
      ]);

      setUnitTypeData(unitTypeResponse.data);
      setMonthlySalesData(monthlySalesResponse.data);
      setPaymentData({
        received: paymentResponse.data.totalReceived,
        expected: paymentResponse.data.totalExpected,
        overdue: paymentResponse.data.totalOverdue
      });
      setPaymentTableData(paymentResponse.data.payments);
      
      setError(null);
    } catch (err) {
      setError('Rapor verileri alınırken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      console.error('Rapor verisi hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Oda sayısı dağılımı pasta grafiği verileri
  const unitTypeChartData = {
    labels: unitTypeData.map(item => item.type),
    datasets: [
      {
        data: unitTypeData.map(item => item.count),
        backgroundColor: [
          '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2',
          '#eb2f96', '#fa8c16', '#a0d911', '#fa541c'
        ]
      }
    ]
  };

  // Aylık satış grafiği verileri
  const monthlySalesChartData = {
    labels: monthlySalesData.map(item => dayjs(item.month).format('MMMM YYYY')),
    datasets: [
      {
        label: 'Aylık Satış Tutarı',
        data: monthlySalesData.map(item => item.amount),
        backgroundColor: 'rgba(24, 144, 255, 0.5)',
      }
    ]
  };

  // Ödeme tablosu sütunları
  const paymentColumns = [
    {
      title: 'Müşteri',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Proje',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'Blok/Birim',
      dataIndex: 'blockInfo',
      key: 'blockInfo',
    },
    {
      title: 'Ödeme Tarihi',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Tutar',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => formatCurrency(amount),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        let text = '';
        switch (status) {
          case 'paid':
            color = 'success';
            text = 'Ödendi';
            break;
          case 'pending':
            color = 'processing';
            text = 'Bekliyor';
            break;
          case 'overdue':
            color = 'error';
            text = 'Gecikti';
            break;
          default:
            color = 'default';
            text = status;
        }
        return <Text type={color}>{text}</Text>;
      },
    }
  ];

  // PDF raporu oluşturma
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const startDateStr = dateRange[0].format('DD.MM.YYYY');
      const endDateStr = dateRange[1].format('DD.MM.YYYY');
      
      // Başlık
      doc.setFontSize(18);
      doc.text('Satış Raporu', 14, 15);
      
      // Tarih aralığı
      doc.setFontSize(12);
      doc.text(`${startDateStr} - ${endDateStr} tarihleri arası`, 14, 25);
      
      // Ödeme istatistikleri
      doc.setFontSize(14);
      doc.text('Ödeme İstatistikleri', 14, 35);
      doc.setFontSize(10);
      doc.text(`Toplam Alınan Ödeme: ${formatCurrency(paymentData.received)}`, 14, 45);
      doc.text(`Beklenen Ödeme: ${formatCurrency(paymentData.expected)}`, 14, 52);
      doc.text(`Geciken Ödeme: ${formatCurrency(paymentData.overdue)}`, 14, 59);
      
      // Birim dağılımı tablosu
      doc.setFontSize(14);
      doc.text('Satılan Birim Dağılımı', 14, 69);
      
      const unitTypeTableData = unitTypeData.map((item) => [
        item.type,
        item.count,
      ]);
      
      doc.autoTable({
        startY: 75,
        head: [['Birim Tipi', 'Adet']],
        body: unitTypeTableData,
      });
      
      // Ödemeler tablosu
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Ödeme Detayları', 14, 15);
      
      const paymentTableRows = paymentTableData.map((payment) => [
        payment.customerName,
        payment.projectName,
        payment.blockInfo,
        dayjs(payment.dueDate).format('DD.MM.YYYY'),
        formatCurrency(payment.amount),
        payment.status === 'paid' ? 'Ödendi' : payment.status === 'pending' ? 'Bekliyor' : 'Gecikti'
      ]);
      
      doc.autoTable({
        startY: 25,
        head: [['Müşteri', 'Proje', 'Blok/Birim', 'Tarih', 'Tutar', 'Durum']],
        body: paymentTableRows,
      });
      
      doc.save(`Satis_Raporu_${startDateStr}-${endDateStr}.pdf`);
      message.success('PDF raporu başarıyla oluşturuldu');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      message.error('PDF raporu oluşturulurken bir hata oluştu');
    }
  };

  // Excel raporu oluşturma
  const generateExcel = () => {
    try {
      const startDateStr = dateRange[0].format('DD.MM.YYYY');
      const endDateStr = dateRange[1].format('DD.MM.YYYY');
      
      // Workbook oluştur
      const wb = XLSX.utils.book_new();
      
      // Ödeme istatistikleri sayfası
      const paymentStatsData = [
        ['Satış Raporu'],
        [`${startDateStr} - ${endDateStr} tarihleri arası`],
        [''],
        ['Ödeme İstatistikleri'],
        ['Toplam Alınan Ödeme', paymentData.received],
        ['Beklenen Ödeme', paymentData.expected],
        ['Geciken Ödeme', paymentData.overdue]
      ];
      
      const paymentStatsWS = XLSX.utils.aoa_to_sheet(paymentStatsData);
      XLSX.utils.book_append_sheet(wb, paymentStatsWS, 'Ödeme İstatistikleri');
      
      // Birim dağılımı sayfası
      const unitTypeHeaders = ['Birim Tipi', 'Adet'];
      const unitTypeRows = unitTypeData.map(item => [
        item.type,
        item.count
      ]);
      
      const unitTypeWS = XLSX.utils.aoa_to_sheet([unitTypeHeaders, ...unitTypeRows]);
      XLSX.utils.book_append_sheet(wb, unitTypeWS, 'Birim Dağılımı');
      
      // Ödeme detayları sayfası
      const paymentHeaders = ['Müşteri', 'Proje', 'Blok/Birim', 'Tarih', 'Tutar', 'Durum'];
      const paymentRows = paymentTableData.map(payment => [
        payment.customerName,
        payment.projectName,
        payment.blockInfo,
        dayjs(payment.dueDate).format('DD.MM.YYYY'),
        payment.amount,
        payment.status === 'paid' ? 'Ödendi' : payment.status === 'pending' ? 'Bekliyor' : 'Gecikti'
      ]);
      
      const paymentWS = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows]);
      XLSX.utils.book_append_sheet(wb, paymentWS, 'Ödeme Detayları');
      
      // Excel dosyasını indir
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(fileData, `Satis_Raporu_${startDateStr}-${endDateStr}.xlsx`);
      
      message.success('Excel raporu başarıyla oluşturuldu');
    } catch (error) {
      console.error('Excel oluşturma hatası:', error);
      message.error('Excel raporu oluşturulurken bir hata oluştu');
    }
  };

  if (error) {
    return (
      <Alert
        message="Hata"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col>
          <Title level={2}>Genel Satış Raporu</Title>
        </Col>
        <Col>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD.MM.YYYY"
              placeholder={['Başlangıç', 'Bitiş']}
            />
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />} 
              onClick={generatePDF}
              disabled={loading}
            >
              PDF İndir
            </Button>
            <Button 
              type="primary" 
              icon={<FileExcelOutlined />} 
              onClick={generateExcel}
              disabled={loading}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Excel İndir
            </Button>
          </Space>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* İstatistik Kartları */}
          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Alınan Ödemeler"
                  value={paymentData.received}
                  precision={2}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Beklenen Ödemeler"
                  value={paymentData.expected}
                  precision={2}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Geciken Ödemeler"
                  value={paymentData.overdue}
                  precision={2}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                />
              </Card>
            </Col>
          </Row>

          {/* Grafikler */}
          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col xs={24} md={12}>
              <Card title="Satılan Birim Dağılımı">
                {unitTypeData.length > 0 ? (
                  <Pie 
                    data={unitTypeChartData} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                ) : (
                  <Empty description="Bu tarih aralığında veri bulunamadı" />
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Aylık Satış Tutarları">
                {monthlySalesData.length > 0 ? (
                  <Bar 
                    data={monthlySalesChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      }
                    }}
                  />
                ) : (
                  <Empty description="Bu tarih aralığında veri bulunamadı" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Ödeme Tablosu */}
          <Card title="Ödeme Detayları" style={{ marginTop: 20 }}>
            <Table
              columns={paymentColumns}
              dataSource={paymentTableData}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default GlobalSalesReport;
