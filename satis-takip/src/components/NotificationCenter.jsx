import React, { useState } from 'react';
import { Badge, Dropdown, List, Typography, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

const NotificationCenter = () => {
    const [unreadCount] = useState(2); // Test için sabit değer

    const menu = (
        <div className="notification-dropdown" style={{ width: 350 }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Bildirimler</Text>
            </div>
            <List
                itemLayout="horizontal"
                dataSource={[
                    {
                        id: 1,
                        title: 'Test Bildirimi 1',
                        message: 'Bu bir test bildirimidir.',
                        createdAt: new Date()
                    },
                    {
                        id: 2,
                        title: 'Test Bildirimi 2',
                        message: 'Bu başka bir test bildirimidir.',
                        createdAt: new Date()
                    }
                ]}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta
                            title={item.title}
                            description={item.message}
                        />
                    </List.Item>
                )}
            />
        </div>
    );

    return (
        <Dropdown
            overlay={menu}
            trigger={['click']}
            placement="bottomRight"
            arrow
        >
            <div style={{ cursor: 'pointer' }}>
                <Badge count={unreadCount}>
                    <Button
                        type="text"
                        icon={<BellOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                        style={{ width: '48px', height: '48px' }}
                    />
                </Badge>
            </div>
        </Dropdown>
    );
};

export default NotificationCenter;

export default NotificationCenter;
