// Configuration
const API_BASE_URL = 'http://localhost:8000';
let autoRefreshInterval = null;
let isAutoRefresh = false;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCalls();
  checkSystemStatus();
});

// Load all calls from the API
async function loadCalls() {
  try {
    const response = await fetch(`${API_BASE_URL}/calls`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Update statistics
    document.getElementById('active-calls-count').textContent =
      data.active_calls;
    document.getElementById('total-calls-count').textContent =
      data.calls.length;

    // Calculate total messages
    const totalMessages = data.calls.reduce(
      (sum, call) => sum + call.message_count,
      0,
    );
    document.getElementById('messages-count').textContent = totalMessages;

    // Render calls
    renderCalls(data.calls);
  } catch (error) {
    console.error('Error loading calls:', error);
    showError(
      'Failed to load calls. Make sure the API server is running on port 8000.',
    );
  }
}

// Render calls in the UI
function renderCalls(calls) {
  const container = document.getElementById('calls-container');

  if (calls.length === 0) {
    container.innerHTML =
      '<div class="no-calls">📞 No calls yet. Waiting for incoming calls...</div>';
    return;
  }

  // Sort calls by message count (most recent/active first)
  calls.sort((a, b) => b.message_count - a.message_count);

  container.innerHTML = '';

  calls.forEach((call) => {
    const callCard = createCallCard(call);
    container.appendChild(callCard);
  });
}

// Create a call card element
function createCallCard(call) {
  const card = document.createElement('div');
  card.className = 'call-card';

  const header = document.createElement('div');
  header.className = 'call-header';
  header.innerHTML = `
        <div class="call-id">📞 Call: ${truncateCallSid(call.call_sid)}</div>
        <div class="call-badge">${call.message_count} messages</div>
    `;

  const conversation = document.createElement('div');
  conversation.className = 'conversation';

  // Load detailed conversation
  loadCallDetails(call.call_sid, conversation);

  card.appendChild(header);
  card.appendChild(conversation);

  return card;
}

// Load detailed conversation for a call
async function loadCallDetails(callSid, container) {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/${callSid}`);
    const data = await response.json();

    if (data.error) {
      container.innerHTML =
        '<div class="message">No conversation history available</div>';
      return;
    }

    container.innerHTML = '';

    data.conversation.forEach((message) => {
      const messageDiv = document.createElement('div');

      // Determine if message is from user or AI
      if (message.startsWith('User:') || message.startsWith('Citizen:')) {
        messageDiv.className = 'message user';
        const text = message.replace(/^(User:|Citizen:)\s*/, '');
        messageDiv.innerHTML = `
                    <div class="message-label">👤 Caller</div>
                    <div>${escapeHtml(text)}</div>
                `;
      } else if (
        message.startsWith('AI:') ||
        message.startsWith('Assistant:')
      ) {
        messageDiv.className = 'message ai';
        const text = message.replace(/^(AI:|Assistant:)\s*/, '');
        messageDiv.innerHTML = `
                    <div class="message-label">🤖 AI Agent</div>
                    <div>${escapeHtml(text)}</div>
                `;
      } else {
        messageDiv.className = 'message';
        messageDiv.textContent = message;
      }

      container.appendChild(messageDiv);
    });
  } catch (error) {
    console.error('Error loading call details:', error);
    container.innerHTML =
      '<div class="message error">Failed to load conversation details</div>';
  }
}

// Check system status
async function checkSystemStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();

    const statusElement = document.getElementById('system-status');
    if (data.status) {
      statusElement.style.color = '#10b981'; // Green
      statusElement.textContent = '●';
    } else {
      statusElement.style.color = '#ef4444'; // Red
      statusElement.textContent = '●';
    }
  } catch (error) {
    const statusElement = document.getElementById('system-status');
    statusElement.style.color = '#ef4444'; // Red
    statusElement.textContent = '●';
  }
}

// Toggle auto-refresh
function toggleAutoRefresh() {
  const btn = document.getElementById('auto-refresh-btn');

  if (isAutoRefresh) {
    // Stop auto-refresh
    clearInterval(autoRefreshInterval);
    isAutoRefresh = false;
    btn.textContent = '▶️ Auto-Refresh: OFF';
    btn.style.background = 'white';
    btn.style.color = '#667eea';
  } else {
    // Start auto-refresh every 3 seconds
    autoRefreshInterval = setInterval(() => {
      loadCalls();
      checkSystemStatus();
    }, 3000);
    isAutoRefresh = true;
    btn.textContent = '⏸️ Auto-Refresh: ON';
    btn.style.background = '#10b981';
    btn.style.color = 'white';
  }
}

// Helper: Truncate call SID for display
function truncateCallSid(sid) {
  if (sid.length > 20) {
    return sid.substring(0, 8) + '...' + sid.substring(sid.length - 8);
  }
  return sid;
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper: Show error message
function showError(message) {
  const container = document.getElementById('calls-container');
  container.innerHTML = `<div class="error">⚠️ ${escapeHtml(message)}</div>`;
}

// Initiate outbound call
async function initiateCall() {
  const phoneNumber = document.getElementById('phone-number').value;
  const statusMessage = document.getElementById('call-status-message');
  const callBtn = document.getElementById('call-btn');

  // Validate phone number
  if (!phoneNumber || phoneNumber.trim().length < 10) {
    statusMessage.textContent = '⚠️ Please enter a valid phone number';
    statusMessage.className = 'status-message error-message';
    return;
  }

  // Disable button and show loading
  callBtn.disabled = true;
  callBtn.textContent = '📞 Calling...';
  statusMessage.textContent = '⏳ Initiating call...';
  statusMessage.className = 'status-message info-message';

  try {
    const response = await fetch(`${API_BASE_URL}/initiate-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_number: phoneNumber,
      }),
    });

    const data = await response.json();

    // Check if response is successful
    if (response.ok && data.success) {
      statusMessage.textContent = `✅ Call initiated successfully! Call SID: ${truncateCallSid(data.call_sid)}`;
      statusMessage.className = 'status-message success-message';

      // Enable auto-refresh if not already on
      if (!isAutoRefresh) {
        toggleAutoRefresh();
      }

      // Refresh calls immediately to show new call
      setTimeout(() => {
        loadCalls();
      }, 2000);
    } else {
      // Handle error - check both 'detail' (from HTTPException) and 'error' (from old format)
      const errorMsg = data.detail || data.error || 'Unknown error occurred';
      statusMessage.textContent = `❌ ${errorMsg}`;
      statusMessage.className = 'status-message error-message';
    }
  } catch (error) {
    console.error('Error initiating call:', error);
    statusMessage.textContent =
      '❌ Failed to initiate call. Check console for details.';
    statusMessage.className = 'status-message error-message';
  } finally {
    // Re-enable button
    callBtn.disabled = false;
    callBtn.textContent = '📞 Call Now';
  }
}

// Export functions for use in HTML onclick attributes
window.loadCalls = loadCalls;
window.toggleAutoRefresh = toggleAutoRefresh;
window.initiateCall = initiateCall;
