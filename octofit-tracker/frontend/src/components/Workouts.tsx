import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { _id?: string; title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((result) => { if (active) setSuggestions(result.suggestions); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return <section>
    <h2>Workout suggestions</h2>
    {error ? <p role="alert">Unable to load workout suggestions.</p> :
      suggestions === null ? <p role="status">Loading workout suggestions...</p> :
        suggestions.length === 0 ? <p>No workout suggestions yet.</p> :
          <ul>{suggestions.map((suggestion, index) => <li key={suggestion._id ?? index}>{suggestion.title}: {suggestion.reason}</li>)}</ul>}
  </section>;
}
