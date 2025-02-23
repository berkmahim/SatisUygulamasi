import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import trTR from 'antd/lib/locale/tr_TR';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SalesPage from './pages/SalesPage';
import SaleDetailPage from './pages/SaleDetailPage';
import SettingsPage from './pages/SettingsPage';
import './styles/notifications.css';

const PrivateRoute = ({ children }) => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <ConfigProvider locale={trTR}>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    
                    <Route path="/" element={
                        <PrivateRoute>
                            <Layout>
                                <HomePage />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/customers" element={
                        <PrivateRoute>
                            <Layout>
                                <CustomersPage />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/customers/:id" element={
                        <PrivateRoute>
                            <Layout>
                                <CustomerDetailPage />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/projects" element={
                        <PrivateRoute>
                            <Layout>
                                <ProjectsPage />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/projects/:id" element={
                        <PrivateRoute>
                            <Layout>
                                <ProjectDetailPage />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/sales" element={
                        <PrivateRoute>
                            <Layout>
                                <SalesPage />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/sales/:id" element={
                        <PrivateRoute>
                            <Layout>
                                <SaleDetailPage />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Layout>
                                <SettingsPage />
                            </Layout>
                        </PrivateRoute>
                    } />
                </Routes>
            </Router>
        </ConfigProvider>
    );
};

export default App;
