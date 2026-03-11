import React, { useState, useEffect } from 'react';
import { checkHealth } from '../api';

const SystemStatusBar = () => {
  const [status, setStatus] = useState({
    api: 'checking',
    whisper: 'checking',
    ollama: 'checking',
    redis: 'checking',
    lastUpdated: ''
  });

  const getStatusColor = (state) => {
    if (state === 'healthy') return 'var(--india-green)';
    if (state === 'down') return 'var(--error-red)';
    return 'var(--saffron)';
  };

  const updateStatus = async () => {
    const health = await checkHealth();
    const now = new Date().toLocaleTimeString();
    
    if (health) {
      setStatus({
        api: 'healthy',
        whisper: 'healthy',
        ollama: 'healthy',
        redis: 'healthy',
        lastUpdated: now
      });
    } else {
      setStatus({
        api: 'down',
        whisper: 'down',
        ollama: 'down',
        redis: 'down',
        lastUpdated: now
      });
    }
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const ServiceStatus = ({ name, state }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        backgroundColor: getStatusColor(state) 
      }} />
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
    </div>
  );

  return (
    <div style={{
      height: '36px',
      backgroundColor: 'var(--light-grey)',
      borderBottom: '1px solid var(--border-grey)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        <ServiceStatus name="API Server" state={status.api} />
        <ServiceStatus name="Whisper STT" state={status.whisper} />
        <ServiceStatus name="Ollama LLM" state={status.ollama} />
        <ServiceStatus name="Redis" state={status.redis} />
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        Last updated: {status.lastUpdated}
      </div>
    </div>
  );
};

export default SystemStatusBar;
