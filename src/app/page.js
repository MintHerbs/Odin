'use client';

import { useState, useEffect } from 'react';
import ModeratingScreen from './screen/ModerationFlow';
import LoaderScreen from './screen/LoaderScreen';
import Survey from './screen/survey';
import { supabase } from './database/database';

export default function Home() {
  const [view, setView] = useState('moderation');
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (view === 'loading') {
      fetchData();
    }
  }, [view]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_data')
        .select('*')
        .order('sid', { ascending: true });

      if (error) throw error;
      setRecords(data || []);

      // Give it a small minimum delay so the loader feels intentional
      setTimeout(() => {
        setView('survey');
      }, 2000);
    } catch (error) {
      console.error('Error fetching survey data:', error);
      setView('survey');
    }
  };

  if (view === 'moderation') {
    return <ModeratingScreen onComplete={() => setView('loading')} />;
  }

  if (view === 'loading') {
    return <LoaderScreen />;
  }

  if (view === 'survey') {
    return <Survey records={records} />;
  }

  return null;
}