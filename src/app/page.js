'use client';

import { useState, useEffect } from 'react';
import ModeratingScreen from './screen/ModerationFlow';
import LoaderScreen from './screen/LoaderScreen';
import Survey from './screen/survey';
import ConclusionScreen from './screen/ConclusionScreen';
import MobileErrorScreen from './screen/MobileErrorScreen';
import { generateSessionId, mixLyricsForSession } from './utils/sessionUtils';
import { getUserIP, checkVoteStatus, lockVote } from './utils/ipUtils';
import { getCookie, getOrCreateDeviceId, hasVotedCookie, markAsVoted } from './utils/cookieUtils';

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

    // LAYER 1: The Initial Check - Cookie First (device-specific)
    const initializeApp = async () => {
      try {
        // Fetch user's IP address (for logging purposes)
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

        // Priority 1: Check Cookie first (device-specific tracking)
        if (hasVotedCookie()) {
          console.log('🚫 Cookie indicates this device has already voted');
          setView('conclusion');
          return;
        }

        // Priority 2: Check if this device ID has voted (from cookie)
        const deviceId = getOrCreateDeviceId();
        console.log(`🔍 Device ID: ${deviceId}`);
        
        // Check if this device has voted
        const deviceVoteStatus = await fetch('/api/check-vote-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: deviceId, ip_address: ip })
        }).then(res => res.json());

        if (deviceVoteStatus.hasVoted) {
          console.log('🚫 This device has already voted');
          // Set cookie to prevent future checks
          markAsVoted();
          setView('conclusion');
          return;
        }

        // Priority 3: Grant Access - All checks clear
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
    if (!isWhitelisted) {
      console.log('🔒 Locking vote for non-whitelisted user...');
      
      try {
        const deviceId = getCookie('deviceId');
        
        // Lock in database with both IP and device ID
        const lockResult = await lockVote(userIP, sessionId, deviceId);
        console.log('✅ Vote locked in database:', lockResult);
        
        // Set cookie to prevent future attempts
        markAsVoted();
      } catch (error) {
        console.error('⚠️  Failed to lock vote:', error);
        // Still set cookie as fallback
        markAsVoted();
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