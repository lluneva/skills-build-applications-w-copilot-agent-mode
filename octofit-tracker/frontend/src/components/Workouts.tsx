import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Workout suggestions</h2>
      {loading && <p role="status">Loading workout suggestions...</p>}
      {!loading && error && <p role="alert">Unable to load workout suggestions: {error}</p>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions found.</p>}
      {!loading && !error && suggestions.length > 0 && (
        <ul className="list-group">
          {suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={index}>
              <strong>{suggestion.title}</strong>
              {suggestion.reason && <span>: {suggestion.reason}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
