import axios from 'axios';

const API_URL = 'http://localhost:5000/api/blocks';

export const getAllBlocks = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createBlock = async (blockData) => {
  const response = await axios.post(API_URL, blockData);
  return response.data;
};

export const updateBlock = async (id, blockData) => {
  const response = await axios.patch(`${API_URL}/${id}`, blockData);
  return response.data;
};

export const deleteBlock = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
