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
 * Lock the vote for this IP address
 * @param {string} ipAddress - User's IP address
 * @param {string} sessionId - Current session ID
 * @returns {Promise<Object>} Lock result
 */
export const lockVote = async (ipAddress, sessionId) => {
  try {
    const response = await fetch('/api/lock-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ip_address: ipAddress,
        session_id: sessionId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to lock vote');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error locking vote:', error);
    throw error;
  }
};
