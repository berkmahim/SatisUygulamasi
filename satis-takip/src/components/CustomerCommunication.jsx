import React, { useState, useEffect } from 'react';
import { Card, Timeline, Input, Button, Tabs, Upload, message, Tag } from 'antd';
import { 
    MessageOutlined, 
    FileOutlined, 
    PhoneOutlined,
    MailOutlined,
    UploadOutlined
} from '@ant-design/icons';
import { 
    getCustomerCommunicationHistory, 
    addCustomerNote,
    getCustomerNotes 
} from '../services/notificationService';
import { 
    uploadCustomerDocument,
    getCustomerDocuments 
} from '../services/documentService';

const { TextArea } = Input;
const { TabPane } = Tabs;

const CustomerCommunication = ({ customerId, customerName }) => {
    const [communications, setCommunications] = useState([]);
    const [notes, setNotes] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [customerId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [commsData, notesData, docsData] = await Promise.all([
                getCustomerCommunicationHistory(customerId),
                getCustomerNotes(customerId),
                getCustomerDocuments(customerId)
            ]);
            setCommunications(commsData);
            setNotes(notesData);
            setDocuments(docsData);
        } catch (error) {
            message.error('Müşteri iletişim bilgileri yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            await addCustomerNote(customerId, newNote);
            setNewNote('');
            fetchData();
            message.success('Not başarıyla eklendi');
        } catch (error) {
            message.error('Not eklenirken bir hata oluştu');
        }
    };

    const handleUpload = async (file) => {
        try {
            await uploadCustomerDocument(customerId, file);
            fetchData();
            message.success('Dosya başarıyla yüklendi');
        } catch (error) {
            message.error('Dosya yüklenirken bir hata oluştu');
        }
        return false;
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'email': return <MailOutlined />;
            case 'phone': return <PhoneOutlined />;
            case 'message': return <MessageOutlined />;
            default: return <MessageOutlined />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'email': return 'blue';
            case 'phone': return 'green';
            case 'message': return 'orange';
            default: return 'default';
        }
    };

    return (
        <Card title={`${customerName} - İletişim Geçmişi`} loading={loading}>
            <Tabs defaultActiveKey="1">
                <TabPane 
                    tab={<span><MessageOutlined /> İletişim Geçmişi</span>}
                    key="1"
                >
                    <Timeline>
                        {communications.map((comm) => (
                            <Timeline.Item 
                                key={comm.id}
                                dot={getTypeIcon(comm.type)}
                                color={getTypeColor(comm.type)}
                            >
                                <p>
                                    <Tag color={getTypeColor(comm.type)}>
                                        {comm.type.toUpperCase()}
                                    </Tag>
                                    <span style={{ marginLeft: 8 }}>
                                        {new Date(comm.date).toLocaleString('tr-TR')}
                                    </span>
                                </p>
                                <p>{comm.content}</p>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </TabPane>

                <TabPane 
                    tab={<span><FileOutlined /> Notlar</span>}
                    key="2"
                >
                    <div style={{ marginBottom: 16 }}>
                        <TextArea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Yeni not ekle..."
                            rows={4}
                            style={{ marginBottom: 8 }}
                        />
                        <Button type="primary" onClick={handleAddNote}>
                            Not Ekle
                        </Button>
                    </div>
                    <Timeline>
                        {notes.map((note) => (
                            <Timeline.Item key={note.id}>
                                <p>
                                    <small>
                                        {new Date(note.date).toLocaleString('tr-TR')}
                                    </small>
                                </p>
                                <p>{note.content}</p>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </TabPane>

                <TabPane 
                    tab={<span><UploadOutlined /> Dökümanlar</span>}
                    key="3"
                >
                    <Upload
                        beforeUpload={handleUpload}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined />}>Döküman Yükle</Button>
                    </Upload>
                    
                    <div style={{ marginTop: 16 }}>
                        {documents.map((doc) => (
                            <p key={doc.id}>
                                <FileOutlined /> {doc.name}
                                <span style={{ float: 'right' }}>
                                    {new Date(doc.uploadDate).toLocaleDateString('tr-TR')}
                                </span>
                            </p>
                        ))}
                    </div>
                </TabPane>
            </Tabs>
        </Card>
    );
};

export default CustomerCommunication;
