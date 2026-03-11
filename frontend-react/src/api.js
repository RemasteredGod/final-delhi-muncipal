const API_BASE = 'http://localhost:8000';

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('API Health check failed:', error);
    return null;
  }
};

export const getAllCalls = async () => {
  try {
    const response = await fetch(`${API_BASE}/calls`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Failed to fetch calls:', error);
    return null;
  }
};

export const getCallDetail = async (sid) => {
  try {
    const response = await fetch(`${API_BASE}/calls/${sid}`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error(`Failed to fetch call detail for ${sid}:`, error);
    return null;
  }
};

export const initiateCall = async (to_number) => {
  try {
    const response = await fetch(`${API_BASE}/initiate-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_number })
    });
    return response.ok ? await response.json() : await response.json();
  } catch (error) {
    console.error('Failed to initiate call:', error);
    return { success: false, error: 'Connection to backend failed.' };
  }
};
