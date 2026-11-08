import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((result) => { if (active) setTeams(result.teams); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return <section>
    <h2>Teams</h2>
    {error ? <p role="alert">Unable to load teams.</p> :
      teams === null ? <p role="status">Loading teams...</p> :
        teams.length === 0 ? <p>No teams yet.</p> :
          <ul>{teams.map((team, index) => <li key={team._id ?? index}>{team.name}{team.mascot ? ` - ${team.mascot}` : ''}: {team.members.length} members</li>)}</ul>}
  </section>;
}
