import React from 'react';
import { Layout as AntLayout, Menu, Button, Space, Badge } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
    HomeOutlined,
    UserOutlined,
    ShoppingOutlined,
    BankOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo'));

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <AntLayout style={{ minHeight: '100vh' }}>
            <Sider width={200} theme="light">
                <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <h2 style={{ color: '#1890ff', margin: 0 }}>Satış Takip</h2>
                </div>
                <Menu
                    mode="inline"
                    defaultSelectedKeys={[window.location.pathname]}
                    style={{ height: '100%', borderRight: 0 }}
                >
                    <Menu.Item key="/" icon={<HomeOutlined />}>
                        <Link to="/">Ana Sayfa</Link>
                    </Menu.Item>
                    <Menu.Item key="/customers" icon={<UserOutlined />}>
                        <Link to="/customers">Müşteriler</Link>
                    </Menu.Item>
                    <Menu.Item key="/sales" icon={<ShoppingOutlined />}>
                        <Link to="/sales">Satışlar</Link>
                    </Menu.Item>
                    <Menu.Item key="/projects" icon={<BankOutlined />}>
                        <Link to="/projects">Projeler</Link>
                    </Menu.Item>
                    {user?.role === 'admin' && (
                        <Menu.Item key="/settings" icon={<SettingOutlined />}>
                            <Link to="/settings">Ayarlar</Link>
                        </Menu.Item>
                    )}
                </Menu>
            </Sider>
            <AntLayout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Space size="large">
                        <Badge count={2}>
                            <Button
                                type="text"
                                icon={<BellOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                                style={{ width: '48px', height: '48px' }}
                            />
                        </Badge>
                        <Space>
                            <span style={{ marginRight: '8px' }}>{user?.fullName}</span>
                            <Button 
                                type="primary" 
                                icon={<LogoutOutlined />} 
                                onClick={handleLogout}
                            >
                                Çıkış Yap
                            </Button>
                        </Space>
                    </Space>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                    {children}
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default Layout;
