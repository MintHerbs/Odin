// Generate a UUID v4 session ID
export const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Map sentiment IDs to 1-5 integer values
export const sentimentToValue = (sentiment) => {
  const sentimentMap = {
    'hate': 1,
    'no': 2,
    'neutral': 3,
    'ok': 4,
    'pro': 5
  };
  return sentimentMap[sentiment] || null;
};

// Convert birthday string to age
export const getAgeFromBirthday = (birthdayString) => {
  if (!birthdayString) return null;
  const today = new Date();
  const birthDate = new Date(birthdayString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Submit session data to database
export const submitSessionData = async (sessionId, birthday, segaFamiliarity, aiSentiment) => {
  const age = getAgeFromBirthday(birthday);
  const aiSentimentValue = sentimentToValue(aiSentiment);

  console.log('Submitting session data:', {
    session_id: sessionId,
    participant_age: age,
    sega_familiarity: segaFamiliarity,
    ai_sentiment: aiSentimentValue
  });

  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      participant_age: age,
      sega_familiarity: segaFamiliarity,
      ai_sentiment: aiSentimentValue
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('API Error:', response.status, errorData);
    throw new Error(`Failed to submit session data: ${response.status} - ${errorData}`);
  }

  return response.json();
};
