import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Leaderboard</h2>
      {loading && <p role="status">Loading leaderboard...</p>}
      {!loading && error && <p role="alert">Unable to load leaderboard: {error}</p>}
      {!loading && !error && leaderboard.length === 0 && <p>No leaderboard rankings found.</p>}
      {!loading && !error && leaderboard.length > 0 && (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.teamName}>
              {entry.teamName}: {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
