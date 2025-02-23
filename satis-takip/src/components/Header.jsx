import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Drawer, Dropdown, Space, Avatar, Badge, Typography } from 'antd';

const { Text } = Typography;
import { 
  HomeOutlined, UserOutlined, ProjectOutlined, 
  BarChartOutlined, BulbOutlined, BulbFilled,
  MenuOutlined, LogoutOutlined, SettingOutlined,
  TeamOutlined, BellOutlined
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import logoImage from '../assets/Tadu_gold_Logo.png';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const { hasPermission } = useAuth();

  const allMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Ana Sayfa</Link>,
      permission: null // Ana sayfa için yetki gerekmez
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: <Link to="/customers">Müşteriler</Link>,
      permission: 'customerManagement'
    },
    
    {
      key: '/reports/sales',
      icon: <BarChartOutlined />,
      label: <Link to="/reports/sales">Raporlar</Link>,
      permission: 'reportManagement'
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: <Link to="/users">Kullanıcılar</Link>,
      permission: 'userManagement'
    }
  ];

  const menuItems = allMenuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/notifications?limit=5');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Bildirimler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Her 5 dakikada bir bildirimleri güncelle
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error('Bildirimler işaretlenemedi:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await axios.put(`/api/notifications/${notification._id}/read`);
      
      // İlgili sayfaya yönlendir
      if (notification.type === 'PAYMENT_OVERDUE') {
        navigate(`/customers/${notification.relatedData.customerId}`);
      }
      
      fetchNotifications();
    } catch (error) {
      console.error('Bildirim işaretlenemedi:', error);
    }
  };

  const notificationMenu = {
    items: [
      {
        key: 'header',
        label: (
          <div style={{ padding: '8px 0' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>Bildirimler</Text>
              <Button 
                type="link" 
                size="small"
                onClick={handleMarkAllAsRead}
                loading={loading}
              >
                Tümünü Okundu İşaretle
              </Button>
            </Space>
          </div>
        ),
        type: 'group'
      },
      ...(loading ? [{
        key: 'loading',
        label: (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            Bildirimler yükleniyor...
          </div>
        )
      }] : notifications.length === 0 ? [{
        key: 'empty',
        label: (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            Bildirim bulunmuyor
          </div>
        )
      }] : notifications.map(notification => ({
        key: notification._id,
        label: (
          <div 
            style={{ maxWidth: 300, padding: '8px 0', cursor: 'pointer' }} 
            onClick={() => handleNotificationClick(notification)}
          >
            <div style={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
              {notification.title}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              {notification.message}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.45)', marginTop: 4 }}>
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: tr
              })}
            </div>
          </div>
        )
      }))),
      {
        key: 'footer',
        label: (
          <Button type="link" block>
            Tüm Bildirimleri Gör
          </Button>
        ),
        type: 'group'
      }
    ]
  };

  const notificationButton = (
    <Dropdown
      menu={notificationMenu}
      trigger={['click']}
      placement="bottomRight"
      arrow
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '20px', color: isDarkMode ? '#fff' : '#1890ff' }} />}
          style={{ width: '40px', height: '40px' }}
        />
      </Badge>
    </Dropdown>
  );

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.fullName || 'Profil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Ayarlar',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      onClick: handleLogout,
    },
  ];

  const showDrawer = () => {
    setMobileMenuVisible(true);
  };

  const onClose = () => {
    setMobileMenuVisible(false);
  };

  return (
    <AntHeader style={{ 
      background: isDarkMode ? '#141414' : '#fff', 
      padding: 0, 
      height: 80, 
      lineHeight: '80px'
    }}>
      <div className="header-container">
        <Link to="/">
          <img 
            src={logoImage} 
            alt="Tadu Logo" 
            className="logo"
          />
        </Link>
        
        {/* Desktop Menu */}
        <div className="desktop-menu" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ flex: 1 }}
          />
          <Space style={{ marginLeft: 'auto' }} size="middle">
            {notificationButton}
            <Button
              type="text"
              icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
              onClick={toggleTheme}
            />
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: isDarkMode ? '#fff' : '#000' }}>
                  {user?.fullName}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-menu">
          <Button
            type="text"
            icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
            onClick={toggleTheme}
          />
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={showDrawer}
          />
        </div>

        {/* Mobile Menu Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={onClose}
          open={mobileMenuVisible}
          bodyStyle={{ padding: 0 }}
          headerStyle={{
            background: isDarkMode ? '#141414' : '#fff',
            color: isDarkMode ? '#fff' : undefined
          }}
          style={{
            background: isDarkMode ? '#141414' : '#fff',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={() => {
              setMobileMenuVisible(false);
            }}
          />
        </Drawer>
      </div>
    </AntHeader>
  );
};

export default Header;
