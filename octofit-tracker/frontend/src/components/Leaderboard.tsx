import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((result) => { if (active) setLeaderboard(result.leaderboard); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return <section>
    <h2>Leaderboard</h2>
    {error ? <p role="alert">Unable to load leaderboard.</p> :
      leaderboard === null ? <p role="status">Loading leaderboard...</p> :
        leaderboard.length === 0 ? <p>No leaderboard scores yet.</p> :
          <ol>{leaderboard.map((entry) => <li key={entry.rank} value={entry.rank}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>}
  </section>;
}
