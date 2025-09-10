import React from 'react';
import { Menu } from 'antd';
import { EditOutlined, HomeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const BlockContextMenu = ({ 
  visible, 
  position, 
  blockId, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  const handleSellBlock = () => {
    navigate(`/projects/${projectId}/blocks/${blockId}/sell`);
    onClose();
  };

  const handleInspectBlock = () => {
    window.location.href = `/projects/${projectId}/blocks/${blockId}`;
    onClose();
  };

  if (!visible || !blockId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        minWidth: '120px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Menu
        mode="vertical"
        style={{ 
          border: 'none',
          boxShadow: 'none'
        }}
        items={[
          {
            key: 'sell',
            label: 'Birimi Sat',
            icon: <EditOutlined />,
            onClick: handleSellBlock,
            style: {
              color: '#FF8C00',
              fontWeight: '500'
            }
          },
          {
            key: 'inspect',
            label: 'İncele',
            icon: <HomeOutlined />,
            onClick: handleInspectBlock,
            style: {
              color: '#1890ff',
              fontWeight: '500'
            }
          }
        ]}
      />
    </div>
  );
};

export default BlockContextMenu;