import React, { useState, useEffect } from 'react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const AshokaChakra = () => (
    <svg width="24" height="24" viewBox="0 0 100 100" style={{ marginRight: '12px' }}>
      <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="50" cy="50" r="8" fill="white" />
      {[...Array(24)].map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)}
          stroke="white"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );

  return (
    <nav style={{
      backgroundColor: 'var(--chakra-navy)',
      height: '64px',
      borderBottom: '3px solid var(--saffron)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between',
      color: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <AshokaChakra />
        <div>
          <div style={{ 
            fontFamily: 'Georgia, serif', 
            fontSize: '18px', 
            fontWeight: 600,
            lineHeight: 1.2
          }}>
            Delhi Municipal Corporation
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#FFD700', 
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            AI Helpline Operations Centre
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', height: '100%', alignItems: 'center' }}>
        {['Dashboard', 'Outbound Call', 'Call History'].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--saffron)' : 'white',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              borderBottom: activeTab === tab ? '2px solid var(--saffron)' : '2px solid transparent',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => { if (activeTab !== tab) e.target.style.color = 'var(--saffron)' }}
            onMouseOut={(e) => { if (activeTab !== tab) e.target.style.color = 'white' }}
          >
            {tab}
          </div>
        ))}
      </div>

      <div style={{ fontSize: '13px', fontWeight: 400, opacity: 0.9 }}>
        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {time}
      </div>
    </nav>
  );
};

export default Navbar;
