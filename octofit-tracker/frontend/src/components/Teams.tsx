import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Teams</h2>
      {loading && <p role="status">Loading teams...</p>}
      {!loading && error && <p role="alert">Unable to load teams: {error}</p>}
      {!loading && !error && teams.length === 0 && <p>No teams found.</p>}
      {!loading && !error && teams.length > 0 && (
        <ul className="list-group">
          {teams.map((team, index) => (
            <li className="list-group-item" key={index}>
              {team.name} ({team.members?.length ?? 0} members)
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
