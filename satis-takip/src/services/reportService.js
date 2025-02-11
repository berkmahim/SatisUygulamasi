import axios from 'axios';

const API_URL = '/api/reports';

export const generateFinancialReport = async (filters) => {
    const response = await axios.post(`${API_URL}/financial`, filters);
    return response.data;
};

export const generateCustomerReport = async (filters) => {
    const response = await axios.post(`${API_URL}/customers`, filters);
    return response.data;
};

export const generatePaymentReport = async (filters) => {
    const response = await axios.post(`${API_URL}/payments`, filters);
    return response.data;
};

export const getDashboardStats = async (period) => {
    const response = await axios.get(`${API_URL}/dashboard?period=${period}`);
    return response.data;
};

export const getCustomReportData = async (config) => {
    const response = await axios.post(`${API_URL}/custom`, config);
    return response.data;
};

export const exportReport = async (reportType, filters, format) => {
    const response = await axios.post(`${API_URL}/export`, {
        reportType,
        filters,
        format
    }, { responseType: 'blob' });
    return response.data;
};
