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
// Trigger background AI generation with OpenAI
export const triggerBackgroundAI = async (sessionId) => {
  try {
    console.log('🚀 Triggering background AI generation for session:', sessionId);
    
    const response = await fetch('/api/trigger-gen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Background AI trigger error:', response.status, errorData);
      throw new Error(`Failed to trigger background AI: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Background AI generation triggered:', data);
    return data;
  } catch (error) {
    console.error('Error triggering background AI:', error);
    throw error;
  }
};

// Mix lyrics based on user preferences
export const mixLyricsForSession = async (sessionId, age, segaFamiliarity, aiSentiment) => {
  try {
    console.log('🎭 Requesting mixed lyrics for session:', sessionId);
    
    const response = await fetch('/api/mix-lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        age: age,
        segaFamiliarity: segaFamiliarity,
        aiSentiment: aiSentiment
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Mix lyrics API Error:', response.status, errorData);
      throw new Error(`Failed to mix lyrics: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Mixed lyrics received:', data.metadata);
    return data;
  } catch (error) {
    console.error('Error mixing lyrics:', error);
    throw error;
  }
};

// Save votes to session_votes table
export const saveVotes = async (sessionId, votes) => {
  try {
    console.log('🗳️  Submitting votes for session:', sessionId);
    console.log('📊 Votes:', votes);
    
    const response = await fetch('/api/save-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        votes: votes
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Save votes API Error:', response.status, errorData);
      throw new Error(`Failed to save votes: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Votes saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving votes:', error);
    throw error;
  }
};