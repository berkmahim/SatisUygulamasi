import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Drawer, Dropdown, Space, Avatar } from 'antd';
import { 
  HomeOutlined, UserOutlined, ProjectOutlined, 
  BarChartOutlined, BulbOutlined, BulbFilled,
  MenuOutlined, LogoutOutlined, SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
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
          <Space style={{ marginLeft: 'auto' }}>
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
