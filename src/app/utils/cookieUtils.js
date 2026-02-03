/**
 * Cookie utility functions for device tracking
 */

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

/**
 * Set a cookie with optional expiration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} maxAge - Max age in seconds (default: 1 year)
 */
export const setCookie = (name, value, maxAge = 60 * 60 * 24 * 365) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict`;
};

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
};

/**
 * Get or create device ID
 * @returns {string} Device ID (UUID)
 */
export const getOrCreateDeviceId = () => {
  let deviceId = getCookie('deviceId');
  
  if (!deviceId) {
    // Generate UUID v4
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    
    setCookie('deviceId', deviceId);
    console.log(`🆔 Generated new device ID: ${deviceId}`);
  }
  
  return deviceId;
};

/**
 * Check if user has voted (cookie check)
 * @returns {boolean} True if hasVoted cookie is set
 */
export const hasVotedCookie = () => {
  return getCookie('hasVoted') === 'true';
};

/**
 * Mark user as voted (set cookie)
 */
export const markAsVoted = () => {
  setCookie('hasVoted', 'true');
  console.log('✅ Cookie flag set: hasVoted=true');
};
