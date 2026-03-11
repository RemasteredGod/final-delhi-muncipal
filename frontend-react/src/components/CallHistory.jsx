import React, { useState, useEffect } from 'react';
import { getAllCalls } from '../api';

const CallHistory = ({ onViewTranscript }) => {
  const [calls, setCalls] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllCalls();
      if (data) setCalls(data.calls);
    };
    fetchData();
  }, []);

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.call_sid.toLowerCase().includes(search.toLowerCase()) || 
                          (call.last_message && call.last_message.toLowerCase().includes(search.toLowerCase()));
    
    if (filter === 'All') return matchesSearch;
    // For simplicity in this mock, we'll treat all as active unless no messages
    if (filter === 'Active') return matchesSearch && call.message_count > 0;
    if (filter === 'Completed') return matchesSearch && call.message_count === 0;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredCalls.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredCalls.slice(indexOfFirstRow, indexOfLastRow);

  const FilterButton = ({ label }) => (
    <button 
      onClick={() => { setFilter(label); setCurrentPage(1); }}
      style={{
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        backgroundColor: filter === label ? 'var(--saffron)' : 'var(--white)',
        color: filter === label ? 'var(--white)' : 'var(--text-secondary)',
        border: `1px solid ${filter === label ? 'var(--saffron)' : 'var(--border-grey)'}`,
        marginRight: '8px'
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Call History</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Search by Call SID or message content..." 
            className="card"
            style={{ width: '100%', padding: '12px 16px', marginBottom: 0, border: '1px solid var(--border-grey)' }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <div style={{ display: 'flex' }}>
            <FilterButton label="All" />
            <FilterButton label="Active" />
            <FilterButton label="Completed" />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--light-grey)', borderBottom: '2px solid var(--saffron)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px' }}>Call SID</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px' }}>Messages</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px' }}>Preview</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length > 0 ? currentRows.map(call => (
              <tr key={call.call_sid} style={{ borderBottom: '1px solid var(--border-grey)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>{call.call_sid.substring(0, 16)}...</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span className="badge" style={{ backgroundColor: 'rgba(255, 153, 51, 0.1)', color: 'var(--saffron)' }}>
                    {call.message_count}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {call.last_message || 'No messages'}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    onClick={() => onViewTranscript(call.call_sid)}
                  >
                    View Transcript
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {search ? 'No calls match your search.' : 'No call history found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-grey)' }}>
            <button 
              className="btn-secondary" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              style={{ padding: '4px 12px', fontSize: '12px', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn-secondary" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              style={{ padding: '4px 12px', fontSize: '12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;
