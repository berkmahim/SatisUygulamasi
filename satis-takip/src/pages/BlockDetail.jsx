import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlockById, updateBlock } from '../services/blockService';

const BlockDetail = () => {
  const { projectId, blockId } = useParams();
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    unitNumber: '',
    owner: '',
    squareMeters: '',
    roomCount: ''
  });

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        const data = await getBlockById(blockId);
        setBlock(data);
        setFormData({
          type: data.type || '',
          unitNumber: data.unitNumber || '',
          owner: data.owner || '',
          squareMeters: data.squareMeters || '',
          roomCount: data.roomCount || ''
        });
      } catch (error) {
        console.error('Error fetching block:', error);
        alert('Blok bilgileri yüklenirken bir hata oluştu');
      }
    };

    if (blockId) {
      fetchBlock();
    }
  }, [blockId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBlock(blockId, formData);
      alert('Blok başarıyla güncellendi');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error updating block:', error);
      alert('Blok güncellenirken bir hata oluştu');
    }
  };

  if (!block) {
    return <div className="container mx-auto px-4 py-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Blok Detayları</h1>
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Geri Dön
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Blok Tipi</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="store">Dükkan</option>
                <option value="apartment">Daire</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Birim Numarası</label>
              <input
                type="text"
                name="unitNumber"
                value={formData.unitNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sahibi</label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Metrekare</label>
              <input
                type="number"
                name="squareMeters"
                value={formData.squareMeters}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Oda Sayısı</label>
              <input
                type="text"
                name="roomCount"
                value={formData.roomCount}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Güncelle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlockDetail;
