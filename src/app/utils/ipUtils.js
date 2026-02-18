/**
 * Fetch the user's public IP address using ipify API
 * @returns {Promise<string>} The user's IP address
 */
export const getUserIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('❌ Error fetching IP address:', error);
    throw new Error('Failed to fetch IP address');
  }
};

/**
 * Check if user has already voted
 * @param {string} ipAddress - User's IP address
 * @returns {Promise<Object>} Vote status object
 */
export const checkVoteStatus = async (ipAddress) => {
  try {
    const response = await fetch('/api/check-vote-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip_address: ipAddress })
    });

    if (!response.ok) {
      throw new Error('Failed to check vote status');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error checking vote status:', error);
    throw error;
  }
};

/**
 * Lock the vote for this device
 * @param {string} ipAddress - User's IP address
 * @param {string} sessionId - Current session ID
 * @param {string} deviceId - Device ID from cookie
 * @returns {Promise<Object>} Lock result
 */
export const lockVote = async (ipAddress, sessionId, deviceId) => {
  try {
    const response = await fetch('/api/lock-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ip_address: ipAddress,
        session_id: sessionId,
        device_id: deviceId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Lock vote API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to lock vote: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Vote locked successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error locking vote:', error.message);
    throw error;
  }
};
