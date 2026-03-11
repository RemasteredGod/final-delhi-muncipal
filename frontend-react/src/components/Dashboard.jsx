import React, { useState, useEffect } from 'react';
import { getAllCalls, getCallDetail } from '../api';

const Dashboard = () => {
  const [calls, setCalls] = useState([]);
  const [conversations, setConversations] = useState({});
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    total: 0,
    messages: 0,
    health: 'Operational'
  });

  const fetchData = async () => {
    const data = await getAllCalls();
    if (data) {
      setCalls(data.calls);
      const totalMessages = data.calls.reduce((sum, call) => sum + call.message_count, 0);
      setStats({
        active: data.active_calls,
        total: data.calls.length,
        messages: totalMessages,
        health: 'Operational'
      });
      
      // Fetch details for ALL calls simultaneously for live updates
      const conversationsData = {};
      await Promise.all(data.calls.map(async (call) => {
        const details = await getCallDetail(call.call_sid);
        if (details) {
          conversationsData[call.call_sid] = details.conversation;
        }
      }));
      setConversations(conversationsData);
    } else {
      setStats(prev => ({ ...prev, health: 'Degraded' }));
    }
  };

  useEffect(() => {
    fetchData();
    let interval;
    if (isAutoRefresh) {
      interval = setInterval(fetchData, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const StatCard = ({ value, label, color = 'var(--saffron)' }) => (
    <div className="card" style={{ flex: 1, textAlign: 'center', marginBottom: 0 }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: '36px', color, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
    </div>
  );

  const CallCard = ({ call }) => {
    const conversation = conversations[call.call_sid] || [];
    return (
      <div className="card" style={{ borderLeft: '3px solid var(--saffron)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Call ID: {call.call_sid.substring(0, 12)}...</div>
            {call.status === 'active' ? (
              <span style={{ 
                backgroundColor: '#13880820', 
                color: '#138808', 
                borderRadius: '12px', 
                padding: '2px 8px', 
                fontSize: '11px',
                fontWeight: 600
              }}>Live</span>
            ) : (
              <span style={{ 
                backgroundColor: '#66666620', 
                color: '#666666', 
                borderRadius: '12px', 
                padding: '2px 8px', 
                fontSize: '11px',
                fontWeight: 600
              }}>Completed</span>
            )}
          </div>
          <div className="badge" style={{ backgroundColor: 'rgba(255, 153, 51, 0.15)', color: 'var(--saffron)' }}>
            {call.message_count} messages
          </div>
        </div>
        
        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
          {conversation.length > 0 ? conversation.map((msg, i) => {
            const isAI = msg.startsWith('AI:');
            const content = msg.replace(/^(User:|AI:)/, '').trim();
            return (
              <div key={i} style={{
                alignSelf: isAI ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: isAI ? '#FFF8F0' : '#F5F5F5',
                padding: '10px 14px',
                borderRadius: '4px',
                position: 'relative'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: isAI ? 'var(--saffron)' : 'var(--chakra-navy)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isAI ? 'AI Agent' : 'Citizen'}
                </div>
                <div style={{ fontSize: '13px' }}>{content}</div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' }}>
              Loading conversation...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        <StatCard value={stats.active} label="Active Calls" />
        <StatCard value={stats.total} label="Total Sessions Today" />
        <StatCard value={stats.messages} label="Total Messages" />
        <StatCard 
          value={stats.health} 
          label="System Health" 
          color={stats.health === 'Operational' ? 'var(--india-green)' : 'var(--error-red)'} 
        />
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px' }}>Live Call Monitor</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={fetchData} style={{ padding: '8px 16px' }}>Refresh</button>
          <button 
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            style={{ 
              padding: '8px 16px',
              backgroundColor: isAutoRefresh ? 'var(--india-green)' : 'var(--saffron)',
              color: 'white',
              borderRadius: '3px',
              fontWeight: 600
            }}
          >
            {isAutoRefresh ? 'Stop Auto-Refresh' : 'Start Auto-Refresh'}
          </button>
        </div>
      </div>

      {/* Call Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {calls.length > 0 ? (
          calls.map(call => (
            <CallCard key={call.call_sid} call={call} />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No calls recorded yet. Waiting for incoming calls.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
