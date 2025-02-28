import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ControlPanel = ({ 
  editMode, 
  setEditMode, 
  addMode, 
  setAddMode,
  textMode,
  setTextMode,
  selectedBlock,
  onUpdateBlockDimensions,
  selectedBlockDimensions,
  onUpdateBlockDetails,
  onDeleteBlock,
  blocks,
  selectedText,
  onUpdateText,
  onDeleteText,
  texts,
  onMoveText
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
        // Seçilen bloğun boyutlarını da güncelle
        setDimensions(block.dimensions || { width: 1, height: 1, depth: 1 });
      }
    }
  }, [selectedBlock, blocks]);

  // selectedBlockDimensions değiştiğinde dimensions state'ini güncelle
  useEffect(() => {
    setDimensions(selectedBlockDimensions);
  }, [selectedBlockDimensions]);

  const handleDimensionChange = (dimension, value) => {
    // Değerin sayı olduğundan emin ol ve 1-10 arasında olmasını sağla
    const numValue = parseInt(value) || 1;
    const limitedValue = Math.min(Math.max(numValue, 1), 10);
    
    const newDimensions = { ...dimensions, [dimension]: limitedValue };
    setDimensions(newDimensions);
    
    // Güncellenmiş boyutları buildingCanvas'a gönder
    onUpdateBlockDimensions(newDimensions);
  };

  const handleBlockDetailsChange = (field, value) => {
    const newDetails = { ...blockDetails, [field]: value };
    setBlockDetails(newDetails);
    if (selectedBlock) {
      const currentBlock = blocks.find(b => (b._id || b.id) === selectedBlock);
      if (currentBlock) {
        // Mevcut bloğun tüm verilerini koru
        const updatedBlock = {
          ...currentBlock,
          unitNumber: newDetails.unitNumber,
          owner: newDetails.owner,
          squareMeters: newDetails.squareMeters,
          roomCount: newDetails.roomCount,
          type: newDetails.type || currentBlock.type,
          // Zorunlu alanları mutlaka gönder
          projectId: currentBlock.projectId,
          position: currentBlock.position,
          dimensions: currentBlock.dimensions
        };
        onUpdateBlockDetails(selectedBlock, updatedBlock);
      }
    }
  };

  const handleSellBlock = () => {
    if (selectedBlock) {
      navigate(`/projects/${projectId}/blocks/${selectedBlock}/sale`);
    }
  };

  // Düzenleme modunu aktifleştir ve diğer modları deaktif et
  const toggleTextMode = () => {
    setTextMode(!textMode);
    if (!textMode) {
      setAddMode(false); // Blok ekleme modunu kapat
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
      {/* Mod Seçim Butonları */}
      <div className="panel-section">
        <h3>Mod Seçimi</h3>
        <button 
          className={`button ${editMode ? 'active' : ''}`} 
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Düzenleme Modu Aktif' : 'Düzenleme Modu'}
        </button>
        
        {editMode && (
          <div className="sub-options">
            <button 
              className={`button ${addMode ? 'active' : ''}`} 
              onClick={() => setAddMode(!addMode)}
            >
              {addMode ? 'Blok Ekleme Modu Aktif' : 'Blok Ekleme Modu'}
            </button>
            
            <button 
              className={`button ${textMode ? 'active' : ''}`} 
              onClick={toggleTextMode}
            >
              {textMode ? 'Metin Ekleme Modu Aktif' : 'Metin Ekleme Modu'}
            </button>
          </div>
        )}
      </div>

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
                  value={dimensions.width}
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
                  value={dimensions.height}
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
                  value={dimensions.depth}
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

      {/* Metin Düzenleme Paneli */}
      {editMode && selectedText && (
        <div className="panel-section">
          <h3>Metin Düzenle</h3>
          <div className="form-field">
            <label>Metin İçeriği:</label>
            <input
              type="text"
              value={texts.find(t => t.id === selectedText)?.text || ''}
              onChange={(e) => onUpdateText(selectedText, e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="form-field">
            <label>Metin Konumu:</label>
            <div className="position-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
              {/* X ekseni (sağ-sol) */}
              <button 
                onClick={() => onMoveText(selectedText, 'left')}
                style={{ padding: '5px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                ← Sol
              </button>
              <div style={{ textAlign: 'center', padding: '5px', backgroundColor: '#f8f8f8', border: '1px solid #ddd', borderRadius: '3px' }}>
                X Ekseni
              </div>
              <button 
                onClick={() => onMoveText(selectedText, 'right')}
                style={{ padding: '5px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                Sağ →
              </button>
              
              {/* Y ekseni (yukarı-aşağı) */}
              <button 
                onClick={() => onMoveText(selectedText, 'up')}
                style={{ padding: '5px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                ↑ Yukarı
              </button>
              <div style={{ textAlign: 'center', padding: '5px', backgroundColor: '#f8f8f8', border: '1px solid #ddd', borderRadius: '3px' }}>
                Y Ekseni
              </div>
              <button 
                onClick={() => onMoveText(selectedText, 'down')}
                style={{ padding: '5px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                Aşağı ↓
              </button>
              
              {/* Z ekseni (ileri-geri) */}
              <button 
                onClick={() => onMoveText(selectedText, 'forward')}
                style={{ padding: '5px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                ↑ İleri
              </button>
              <div style={{ textAlign: 'center', padding: '5px', backgroundColor: '#f8f8f8', border: '1px solid #ddd', borderRadius: '3px' }}>
                Z Ekseni
              </div>
              <button 
                onClick={() => onMoveText(selectedText, 'backward')}
                style={{ padding: '5px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                Geri ↓
              </button>
            </div>
          </div>
          
          <div className="form-field">
            <label>Metin Rengi:</label>
            <div className="color-picker" style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000'].map(color => (
                <div 
                  key={color}
                  onClick={() => onUpdateText(selectedText, { color })}
                  style={{ 
                    width: '25px', 
                    height: '25px', 
                    backgroundColor: color, 
                    border: texts.find(t => t.id === selectedText)?.color === color 
                      ? '3px solid #000' 
                      : '1px solid #ccc',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="form-field">
            <label>Metin Boyutu:</label>
            <div className="size-adjuster" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => {
                  const currentSize = texts.find(t => t.id === selectedText)?.fontSize || 0.3;
                  onUpdateText(selectedText, { fontSize: Math.max(0.1, currentSize - 0.1) });
                }}
                style={{ padding: '5px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                -
              </button>
              <span>{(texts.find(t => t.id === selectedText)?.fontSize || 0.3).toFixed(1)}</span>
              <button 
                onClick={() => {
                  const currentSize = texts.find(t => t.id === selectedText)?.fontSize || 0.3;
                  onUpdateText(selectedText, { fontSize: Math.min(1.0, currentSize + 0.1) });
                }}
                style={{ padding: '5px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="form-field" style={{ marginTop: '10px' }}>
            <button 
              onClick={() => onDeleteText(selectedText)} 
              style={{ padding: '8px 16px', backgroundColor: '#ff5252', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Metni Sil
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
