'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

function DatabaseRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecords();
  }, []);

  async function getRecords() {
    try {
      const { data, error } = await supabase.from("survey_data").select().order('sid', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-4">Loading database records...</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-indigo-400">Survey Data Records</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="p-4 font-semibold text-gray-300">SID</th>
              <th className="p-4 font-semibold text-gray-300">Genre</th>
              <th className="p-4 font-semibold text-gray-300">Popularity</th>
              <th className="p-4 font-semibold text-gray-300">Comments Density</th>
              <th className="p-4 font-semibold text-gray-300">Age</th>
              <th className="p-4 font-semibold text-gray-300">Color</th>
              <th className="p-4 font-semibold text-gray-300">Lyrics</th>
              <th className="p-4 font-semibold text-gray-300">Lottie</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.sid} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="p-4 text-gray-400 font-mono text-sm">{record.sid}</td>
                <td className="p-4 capitalize">{record.genre}</td>
                <td className="p-4 text-gray-400 text-sm">{record.popularity ?? 'N/A'}</td>
                <td className="p-4 text-gray-400 text-sm">{record.comments_density ?? 'N/A'}</td>
                <td className="p-4 text-gray-400 text-sm">{record.age ?? 'N/A'}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-600"
                      style={{ backgroundColor: record.color_code }}
                    />
                    <span className="font-mono text-sm">{record.color_code}</span>
                  </div>
                </td>
                <td className="p-4 max-w-xs">
                  <div className="truncate text-sm text-gray-400" title={record.lyrics}>
                    {record.lyrics}
                  </div>
                </td>
                <td className="p-4 text-gray-400 text-sm truncate max-w-[150px]">
                  {record.lottie}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length === 0 && (
        <p className="mt-4 text-gray-500 text-center">No records found in survey_data table.</p>
      )}
    </div>
  );
}

export default DatabaseRecords;