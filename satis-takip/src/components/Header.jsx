import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Drawer } from 'antd';
import { 
  HomeOutlined, UserOutlined, ProjectOutlined, 
  BarChartOutlined, BulbOutlined, BulbFilled,
  MenuOutlined
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/Tadu_gold_Logo.png';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Ana Sayfa</Link>,
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: <Link to="/customers">Müşteriler</Link>,
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: <Link to="/projects">Projeler</Link>,
    },
    {
      key: '/reports/sales',
      icon: <BarChartOutlined />,
      label: <Link to="/reports/sales">Raporlar</Link>,
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
        <div className="desktop-menu">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
          />
          <Button
            type="text"
            icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
            onClick={toggleTheme}
          />
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
