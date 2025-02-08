import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider, theme } from 'antd';
import ProjectList from './pages/ProjectList';
import BuildingCanvas from './components/BuildingCanvas';
import CustomerList from './pages/CustomerList';
import BlockDetail from './pages/BlockDetail';
import BlockSalePage from './pages/BlockSalePage';
import PaymentPlanPage from './pages/PaymentPlanPage';
import ProjectDetail from './pages/ProjectDetail';
import Header from './components/Header';
import PaymentTracking from './pages/PaymentTracking';
import SalesReport from './pages/SalesReport';
import ProjectReport from './pages/ProjectReport';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Footer from './components/Footer';

const { Content } = Layout;
const { darkAlgorithm, defaultAlgorithm } = theme;

function AppContent() {
  const { isDarkMode } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Header />
          <Content style={{ 
            padding: '24px', 
            margin: '0 auto', 
            width: '100%',
            background: isDarkMode ? '#141414' : '#f0f2f5',
            flex: 1
          }}>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:id/building" element={<BuildingCanvas />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/projects/:projectId/blocks/:blockId" element={<BlockDetail />} />
              <Route path="/projects/:projectId/blocks/:blockId/sale" element={<BlockSalePage />} />
              <Route path="/projects/:projectId/blocks/:blockId/payment-plan" element={<PaymentPlanPage />} />
              <Route path="/sales/:saleId/payments" element={<PaymentTracking />} />
              <Route path="/reports/sales" element={<SalesReport />} />
              <Route path="/reports/projects/:projectId" element={<ProjectReport />} />
            </Routes>
          </Content>
          <Footer />
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
