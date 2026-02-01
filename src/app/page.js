'use client';

import { useState, useEffect } from 'react';
import ModeratingScreen from './screen/ModerationFlow';
import LoaderScreen from './screen/LoaderScreen';
import Survey from './screen/survey';
import ConclusionScreen from './screen/ConclusionScreen';
import { generateSessionId, triggerBackgroundAI, mixLyricsForSession, checkAILyricsReady } from './utils/sessionUtils';
import { getUserIP, checkVoteStatus, lockVote } from './utils/ipUtils';

export default function Home() {
  const [view, setView] = useState('moderation');
  const [sessionId, setSessionId] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [mixedLyrics, setMixedLyrics] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('Preparing survey...');
  const [userIP, setUserIP] = useState(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  useEffect(() => {
    // LAYER 1: The Initial Check - Browser First, Database Second
    const initializeApp = async () => {
      try {
        // Fetch user's IP address
        console.log('🔍 Fetching user IP address...');
        const ip = await getUserIP();
        setUserIP(ip);
        console.log(`📍 User IP: ${ip}`);

        // Check vote status from server (includes whitelist check)
        const voteStatus = await checkVoteStatus(ip);
        setIsWhitelisted(voteStatus.isWhitelisted);

        if (voteStatus.isWhitelisted) {
          console.log('✅ Whitelisted IP detected - full access granted');
          // Continue to generate session and trigger AI
          const newSessionId = generateSessionId();
          setSessionId(newSessionId);
          await triggerBackgroundAI(newSessionId);
          return;
        }

        // Priority 1: Check LocalStorage first
        const hasVotedLocal = localStorage.getItem('hasVoted');
        
        if (hasVotedLocal === 'true') {
          console.log('⚠️  LocalStorage indicates user has voted - verifying with database...');
          
          // Verify against database
          if (voteStatus.hasVoted) {
            console.log('🚫 Database confirms - user has already voted. Redirecting to conclusion.');
            setView('conclusion');
            return;
          } else {
            console.log('⚠️  LocalStorage out of sync - clearing flag and allowing access');
            localStorage.removeItem('hasVoted');
          }
        }

        // Priority 2: Database Fallback (e.g., Incognito mode or cleared storage)
        if (voteStatus.hasVoted) {
          console.log('🚫 Database check: User has already voted (IP found in session_trackers)');
          console.log('🔄 Re-syncing localStorage...');
          localStorage.setItem('hasVoted', 'true');
          setView('conclusion');
          return;
        }

        // Priority 3: Grant Access - Both checks clear
        console.log('✅ All checks passed - granting access');
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        
        console.log('🚀 Triggering background AI generation...');
        await triggerBackgroundAI(newSessionId);

      } catch (error) {
        console.error('Failed to initialize app:', error);
        // On error, allow user to proceed (fail open for better UX)
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        await triggerBackgroundAI(newSessionId);
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
        
        setLoadingMessage(`Generating AI lyrics... (${aiStatus.genres_populated || 0}/5 genres)`);
        
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

  const handleSurveyComplete = async () => {
    console.log('✅ Survey and opinion completed! Moving to conclusion screen...');
    
    // LAYER 2: Lock the door immediately upon survey completion
    if (userIP && !isWhitelisted) {
      console.log('🔒 Locking vote for non-whitelisted user...');
      
      try {
        // Lock in database first
        const lockResult = await lockVote(userIP, sessionId);
        console.log('✅ Vote locked in database:', lockResult);
        
        // Then set localStorage
        localStorage.setItem('hasVoted', 'true');
        console.log('✅ LocalStorage flag set');
      } catch (error) {
        console.error('⚠️  Failed to lock vote:', error);
        // Still set localStorage as fallback
        localStorage.setItem('hasVoted', 'true');
      }
    } else if (isWhitelisted) {
      console.log('⚠️  Whitelisted IP - skipping lock');
    }
    
    setView('conclusion');
  };

  const handleConclusionComplete = () => {
    console.log('✅ Conclusion screen completed! Thank you for participating.');
    // Could redirect to a thank you page or reset the app
    // For now, we'll just log it
  };

  if (view === 'moderation') {
    return <ModeratingScreen sessionId={sessionId} onComplete={handleModerationComplete} />;
  }

  if (view === 'loading') {
    return <LoaderScreen message={loadingMessage} />;
  }

  if (view === 'survey') {
    return <Survey records={mixedLyrics} sessionId={sessionId} userIP={userIP} onSurveyComplete={handleSurveyComplete} />;
  }

  if (view === 'conclusion') {
    return <ConclusionScreen onComplete={handleConclusionComplete} />;
  }

  return null;
}