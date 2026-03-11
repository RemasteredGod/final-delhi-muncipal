import React, { useState } from 'react';
import './styles/global.css';
import Navbar from './components/Navbar';
import SystemStatusBar from './components/SystemStatusBar';
import Dashboard from './components/Dashboard';
import OutboundCallPanel from './components/OutboundCallPanel';
import CallHistory from './components/CallHistory';
import CallDetailModal from './components/CallDetailModal';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedCallSid, setSelectedCallSid] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Outbound Call':
        return <OutboundCallPanel onViewDetail={setSelectedCallSid} />;
      case 'Call History':
        return <CallHistory onViewTranscript={setSelectedCallSid} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <SystemStatusBar />
      
      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>

      {/* Persistent Footer */}
      <footer style={{ 
        padding: '24px', 
        textAlign: 'center', 
        color: 'var(--text-secondary)', 
        fontSize: '12px',
        backgroundColor: 'var(--white)',
        borderTop: '1px solid var(--border-grey)',
        marginTop: 'auto'
      }}>
        &copy; {new Date().getFullYear()} Delhi Municipal Corporation. For Official Use Only.
      </footer>

      {/* Call Detail Modal */}
      {selectedCallSid && (
        <CallDetailModal 
          sid={selectedCallSid} 
          onClose={() => setSelectedCallSid(null)} 
        />
      )}
    </div>
  );
}

export default App;
