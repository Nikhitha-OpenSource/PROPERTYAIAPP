import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, ShieldCheck } from 'lucide-react';
import { propertiesApi, chatApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';

type ChatMessage = {
  senderId?: string;
  senderRole?: string;
  text: string;
  time: string;
  isMine?: boolean;
};

const displayTime = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const isSeller = String(user?.role || '').toUpperCase() === 'SELLER';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) navigate('/login');
  }, [navigate, user]);

  useEffect(() => {
    if (id) {
      propertiesApi.get(id).then(res => setProperty(res.data)).catch(err => console.error(err));
    }
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    const channelId = `property-${id}`;
    const activateChat = isSeller
      ? Promise.resolve()
      : chatApi.startPropertyChat(id).catch((err) => {
          console.error('Failed to start chat:', err);
        });

    activateChat.finally(() => {
      chatApi
        .history(channelId, 100)
        .then((res) => {
          const rows = res.data.messages || [];
          setChat(rows.map((row: any) => ({
            senderId: row.sender_id,
            senderRole: row.sender_role,
            text: row.message,
            time: displayTime(row.timestamp),
            isMine: String(row.sender_id) === String(user.user_id),
          })));
        })
        .catch((err) => console.error('Failed to load chat history:', err));
    });
  }, [id, isSeller, user]);

  useEffect(() => {
    if (!id || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token') || '';
    const wsUrl =
      `${protocol}//${window.location.host}/api/v1/chat/ws/chat/property-${id}` +
      `?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error('WS Error:', data.error);
        return;
      }
      if (data.sender_id === String(user.user_id)) return;
      setChat(prev => [...prev, {
        senderId: data.sender_id,
        senderRole: data.sender_role,
        text: data.message || data.text,
        time: displayTime(data.timestamp),
        isMine: false,
      }]);
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, [id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleSend = () => {
    if (!message.trim() || !wsRef.current || !connected || !user) return;

    const trimmed = message.trim();
    setChat(prev => [...prev, {
      senderId: String(user.user_id),
      senderRole: user.role,
      text: trimmed,
      time: displayTime(),
      isMine: true,
    }]);

    wsRef.current.send(JSON.stringify({
      sender_id: String(user.user_id),
      sender_role: user.role,
      message: trimmed,
      property_id: id,
      timestamp: new Date().toISOString(),
    }));

    setMessage('');
  };

  const labelFor = (msg: ChatMessage) => {
    if (msg.isMine) return 'You';
    const role = String(msg.senderRole || '').toUpperCase();
    if (role === 'SELLER') return 'Seller';
    if (role === 'ADMIN') return 'Admin';
    return 'Buyer';
  };

  if (!property) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: 8 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{isSeller ? 'Chat with Buyer' : 'Chat with Seller'}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray)' }}>{property.title} - {property.locality}</p>
        </div>
        <div className={connected ? 'badge badge-green' : 'badge badge-gray'}>{connected ? 'Online' : 'Offline'}</div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {chat.length === 0 && (
            <div style={{ alignSelf: 'center', color: 'var(--gray)', fontSize: '0.9rem', marginTop: 24 }}>
              No messages yet.
            </div>
          )}
          {chat.map((msg, i) => {
            const mine = Boolean(msg.isMine);
            return (
              <div key={i} style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
              }}>
                <div style={{
                  background: mine ? 'var(--primary)' : 'var(--lightBg3)',
                  color: mine ? 'white' : 'inherit',
                  padding: '12px 16px',
                  borderRadius: mine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                  {labelFor(msg)} - {msg.time}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {!connected && (
          <div style={{ padding: '8px 24px', background: 'var(--lightBg2)', borderBottom: '1px solid var(--lightGray)', fontSize: '0.8rem', color: 'var(--gray)' }}>
            Connecting to chat...
          </div>
        )}

        <div style={{ padding: 16, borderTop: '1px solid var(--lightGray)', display: 'flex', gap: 12 }}>
          <input
            type="text"
            className="form-control"
            placeholder={connected ? 'Type your message...' : 'Disconnected'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ borderRadius: 24 }}
            disabled={!connected}
          />
          <button className="btn btn-primary" style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleSend} disabled={!connected || !message.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--gray)', fontSize: '0.8rem' }}>
        <ShieldCheck size={14} />
        Your conversation is protected by PROPIQ AI Trust Guard
      </div>
    </div>
  );
}
