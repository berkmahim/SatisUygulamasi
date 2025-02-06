import axios from 'axios';

const API_URL = 'http://localhost:5000/api/customers';

export const getAllCustomers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await axios.post(API_URL, customerData);
  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await axios.put(`${API_URL}/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
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
