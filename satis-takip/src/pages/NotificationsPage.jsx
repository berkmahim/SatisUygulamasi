import React, { useState, useEffect } from 'react';
import { List, Card, Button, Typography, Space, Badge, Spin, message } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/notifications?page=${pageNumber}&limit=10`);
      setNotifications(data.notifications);
      setTotal(data.total);
      setPage(pageNumber);
    } catch (error) {
      message.error('Bildirimler alınamadı');
      console.error('Bildirimler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      await axios.put(`/api/notifications/${notification._id}/read`);
      
      // İlgili sayfaya yönlendir
      if (notification.type === 'PAYMENT_OVERDUE' && notification.relatedData?.customerId) {
        // Müşteri ID'si varsa ve geçerliyse müşteri sayfasına yönlendir
        navigate(`/customers/${notification.relatedData.customerId}`);
      } else {
        // Müşteri bilgisi yoksa veya geçersizse bildirimleri güncelle ama yönlendirme yapma
        message.info('İlgili müşteri bilgisi bulunamadı');
      }
      
      // Bildirimi güncelle
      fetchNotifications(page);
    } catch (error) {
      message.error('Bildirim işaretlenemedi');
      console.error('Bildirim işaretlenemedi:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      message.success('Tüm bildirimler okundu olarak işaretlendi');
      fetchNotifications(page);
    } catch (error) {
      message.error('Bildirimler işaretlenemedi');
      console.error('Bildirimler işaretlenemedi:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Bildirimler</Title>
          <Button type="primary" onClick={handleMarkAllAsRead}>
            Tümünü Okundu İşaretle
          </Button>
        </div>

        <Card>
          <Spin spinning={loading}>
            <List
              dataSource={notifications}
              pagination={{
                onChange: fetchNotifications,
                total: total,
                pageSize: 10,
                current: page
              }}
              renderItem={notification => (
                <List.Item 
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {!notification.read && (
                          <Badge status="processing" />
                        )}
                        <Text strong={!notification.read}>
                          {notification.title}
                        </Text>
                      </Space>
                    }
                    description={
                      <>
                        <div>{notification.message}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Spin>
        </Card>
      </Space>
    </div>
  );
};

export default NotificationsPage;
