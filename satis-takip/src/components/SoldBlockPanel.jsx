import React, { useState, useEffect } from 'react';
import { Drawer, Card, Descriptions, Badge, Button, Spin, Alert, Tag, Space, Tooltip } from 'antd';
import { CloseOutlined, UserOutlined, HomeOutlined, CreditCardOutlined, DollarOutlined, WhatsAppOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getBlockById } from '../services/blockService';
import { getSaleByBlockId } from '../services/saleService';

const SoldBlockPanel = ({ visible, onClose, blockId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [blockData, setBlockData] = useState(null);
  const [saleData, setSaleData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && blockId) {
      fetchBlockDetails();
    }
  }, [visible, blockId]);

  const fetchBlockDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch block details
      const block = await getBlockById(blockId);
      setBlockData(block);

      // Fetch sale information
      const sale = await getSaleByBlockId(blockId);
      setSaleData(sale);
    } catch (err) {
      console.error('Error fetching block details:', err);
      setError('Blok detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getNextPayment = () => {
    if (!saleData || !saleData.payments) return null;
    
    // Find overdue payments first
    const overduePayments = saleData.payments
      .filter(payment => payment.status === 'overdue')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    if (overduePayments.length > 0) {
      return { ...overduePayments[0], isOverdue: true };
    }

    // Find next pending payment
    const pendingPayments = saleData.payments
      .filter(payment => payment.status === 'pending')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    if (pendingPayments.length > 0) {
      return { ...pendingPayments[0], isOverdue: false };
    }

    return null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('tr-TR');
  };

  const handlePaymentCollection = () => {
    if (saleData && saleData._id) {
      navigate(`/sales/${saleData._id}/payments`);
      onClose(); // Close the panel after navigation
    }
  };

  const handleWhatsAppClick = (phoneNumber) => {
    if (!phoneNumber) return;
    
    // Clean phone number (remove spaces, dashes, parentheses)
    let cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If phone starts with 0, replace with +90 (Turkey country code)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+90' + cleanPhone.substring(1);
    }
    // If phone doesn't start with +, assume it's Turkish and add +90
    else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+90' + cleanPhone;
    }
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = (email) => {
    if (!email) return;
    
    // Create mailto URL
    const mailtoUrl = `mailto:${email}`;
    
    // Open default email client
    window.location.href = mailtoUrl;
  };

  const nextPayment = getNextPayment();

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HomeOutlined />
          Satılan Birim Detayları
        </div>
      }
      placement="right"
      width={400}
      onClose={onClose}
      open={visible}
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
        />
      }
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Alert
          message="Hata"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {!loading && !error && blockData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Block Details */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HomeOutlined />
                Birim Bilgileri
              </div>
            }
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Birim No">
                {blockData.unitNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tip">
                <Tag color={blockData.type === 'apartment' ? 'blue' : 'green'}>
                  {blockData.type === 'apartment' ? 'Daire' : 'Dükkan'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Metrekare">
                {blockData.squareMeters ? `${blockData.squareMeters} m²` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Oda Sayısı">
                {blockData.roomCount || '-'}
              </Descriptions.Item>
             {/* <Descriptions.Item label="Boyutlar">
                {blockData.dimensions ? 
                  `${blockData.dimensions.width} × ${blockData.dimensions.depth} × ${blockData.dimensions.height}` 
                  : '-'
                } 
              </Descriptions.Item> */}
              <Descriptions.Item label="Referans">
                {blockData.reference?.name || 'Referanssız'}
              </Descriptions.Item>
              <Descriptions.Item label="İskan Ödemesi">
                <Badge 
                  status={blockData.iskanPaymentDone ? 'success' : 'error'} 
                  text={blockData.iskanPaymentDone ? 'Tamamlandı' : 'Bekleniyor'} 
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Customer Details - Show for both individual and bulk sales */}
          {saleData && saleData.customerId && (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserOutlined />
                  Müşteri Bilgileri
                </div>
              }
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Ad Soyad">
                  {`${saleData.customerId.firstName} ${saleData.customerId.lastName}`}
                </Descriptions.Item>
                <Descriptions.Item label="TC No">
                  {saleData.customerId.tcNo || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Telefon">
                  {saleData.customerId.phone ? (
                    <Space>
                      <span>{saleData.customerId.phone}</span>
                      <Tooltip title="WhatsApp ile mesaj gönder">
                        <Button
                          type="text"
                          icon={<WhatsAppOutlined />}
                          size="small"
                          style={{ 
                            color: '#25D366', 
                            padding: '0 4px',
                            height: '20px',
                            minWidth: '20px'
                          }}
                          onClick={() => handleWhatsAppClick(saleData.customerId.phone)}
                        />
                      </Tooltip>
                    </Space>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="E-posta">
                  {saleData.customerId.email ? (
                    <Space>
                      <span>{saleData.customerId.email}</span>
                      <Tooltip title="E-posta gönder">
                        <Button
                          type="text"
                          icon={<MailOutlined />}
                          size="small"
                          style={{ 
                            color: '#1890ff', 
                            padding: '0 4px',
                            height: '20px',
                            minWidth: '20px'
                          }}
                          onClick={() => handleEmailClick(saleData.customerId.email)}
                        />
                      </Tooltip>
                    </Space>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Satış Tarihi">
                  {formatDate(saleData.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Toplam Tutar">
                  {formatCurrency(saleData.totalAmount)}
                </Descriptions.Item>
                {/* Show bulk sale specific information */}
                {saleData.isBulkSale && (
                  <>
                    <Descriptions.Item label="Satış Tipi">
                      <Tag color="purple">Toplu Satış</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Toplam Birim Sayısı">
                      {saleData.bulkSaleBlocks?.length || saleData.blockIds?.length || 0} birim
                    </Descriptions.Item>
                    <Descriptions.Item label="Bulk ID">
                      {saleData.bulkSaleId?.slice(-8) || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tüm Birimler">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {saleData.blockIds?.map((block, index) => (
                          <Tag key={index} color="blue" size="small">
                            {block.unitNumber}
                          </Tag>
                        ))}
                      </div>
                    </Descriptions.Item>
                  </>
                )}
                {/* Show individual sale specific information */}
                {!saleData.isBulkSale && (
                  <Descriptions.Item label="Satış Tipi">
                    <Tag color="green">Tekil Satış</Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Ödeme Durumu">
                  <Tag color={
                    saleData.paymentStatus === 'completed' ? 'success' :
                    saleData.paymentStatus === 'overdue' ? 'error' :
                    saleData.paymentStatus === 'in_progress' ? 'processing' : 'default'
                  }>
                    {
                      saleData.paymentStatus === 'completed' ? 'Tamamlandı' :
                      saleData.paymentStatus === 'overdue' ? 'Gecikmiş' :
                      saleData.paymentStatus === 'in_progress' ? 'Devam Ediyor' :
                      saleData.paymentStatus === 'not_started' ? 'Başlamadı' :
                      'Beklemede'
                    }
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Next Payment - Works for both individual and bulk sales */}
          {nextPayment && (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCardOutlined />
                  {nextPayment.isOverdue ? 'Geciken Ödeme' : 'Sonraki Ödeme'}
                </div>
              }
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vade Tarihi">
                  <span style={{ color: nextPayment.isOverdue ? '#ff4d4f' : 'inherit' }}>
                    {formatDate(nextPayment.dueDate)}
                    {nextPayment.isOverdue && ' (GECİKMİŞ)'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Tutar">
                  {formatCurrency(nextPayment.amount)}
                </Descriptions.Item>
                <Descriptions.Item label="Ödenen">
                  {formatCurrency(nextPayment.paidAmount || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Kalan">
                  <span style={{ 
                    fontWeight: 'bold',
                    color: nextPayment.isOverdue ? '#ff4d4f' : '#1890ff'
                  }}>
                    {formatCurrency((nextPayment.amount || 0) - (nextPayment.paidAmount || 0))}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Durum">
                  <Badge
                    status={nextPayment.isOverdue ? 'error' : 'processing'}
                    text={nextPayment.isOverdue ? 'Gecikmiş' : 'Beklemede'}
                  />
                </Descriptions.Item>
              </Descriptions>
              
              {/* Payment Collection Button for Overdue Payments */}
              {nextPayment.isOverdue && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button
                    type="primary"
                    danger
                    icon={<DollarOutlined />}
                    onClick={handlePaymentCollection}
                    size="large"
                    style={{ width: '100%' }}
                  >
                    Ödeme Tahsil Et
                  </Button>
                </div>
              )}
            </Card>
          )}

          {!nextPayment && saleData && (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCardOutlined />
                  Ödeme Durumu
                </div>
              }
              size="small"
            >
              <Alert
                message="Tüm ödemeler tamamlandı"
                type="success"
                showIcon
              />
            </Card>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default SoldBlockPanel;