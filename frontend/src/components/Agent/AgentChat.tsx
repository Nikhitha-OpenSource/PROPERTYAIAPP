import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Bot, Volume2, VolumeX, Loader2, ArrowRight } from 'lucide-react';
import { agentApi } from '../../utils/api';

interface NavLink {
  label: string;
  path: string;
  description?: string;
  icon?: string;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  links?: NavLink[];
}

const CHIPS = [
  'Show 3BHK in Kondapur under 80L',
  'Commercial score for KPHB plot',
  'How long for deed transfer in Telangana?',
  'Best localities for investment',
];

export default function AgentChat() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text:
        "Hi. I'm PropBot.\n\n- Ask for listings by budget or locality\n- Ask for AI valuation or commercial analysis\n- Ask about deed workflow or RERA",
      links: [
        { label: 'Browse properties', path: '/properties' },
        { label: 'Run AI valuation', path: '/predict/commercial' },
        { label: 'Open deed tools', path: '/deeds' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [voiceLoadingIndex, setVoiceLoadingIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => stopVoice(), []);

  const stopVoice = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setSpeakingIndex(null);
  };

  const playVoice = async (index: number, text: string) => {
    if (speakingIndex === index) {
      stopVoice();
      return;
    }

    setVoiceError('');
    setVoiceLoadingIndex(index);
    try {
      stopVoice();
      const { data } = await agentApi.voice(text);
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;
      audio.onended = stopVoice;
      audio.onerror = () => {
        setVoiceError('Could not play the generated voice response.');
        stopVoice();
      };
      await audio.play();
      setSpeakingIndex(index);
    } catch (error: any) {
      let detail = error.message || 'An unknown network error occurred.';
      console.error('Voice API Request Failed:', error);
      if (error.response?.data) {
        try {
          let textData = '';
          if (error.response.data instanceof Blob) {
            textData = await error.response.data.text();
          } else if (error.response.data instanceof ArrayBuffer) {
            textData = new TextDecoder().decode(error.response.data);
          } else if (typeof error.response.data === 'string') {
            textData = error.response.data;
          }
          if (textData) {
            const json = JSON.parse(textData);
            detail = json.detail || textData;
          } else {
            detail = error.response.data.detail || detail;
          }
        } catch (e) {
          // Fallback if parsing fails entirely
        }
      }
      setVoiceError(detail);
    } finally {
      setVoiceLoadingIndex(null);
    }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await agentApi.chat({ message: text, session_id: sessionId });
      setSessionId(data.session_id);
      setMessages((m) => [
        ...m,
        { role: 'bot', text: data.reply, links: data.navigation_links || [] },
      ]);
      if (data.gui_commands?.length) {
        data.gui_commands.forEach((cmd: { command: string; params: Record<string, unknown> }) => {
          window.dispatchEvent(new CustomEvent('propiq-gui-command', { detail: cmd }));
        });
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          text: "I'm having trouble connecting right now.\n\n- Check that the backend is running on port 8000\n- Then try the same question again",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        return (
          <div key={i} style={{ marginTop: 6 }}>
            {trimmed}
          </div>
        );
      }
      return (
        <div key={i} style={{ marginTop: i === 0 ? 0 : 8 }}>
          {trimmed}
        </div>
      );
    });
  };

  return (
    <>
      <button id="agent-fab" className="agent-fab" onClick={() => setOpen(!open)} title="Ask PropBot">
        {open ? <X size={24} /> : <Bot size={26} />}
      </button>

      {open && (
        <div className="agent-window animate-scaleIn">
          <div className="agent-header">
            <div className="agent-avatar">PB</div>
            <div className="agent-header-info">
              <h4>PropBot</h4>
              <p>
                <span className="agent-status-dot" />
                Online · AI-powered
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="agent-messages">
            {messages.map((m, i) => (
              <div key={i} className={`agent-message ${m.role === 'bot' ? 'bot' : 'user'}`}>
                {m.role === 'bot' && (
                  <button
                    className="agent-voice-btn"
                    onClick={() => playVoice(i, m.text)}
                    title={speakingIndex === i ? 'Stop voice' : 'Play voice'}
                    disabled={voiceLoadingIndex === i}
                  >
                    {voiceLoadingIndex === i ? <Loader2 size={14} className="agent-spin" /> : speakingIndex === i ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}
                <div>{renderMessageText(m.text)}</div>
                {m.role === 'bot' && !!m.links?.length && (
                  <div className="agent-nav-cards">
                    {m.links.map((link) => (
                      <button
                        key={`${i}-${link.path}-${link.label}`}
                        className="agent-nav-card"
                        onClick={() => {
                          navigate(link.path);
                          setOpen(false);
                        }}
                      >
                        <span>
                          <strong>{link.label}</strong>
                          {link.description && <small>{link.description}</small>}
                        </span>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="agent-message bot">
                <span className="skeleton" style={{ display: 'inline-block', width: 80, height: 16 }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {voiceError && <div className="agent-voice-error">{voiceError}</div>}

          <div className="agent-chips">
            {CHIPS.map((c) => (
              <button key={c} className="agent-chip" onClick={() => send(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="agent-input-row">
            <input
              id="agent-input"
              className="input"
              placeholder="Ask about properties, prices, legal..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
            />
            <button className="btn btn-primary btn-sm" onClick={() => send(input)} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
