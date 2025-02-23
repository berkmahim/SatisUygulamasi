import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ControlPanel = ({ 
  editMode, 
  setEditMode, 
  addMode, 
  setAddMode, 
  selectedBlock,
  onUpdateBlockDimensions,
  selectedBlockDimensions,
  onUpdateBlockDetails,
  onDeleteBlock,
  blocks
}) => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState(selectedBlockDimensions);
  const [blockDetails, setBlockDetails] = useState({
    unitNumber: '',
    owner: '',
    squareMeters: 0,
    roomCount: '',
    type: 'apartment'
  });

  useEffect(() => {
    if (selectedBlock) {
      const block = blocks.find(b => (b._id || b.id) === selectedBlock);
      if (block) {
        setBlockDetails({
          unitNumber: block.unitNumber || '',
          owner: block.owner || '',
          squareMeters: block.squareMeters || 0,
          roomCount: block.roomCount || '',
          type: block.type || 'apartment'
        });
      }
    }
  }, [selectedBlock, blocks]);

  const handleDimensionChange = (dimension, value) => {
    const newDimensions = { ...dimensions, [dimension]: parseInt(value) || 1 };
    setDimensions(newDimensions);
    onUpdateBlockDimensions(newDimensions);
  };



  const handleBlockDetailsChange = (field, value) => {
    const newDetails = { ...blockDetails, [field]: value };
    setBlockDetails(newDetails);
    if (selectedBlock) {
      onUpdateBlockDetails(selectedBlock, newDetails);
    }
  };

  const handleSellBlock = () => {
    if (selectedBlock) {
      navigate(`/projects/${projectId}/blocks/${selectedBlock}/sale`);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      minWidth: '200px'
    }}>
      <button
        onClick={() => {
          setEditMode(!editMode);
          if (!editMode) {
            setAddMode(false);
          }
        }}
        style={{
          padding: '8px 16px',
          backgroundColor: editMode ? '#4CAF50' : '#f0f0f0',
          color: editMode ? 'white' : 'black',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span className="material-icons" style={{ fontSize: '20px' }}>
          {editMode ? '✏️' : '👁️'}
        </span>
        {editMode ? 'Düzenleme Modu Aktif' : 'Görüntüleme Modu'}
      </button>

      {editMode && (
        <button
          onClick={() => setAddMode(!addMode)}
          style={{
            padding: '8px 16px',
            backgroundColor: addMode ? '#2196F3' : '#f0f0f0',
            color: addMode ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            {addMode ? '➕' : '🚫'}
          </span>
          {addMode ? 'Blok Ekleme Aktif' : 'Blok Ekleme Pasif'}
        </button>
      )}

      {editMode && selectedBlock && (
        <>
          <div style={{
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Blok Boyutları</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '60px' }}>Genişlik:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={selectedBlockDimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '60px' }}>Yükseklik:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={selectedBlockDimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '60px' }}>Derinlik:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={selectedBlockDimensions.depth}
                  onChange={(e) => handleDimensionChange('depth', e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Birim Detayları</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '80px' }}>Birim Tipi:</label>
              <select
                value={blockDetails.type}
                onChange={(e) => handleBlockDetailsChange('type', e.target.value)}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '120px'
                }}
              >
                <option value="apartment">Daire</option>
                <option value="store">Dükkan</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '80px' }}>Birim No:</label>
              <input
                type="text"
                value={blockDetails.unitNumber}
                onChange={(e) => handleBlockDetailsChange('unitNumber', e.target.value)}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '120px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '80px' }}>Sahibi:</label>
              <input
                type="text"
                value={blockDetails.owner}
                onChange={(e) => handleBlockDetailsChange('owner', e.target.value)}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '120px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '80px' }}>m²:</label>
              <input
                type="number"
                value={blockDetails.squareMeters}
                onChange={(e) => handleBlockDetailsChange('squareMeters', Number(e.target.value))}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '120px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', width: '80px' }}>Oda Sayısı:</label>
              <input
                type="text"
                value={blockDetails.roomCount}
                onChange={(e) => handleBlockDetailsChange('roomCount', e.target.value)}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '120px'
                }}
                placeholder="Örn: 2+1"
              />
            </div>
            <button
              onClick={() => window.location.href = `/projects/${blocks.find(b => (b._id || b.id) === selectedBlock).projectId}/blocks/${selectedBlock}`}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                📝
              </span>
              Detayına Git
            </button>
            <button
              onClick={handleSellBlock}
              style={{
                padding: '8px 16px',
                backgroundColor: '#FFD700',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                💰
              </span>
              Bloğu Sat
            </button>
            <button
              onClick={() => onDeleteBlock(selectedBlock)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                🗑️
              </span>
              Bloğu Sil
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ControlPanel;
