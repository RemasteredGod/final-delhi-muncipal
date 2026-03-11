import React, { useState, useEffect } from 'react';
import { getCallDetail } from '../api';

const CallDetailModal = ({ sid, onClose }) => {
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getCallDetail(sid);
      if (data) setConversation(data.conversation);
      setLoading(false);
    };
    fetchData();
  }, [sid]);

  const exportAsTxt = () => {
    const content = conversation.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `call_${sid}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!sid) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 80, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '24px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--white)',
        width: '100%',
        maxWidth: '680px',
        borderRadius: '4px',
        borderTop: '4px solid var(--saffron)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-grey)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '22px' }}>Call Transcript</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>SID: {sid}</div>
          </div>
          <button 
            onClick={onClose}
            style={{ backgroundColor: 'transparent', color: 'var(--chakra-navy)', fontSize: '24px', padding: '0 8px' }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: '#FAFAFA' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading transcript...</div>
          ) : conversation.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {conversation.map((msg, i) => {
                const isAI = msg.startsWith('AI:');
                const content = msg.replace(/^(User:|AI:|System:|Critical Error:)/, '').trim();
                const label = msg.split(':')[0];
                
                return (
                  <div key={i} style={{
                    alignSelf: isAI ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: isAI ? '#FFF8F0' : 'var(--white)',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-grey)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: isAI ? 'var(--saffron)' : 'var(--chakra-navy)',
                      marginBottom: '6px',
                      textTransform: 'uppercase'
                    }}>
                      {label === 'User' ? 'Citizen' : label === 'AI' ? 'AI Agent' : label}
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.6 }}>{content}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No messages found for this call.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-grey)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={exportAsTxt} disabled={conversation.length === 0}>
            Export as TXT
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallDetailModal;
