import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((result) => { if (active) setActivities(result.activities); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return <section>
    <h2>Activities</h2>
    {error ? <p role="alert">Unable to load activities.</p> :
      activities === null ? <p role="status">Loading activities...</p> :
        activities.length === 0 ? <p>No activities yet.</p> :
          <ul>{activities.map((activity, index) => <li key={activity._id ?? index}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>)}</ul>}
  </section>;
}
