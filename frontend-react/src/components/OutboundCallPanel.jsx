import React, { useState, useEffect } from 'react';
import { initiateCall, getAllCalls, getCallDetail } from '../api';

const OutboundCallPanel = ({ onViewDetail }) => {
  const [phoneNumber, setPhoneNumber] = useState('+919155428277');
  const [callStatus, setCallStatus] = useState({ state: 'idle', message: '', sid: '' });
  const [outboundCalls, setOutboundCalls] = useState([]);

  const fetchOutboundCalls = async () => {
    const data = await getAllCalls();
    if (data) {
      // Filter calls that have outbound initiation markers
      const callsWithDetails = await Promise.all(
        data.calls.map(async (call) => {
          const detail = await getCallDetail(call.call_sid);
          return { ...call, conversation: detail?.conversation || [] };
        })
      );
      
      const filtered = callsWithDetails.filter(call => 
        call.conversation.some(msg => msg.includes('System: Outbound call initiated'))
      );
      setOutboundCalls(filtered);
    }
  };

  useEffect(() => {
    fetchOutboundCalls();
  }, []);

  const handleInitiateCall = async (e) => {
    e.preventDefault();
    setCallStatus({ state: 'loading', message: 'Initiating call, please wait...', sid: '' });
    
    const result = await initiateCall(phoneNumber);
    if (result.success) {
      setCallStatus({ state: 'success', message: `Call initiated — SID: ${result.call_sid}`, sid: result.call_sid });
      fetchOutboundCalls();
    } else {
      setCallStatus({ state: 'error', message: result.error || 'Failed to initiate call.', sid: '' });
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ borderBottom: '2px solid var(--saffron)' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Initiate Outbound Call</h2>
        <form onSubmit={handleInitiateCall} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Recipient Phone Number
            </label>
            <input 
              type="text" 
              className="card" 
              style={{ width: '100%', padding: '10px 14px', marginBottom: '4px', border: '1px solid var(--border-grey)' }}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              required
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Include country code. Example: +919876543210
            </small>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={callStatus.state === 'loading'}>
            Initiate Call
          </button>
          
          {callStatus.state !== 'idle' && (
            <div style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: callStatus.state === 'success' ? 'rgba(19, 136, 8, 0.1)' : 
                               callStatus.state === 'error' ? 'rgba(204, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: callStatus.state === 'success' ? 'var(--india-green)' : 
                     callStatus.state === 'error' ? 'var(--error-red)' : 'var(--text-primary)',
              border: `1px solid ${callStatus.state === 'success' ? 'var(--india-green)' : 
                                  callStatus.state === 'error' ? 'var(--error-red)' : 'var(--border-grey)'}`
            }}>
              {callStatus.message}
            </div>
          )}
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Recent Outbound Calls</h3>
        {outboundCalls.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--light-grey)', borderBottom: '2px solid var(--saffron)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px' }}>Call SID</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px' }}>Messages</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outboundCalls.map(call => (
                  <tr key={call.call_sid} style={{ borderBottom: '1px solid var(--border-grey)' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{call.call_sid.substring(0, 16)}...</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={{ 
                        backgroundColor: call.status === 'active' ? 'rgba(19, 136, 8, 0.15)' : 'rgba(102, 102, 102, 0.15)', 
                        color: call.status === 'active' ? 'var(--india-green)' : 'var(--text-secondary)' 
                      }}>{call.status === 'active' ? 'Active' : 'Completed'}</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{call.message_count}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        onClick={() => onViewDetail(call.call_sid)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No outbound calls initiated yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default OutboundCallPanel;
