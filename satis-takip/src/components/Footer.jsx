import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { GithubOutlined, LinkedinOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import './Footer.css';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter className="app-footer" style={{ 
      background: isDarkMode ? '#141414' : '#ffffff',
      color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : undefined 
    }}>
      <div className="footer-content">
        <Row gutter={[16, 24]} justify="space-between" align="middle">
          <Col xs={24} md={8}>
            <Text strong className="company-name">
              Tadu
            </Text>
            <Text className="company-description">
              Proje takip sistemi
            </Text>
          </Col>
          
          <Col xs={24} md={8} className="footer-links">
            <Space size={24}>
              <Link href="https://github.com/berkmahim" target="_blank" className="social-link">
                <GithubOutlined /> GitHub
              </Link>
              <Link href="https://www.linkedin.com" target="_blank" className="social-link">
                <LinkedinOutlined /> LinkedIn
              </Link>
              <Link href="https://www.tadu.com.tr" target="_blank" className="social-link">
                <GlobalOutlined /> Website
              </Link>
            </Space>
          </Col>

          <Col xs={24} md={8} className="copyright">
            <Text>
              © {currentYear} Tadu Tüm hakları saklıdır.
            </Text>
          </Col>
        </Row>
      </div>
    </AntFooter>
  );
};

export default Footer;
