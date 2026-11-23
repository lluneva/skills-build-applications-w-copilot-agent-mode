import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Activities</h2>
      {loading && <p role="status">Loading activities...</p>}
      {!loading && error && <p role="alert">Unable to load activities: {error}</p>}
      {!loading && !error && activities.length === 0 && <p>No activities found.</p>}
      {!loading && !error && activities.length > 0 && (
        <ul className="list-group">
          {activities.map((activity, index) => (
            <li className="list-group-item" key={index}>
              {activity.type} - {activity.minutes ?? 0} minutes ({activity.points ?? 0} points)
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
