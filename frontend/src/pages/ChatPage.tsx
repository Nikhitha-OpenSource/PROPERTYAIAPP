import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, User, ShieldCheck } from 'lucide-react';
import { propertiesApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{sender: string, text: string, time: string}[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (id) {
      propertiesApi.get(id).then(res => setProperty(res.data)).catch(err => console.error(err));
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token') || '';
    const wsUrl =
      `${protocol}//${window.location.host}/api/v1/chat/ws/chat/property-${id}` +
      `?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setChat([{ sender: 'Seller', text: "Hello! I'm the owner of this property. How can I help you?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("WS Error:", data.error);
        return;
      }
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Don't show our own messages twice (they are broadcasted back)
      if (data.sender_id === String(user?.user_id)) return;
      setChat(prev => [...prev, { sender: 'Seller', text: data.message || data.text, time }]);
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, [id, user?.user_id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleSend = () => {
    if (!message.trim() || !wsRef.current || !connected || !user) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChat(prev => [...prev, { sender: 'You', text: message, time: now }]);

    wsRef.current.send(JSON.stringify({
      sender_id: String(user.user_id),
      message: message,
      property_id: id,
      timestamp: new Date().toISOString()
    }));

    setMessage('');
  };

  if (!property) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: 8 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>Chat with Seller</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray)' }}>{property.title} - {property.locality}</p>
        </div>
        <div className="badge badge-green">Online</div>
      </div> 

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {chat.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}>
              <div style={{ 
                background: msg.sender === 'You' ? 'var(--primary)' : 'var(--lightBg3)',
                color: msg.sender === 'You' ? 'white' : 'inherit',
                padding: '12px 16px',
                borderRadius: msg.sender === 'You' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: 4, textAlign: msg.sender === 'You' ? 'right' : 'left' }}>
                {msg.time}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Connection Status */}
        {!connected && (
          <div style={{ padding: '8px 24px', background: 'var(--lightBg2)', borderBottom: '1px solid var(--lightGray)', fontSize: '0.8rem', color: 'var(--gray)' }}>
            Connecting to chat...
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: 16, borderTop: '1px solid var(--lightGray)', display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder={connected ? "Type your message..." : "Disconnected"} 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
