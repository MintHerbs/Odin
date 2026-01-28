'use client';

import { useState, useEffect } from 'react';
import ModeratingScreen from './screen/ModerationFlow';
import LoaderScreen from './screen/LoaderScreen';
import Survey from './screen/survey';
import { supabase } from './database/database';
import { generateSessionId, triggerBackgroundAI, mixLyricsForSession } from './utils/sessionUtils';

export default function Home() {
  const [view, setView] = useState('moderation');
  const [records, setRecords] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [mixedLyrics, setMixedLyrics] = useState([]);

  useEffect(() => {
    // Generate session_id on app load and trigger background AI generation
    const initializeApp = async () => {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      
      console.log('🚀 Webpage loaded! Triggering background AI generation...');
      
      try {
        // Trigger background AI generation immediately when page loads
        await triggerBackgroundAI(newSessionId);
      } catch (error) {
        console.error('Failed to trigger background AI generation on page load:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (view === 'loading' && userPreferences && sessionId) {
      fetchDataAndMixLyrics();
    }
  }, [view, userPreferences, sessionId]);

  const fetchDataAndMixLyrics = async () => {
    try {
      console.log('🔄 Loading survey data and mixing lyrics...');
      
      // Fetch survey data (for reference if needed)
      const { data, error } = await supabase
        .from('survey_data')
        .select('*')
        .order('sid', { ascending: true });

      if (error) throw error;
      setRecords(data || []);

      // Mix lyrics based on user preferences
      console.log('🎭 Mixing lyrics with user preferences:', userPreferences);
      const mixResult = await mixLyricsForSession(
        sessionId,
        userPreferences.age,
        userPreferences.segaFamiliarity,
        userPreferences.aiSentiment
      );

      if (mixResult.success) {
        setMixedLyrics(mixResult.lyrics);
        console.log('✅ Mixed lyrics loaded:', mixResult.metadata);
      } else {
        throw new Error('Failed to mix lyrics');
      }

      // Give it a small minimum delay so the loader feels intentional
      setTimeout(() => {
        setView('survey');
      }, 2000);
    } catch (error) {
      console.error('Error fetching data or mixing lyrics:', error);
      // Fallback: proceed to survey even with error
      setTimeout(() => {
        setView('survey');
      }, 2000);
    }
  };

  const handleModerationComplete = (preferences) => {
    console.log('✅ Moderation completed with preferences:', preferences);
    setUserPreferences(preferences);
    setView('loading');
  };

  if (view === 'moderation') {
    return <ModeratingScreen sessionId={sessionId} onComplete={handleModerationComplete} />;
  }

  if (view === 'loading') {
    return <LoaderScreen />;
  }

  if (view === 'survey') {
    return <Survey records={mixedLyrics} sessionId={sessionId} />;
  }

  return null;
}