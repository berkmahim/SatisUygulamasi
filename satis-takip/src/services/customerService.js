import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/customers`;

export const getAllCustomers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await axios.post(API_URL, customerData);
  return response.data;
};

export const updateCustomer = async (customerId, customerData) => {
  const response = await axios.put(`${API_URL}/${customerId}`, customerData);
  return response.data;
};

export const deleteCustomer = async (customerId) => {
  const response = await axios.delete(`${API_URL}/${customerId}`);
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const searchCustomers = async (searchTerm) => {
  const response = await axios.get(`${API_URL}/search`, {
    params: { term: searchTerm }
  });
  return response.data;
};
