'use client';

import { useState, useEffect } from 'react';
import ModeratingScreen from './screen/ModerationFlow';
import LoaderScreen from './screen/LoaderScreen';
import Survey from './screen/survey';
import { supabase } from './database/database';
import { generateSessionId, triggerBackgroundAI, mixLyricsForSession, checkAILyricsReady } from './utils/sessionUtils';

export default function Home() {
  const [view, setView] = useState('moderation');
  const [sessionId, setSessionId] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [mixedLyrics, setMixedLyrics] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('Preparing survey...');

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
      console.log('🔄 Loading survey data and checking AI lyrics status...');
      setLoadingMessage('Checking AI lyrics generation...');
      
      // Step 1: Check if AI lyrics are ready
      const aiStatus = await checkAILyricsReady(sessionId);
      
      if (!aiStatus.ready) {
        console.log(`⏳ AI lyrics not ready yet. Status: ${aiStatus.status}`);
        console.log(`📊 Progress: ${aiStatus.genres_populated || 0}/${aiStatus.total_genres || 6} genres`);
        
        setLoadingMessage(`Generating AI lyrics... (${aiStatus.genres_populated || 0}/6 genres)`);
        
        // Poll again after 3 seconds
        setTimeout(() => {
          fetchDataAndMixLyrics();
        }, 3000);
        return;
      }

      console.log('✅ AI lyrics are ready! Proceeding with mixing...');
      setLoadingMessage('AI lyrics ready! Mixing with human lyrics...');

      // Step 2: Mix lyrics based on user preferences
      console.log('🎭 Mixing lyrics with user preferences:', userPreferences);
      setLoadingMessage('Mixing lyrics...');
      
      const mixResult = await mixLyricsForSession(
        sessionId,
        userPreferences.age,
        userPreferences.segaFamiliarity,
        userPreferences.aiSentiment
      );

      if (mixResult.success) {
        setMixedLyrics(mixResult.lyrics);
        console.log('✅ Mixed lyrics loaded:', mixResult.metadata);
        setLoadingMessage('Almost ready...');
      } else {
        throw new Error('Failed to mix lyrics');
      }

      // Give it a small delay so the loader feels intentional
      setTimeout(() => {
        setView('survey');
      }, 2000);
    } catch (error) {
      console.error('Error fetching data or mixing lyrics:', error);
      setLoadingMessage('Error occurred, proceeding anyway...');
      // Fallback: proceed to survey even with error after delay
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
    return <LoaderScreen message={loadingMessage} />;
  }

  if (view === 'survey') {
    return <Survey records={mixedLyrics} sessionId={sessionId} />;
  }

  return null;
}