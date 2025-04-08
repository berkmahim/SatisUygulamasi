import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme } from 'antd';
import PermissionRoute from './components/PermissionRoute';
import ProjectList from './pages/ProjectList';
import BuildingCanvas from './components/BuildingCanvas';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import BlockDetail from './pages/BlockDetail';
import BlockSalePage from './pages/BlockSalePage';
import PaymentPlanPage from './pages/PaymentPlanPage';
import ProjectDetail from './pages/ProjectDetail';
import Header from './components/Header';
import PaymentTracking from './pages/PaymentTracking';
import SalesReport from './pages/SalesReport';
import GlobalSalesReport from './pages/GlobalSalesReport';
import ProjectReport from './pages/ProjectReport';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import ProjectReports from './pages/ProjectReports';
import UserProfilePage from './pages/UserProfilePage';
import ActivityLogs from './pages/ActivityLogs';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Footer from './components/Footer';

const { Content } = Layout;
const { darkAlgorithm, defaultAlgorithm } = theme;



function AppContent() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

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
      <Layout style={{ minHeight: '100vh' }}>
        {user && <Header />}
        <Content style={{
          padding: user ? '24px' : 0,
          margin: '0 auto',
          width: '100%',
          background: isDarkMode ? '#141414' : '#f0f2f5',
          flex: 1
        }}>
          <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={
                <PermissionRoute>
                  <ProjectList />
                </PermissionRoute>
              } />
              
              <Route path="/users" element={
                <PermissionRoute permission="userManagement">
                  <UsersPage />
                </PermissionRoute>
              } />
              
              <Route path="/projects/:id" element={
                <PermissionRoute permission="projectManagement">
                  <ProjectDetail />
                </PermissionRoute>
              } />
              
              <Route path="/projects/:id/building" element={
                <PermissionRoute permission="projectManagement">
                  <BuildingCanvas />
                </PermissionRoute>
              } />
              
              <Route path="/customers" element={
                <PermissionRoute permission="customerManagement">
                  <CustomersPage />
                </PermissionRoute>
              } />
              
              <Route path="/customers/:id" element={
                <PermissionRoute permission="customerManagement">
                  <CustomerDetailPage />
                </PermissionRoute>
              } />
              
              <Route path="/notifications" element={
                <PermissionRoute>
                  <NotificationsPage />
                </PermissionRoute>
              } />

              <Route path="/activity-logs" element={
                <PermissionRoute adminOnly={true}>
                  <ActivityLogs />
                </PermissionRoute>
              } />

              <Route path="/projects/:id/reports" element={
                <PermissionRoute permission="projectManagement">
                  <ProjectReports />
                </PermissionRoute>
              } />
              
              <Route path="/projects/:projectId/blocks/:blockId" element={
                <PermissionRoute permission="projectManagement">
                  <BlockDetail />
                </PermissionRoute>
              } />
              
              <Route path="/projects/:projectId/blocks/:blockId/sell" element={
                <PermissionRoute permission="salesManagement">
                  <BlockSalePage />
                </PermissionRoute>
              } />
              
              <Route path="/projects/:projectId/blocks/:blockId/payment-plan" element={
                <PermissionRoute permission="paymentManagement">
                  <PaymentPlanPage />
                </PermissionRoute>
              } />
              
              <Route path="/sales/:saleId/payments" element={
                <PermissionRoute permission="paymentManagement">
                  <PaymentTracking />
                </PermissionRoute>
              } />
              
              <Route path="/reports/sales" element={
                <PermissionRoute>
                  <SalesReport />
                </PermissionRoute>
              } />
              <Route path="/reports/project/:id" element={
                <PermissionRoute>
                  <ProjectReport />
                </PermissionRoute>
              } />
              <Route path="/reports/global" element={
                <PermissionRoute>
                  <GlobalSalesReport />
                </PermissionRoute>
              } />
              <Route path="/reports" element={
                <PermissionRoute permission="reportManagement">
                  <ProjectReports />
                </PermissionRoute>
              } />
              <Route path="/user-profile" element={
                <PermissionRoute>
                  <UserProfilePage />
                </PermissionRoute>
              } />
            </Routes>
          </Content>
          {user && <Footer />}
        </Layout>
    </ConfigProvider>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
