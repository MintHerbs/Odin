'use client';

import { useState, useEffect } from 'react';
import ModeratingScreen from './screen/ModerationFlow';
import LoaderScreen from './screen/LoaderScreen';
import Survey from './screen/survey';
import ConclusionScreen from './screen/ConclusionScreen';
import MobileErrorScreen from './screen/MobileErrorScreen';
import { generateSessionId, mixLyricsForSession } from './utils/sessionUtils';
import { getUserIP, checkVoteStatus, lockVote } from './utils/ipUtils';

export default function Home() {
  const [view, setView] = useState('moderation');
  const [sessionId, setSessionId] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [mixedLyrics, setMixedLyrics] = useState([]);
  const [userIP, setUserIP] = useState(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      return isMobileDevice || isSmallScreen;
    };

    setIsMobile(checkMobile());

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
          // Continue to generate session
          const newSessionId = generateSessionId();
          setSessionId(newSessionId);
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

      } catch (error) {
        console.error('Failed to initialize app:', error);
        // On error, allow user to proceed (fail open for better UX)
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
      }
    };

    initializeApp();
  }, []);

  // Handle moderation completion - show loader while fetching lyrics
  const handleModerationComplete = async (preferences) => {
    console.log('✅ Moderation completed with preferences:', preferences);
    setUserPreferences(preferences);
    
    // Show loader while fetching lyrics
    setView('loading');
    
    try {
      // Mix lyrics (uses warm pool + generates new ones)
      console.log('🎭 Fetching and mixing lyrics...');
      const mixResult = await mixLyricsForSession(
        sessionId,
        preferences.age,
        preferences.segaFamiliarity,
        preferences.aiSentiment
      );

      if (mixResult.success) {
        setMixedLyrics(mixResult.lyrics);
        console.log('✅ Mixed lyrics loaded:', mixResult.metadata);
        console.log(`📊 Warm pool size: ${mixResult.metadata.warmPoolSize || 0}`);
        console.log(`🎵 AI source: ${mixResult.metadata.aiSource || 'none'}`);
        
        // Go to survey
        setView('survey');
      } else {
        throw new Error('Failed to mix lyrics');
      }
    } catch (error) {
      console.error('❌ Error loading lyrics:', error);
      alert('Failed to load survey. Please try again.');
      setView('moderation'); // Go back to moderation on error
    }
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

  // Show mobile error screen if on mobile device
  if (isMobile) {
    return <MobileErrorScreen />;
  }

  if (view === 'moderation') {
    return <ModeratingScreen sessionId={sessionId} onComplete={handleModerationComplete} />;
  }

  if (view === 'loading') {
    return <LoaderScreen />;
  }

  if (view === 'survey') {
    return <Survey records={mixedLyrics} sessionId={sessionId} userIP={userIP} onSurveyComplete={handleSurveyComplete} />;
  }

  if (view === 'conclusion') {
    return <ConclusionScreen onComplete={handleConclusionComplete} />;
  }

  return null;
}