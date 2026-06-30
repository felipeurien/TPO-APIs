import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "./api/client";
import { getCoaches } from "./api/coaches";
import { getLeagueById, getLeagues, getLeagueStandings } from "./api/leagues";
import { getMatches } from "./api/matches";
import { getPlayers } from "./api/players";
import { getTeamById, getTeams } from "./api/teams";

const VIEWS = [
  { id: "inicio", label: "Inicio" },
  { id: "liga", label: "La Liga" },
  { id: "equipos", label: "Equipos" },
  { id: "fixture", label: "Fixture" },
  { id: "posiciones", label: "Posiciones" },
  { id: "jugadores", label: "Jugadores" },
  { id: "entrenadores", label: "Entrenadores" },
];

function StatusMessage({ loading, error, empty, emptyText }) {
  if (loading) return <p className="state">Cargando...</p>;
  if (error) return <p className="state state--error">{error}</p>;
  if (empty) return <p className="state">{emptyText}</p>;
  return null;
}

function formatDate(value) {
  if (!value) return "Fecha a confirmar";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value) {
  if (!value) return "--/--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(5, 10).replace("-", "/");
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getScore(match) {
  const hasScore =
    match.resultado_local !== null &&
    match.resultado_local !== undefined &&
    match.resultado_visitante !== null &&
    match.resultado_visitante !== undefined;

  return hasScore
    ? `${match.resultado_local} - ${match.resultado_visitante}`
    : "vs.";
}

function getTeamCode(name) {
  return (name || "---")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

function TeamShield({ team, name, size = "md" }) {
  const label = name || team?.nombre || "Equipo";

  if (team?.escudo_url) {
    return (
      <span className={`team-shield team-shield--${size}`}>
        <img src={team.escudo_url} alt={`Escudo de ${label}`} loading="lazy" />
      </span>
    );
  }

  return <span className={`team-shield team-shield--${size}`}>{getTeamCode(label)}</span>;
}

function isPlayed(match) {
  return (
    match.estado === "jugado" ||
    match.estado === "finalizado" ||
    (match.resultado_local !== null && match.resultado_visitante !== null)
  );
}

function getPersonName(person) {
  return [person?.nombre, person?.apellido].filter(Boolean).join(" ") || "Sin nombre";
}

function MatchCard({ match, teamByName }) {
  const played = isPlayed(match);

  return (
    <article className={played ? "match-card" : "match-card match-card--live"}>
      <div className="match-card__status">
        {played ? "Resultado final" : match.estado || "Programado"}
      </div>
      <div className="match-card__teams">
        <div>
          <TeamShield team={teamByName.get(match.equipo_local)} name={match.equipo_local} />
          <strong>{match.equipo_local}</strong>
        </div>
        <div>
          <TeamShield team={teamByName.get(match.equipo_visitante)} name={match.equipo_visitante} />
          <strong>{match.equipo_visitante}</strong>
        </div>
      </div>
      <div className="match-card__score">{getScore(match)}</div>
      <footer>
        <span>{formatShortDate(match.fecha)}</span>
        <span>{match.horario || "Horario a confirmar"}</span>
        <span>{match.lugar || "Sede a confirmar"}</span>
      </footer>
    </article>
  );
}

function DataTable({ children }) {
  return <table className="data-table">{children}</table>;
}

function LeagueFilter({ leagues, selectedLeagueId, setSelectedLeagueId }) {
  return (
    <label>
      Liga
      <select value={selectedLeagueId || ""} onChange={(event) => setSelectedLeagueId(event.target.value || null)}>
        {leagues.map((league) => (
          <option key={league.id_liga} value={league.id_liga}>{league.nombre}</option>
        ))}
      </select>
    </label>
  );
}

function TeamFilter({ teams, selectedTeamId, setSelectedTeamId, includeAll = true }) {
  return (
    <label>
      Equipo
      <select value={selectedTeamId || ""} onChange={(event) => setSelectedTeamId(event.target.value || null)}>
        {includeAll && <option value="">Todos los equipos</option>}
        {teams.map((team) => (
          <option key={team.id_equipo} value={team.id_equipo}>{team.nombre}</option>
        ))}
      </select>
    </label>
  );
}

function ViewFilters({ leagues, selectedLeagueId, setSelectedLeagueId, teams, selectedTeamId, setSelectedTeamId, showTeam = false }) {
  return (
    <div className="toolbar">
      <LeagueFilter
        leagues={leagues}
        selectedLeagueId={selectedLeagueId}
        setSelectedLeagueId={setSelectedLeagueId}
      />
      {showTeam && (
        <TeamFilter
          teams={teams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
        />
      )}
    </div>
  );
}

function HomeView({ leagues, selectedLeagueId, setSelectedLeagueId, loading, errors, matches, standings, leagueDetail, teamByName, setView }) {
  const playedMatches = matches.filter(isPlayed).slice(-5).reverse();
  const upcomingMatches = matches.filter((match) => !isPlayed(match)).slice(0, 5);
  const featuredMatches = [...playedMatches, ...upcomingMatches].slice(0, 5);

  return (
    <main className="home-grid">
      <section className="panel full-span">
        <div className="panel-title"><h2>Filtro</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          teams={[]}
        />
      </section>
      <aside className="left-column">
        <section className="box">
          <h2>Acceso rápido</h2>
          <ul className="quick-menu">
            <li><button type="button" onClick={() => setView("fixture")}>Resultados y fixture</button></li>
            <li><button type="button" onClick={() => setView("posiciones")}>Tabla de posiciones</button></li>
            <li><button type="button" onClick={() => setView("equipos")}>Equipos</button></li>
            <li><button type="button" onClick={() => setView("liga")}>Ligas disponibles</button></li>
            <li><button type="button" onClick={() => setView("jugadores")}>Jugadores</button></li>
            <li><button type="button" onClick={() => setView("entrenadores")}>Entrenadores</button></li>
          </ul>
        </section>

        <section className="box">
          <h2>Próxima fecha</h2>
          <StatusMessage
            loading={loading.matches}
            error={errors.matches}
            empty={!loading.matches && upcomingMatches.length === 0}
            emptyText="No hay próximos partidos."
          />
          <div className="next-list">
            {upcomingMatches.slice(0, 4).map((match) => (
              <article key={match.id_partido}>
                <strong>{getTeamCode(match.equipo_local)}</strong>
                <span>vs.</span>
                <strong>{getTeamCode(match.equipo_visitante)}</strong>
                <small>{formatShortDate(match.fecha)} - {match.horario || "--:--"}</small>
              </article>
            ))}
          </div>
        </section>
      </aside>

      <section className="center-column">
        <section className="panel hero-panel">
          <div className="panel-title panel-title--plain">
            <h2>Partidos y resultados</h2>
            <button type="button" className="text-link" onClick={() => setView("fixture")}>Ver calendario completo</button>
          </div>
          <StatusMessage
            loading={loading.matches}
            error={errors.matches}
            empty={!loading.matches && featuredMatches.length === 0}
            emptyText="No se encontraron partidos."
          />
          <div className="scoreboard-grid">
            {featuredMatches.map((match) => (
              <MatchCard key={match.id_partido} match={match} teamByName={teamByName} />
            ))}
          </div>
        </section>

        <div className="two-up">
          <section className="panel">
            <div className="panel-title"><h2>Últimos resultados</h2></div>
            <DataTable>
              <tbody>
                {playedMatches.map((match) => (
                  <tr key={match.id_partido}>
                    <td>{formatShortDate(match.fecha)}</td>
                    <td>{match.equipo_local}</td>
                    <td><strong>{match.resultado_local}</strong></td>
                    <td>-</td>
                    <td><strong>{match.resultado_visitante}</strong></td>
                    <td>{match.equipo_visitante}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>

          <section className="panel">
            <div className="panel-title"><h2>Próximos partidos</h2></div>
            <DataTable>
              <tbody>
                {upcomingMatches.map((match) => (
                  <tr key={match.id_partido}>
                    <td>{formatShortDate(match.fecha)}</td>
                    <td>{match.horario || "--:--"}</td>
                    <td>{match.equipo_local}</td>
                    <td>vs.</td>
                    <td>{match.equipo_visitante}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        </div>
      </section>

      <aside className="right-center-column">
        <section className="panel standings-panel">
          <div className="panel-title"><h2>{leagueDetail?.nombre || "Posiciones"}</h2></div>
          <StandingsTable standings={standings.slice(0, 8)} compact />
          <button type="button" className="panel-link button-link" onClick={() => setView("posiciones")}>
            Ver tabla completa »
          </button>
        </section>
      </aside>
    </main>
  );
}

function LeagueView({ leagues, selectedLeagueId, setSelectedLeagueId, leagueDetail, loading, errors }) {
  return (
    <ViewLayout title="La Liga">
      <section className="panel">
        <div className="panel-title"><h2>Ligas disponibles</h2></div>
        <StatusMessage
          loading={loading.leagues}
          error={errors.leagues}
          empty={!loading.leagues && leagues.length === 0}
          emptyText="No se encontraron ligas."
        />
        <div className="selector-list">
          {leagues.map((league) => (
            <button
              key={league.id_liga}
              type="button"
              className={Number(selectedLeagueId) === Number(league.id_liga) ? "selector-card selector-card--active" : "selector-card"}
              onClick={() => setSelectedLeagueId(league.id_liga)}
            >
              <strong>{league.nombre}</strong>
              <span>Temporada {league.temporada_actual || "sin dato"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><h2>Detalle de liga</h2></div>
        <StatusMessage
          loading={loading.leagueDetail}
          error={errors.leagueDetail}
          empty={!selectedLeagueId && !loading.leagues}
          emptyText="Seleccioná una liga para ver el detalle."
        />
        {leagueDetail && !loading.leagueDetail && (
          <div className="detail-card">
            <h3>{leagueDetail.nombre}</h3>
            <p>{leagueDetail.descripcion || "Sin descripción disponible."}</p>
            <dl>
              <dt>Temporada</dt><dd>{leagueDetail.temporada_actual || "Sin dato"}</dd>
              <dt>Estado</dt><dd>{leagueDetail.activa ? "Activa" : "Inactiva"}</dd>
            </dl>
          </div>
        )}
      </section>
    </ViewLayout>
  );
}

function TeamsView({ leagues, selectedLeagueId, setSelectedLeagueId, teams, selectedTeamId, setSelectedTeamId, teamDetail, loading, errors }) {
  return (
    <ViewLayout title="Equipos">
      <section className="panel full-span">
        <div className="panel-title"><h2>Filtro</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          teams={teams}
        />
      </section>

      <section className="panel">
        <div className="panel-title"><h2>Equipos</h2></div>
        <StatusMessage
          loading={loading.teams}
          error={errors.teams}
          empty={!loading.teams && teams.length === 0}
          emptyText="No se encontraron equipos."
        />
        <div className="team-directory team-directory--selectable">
          {teams.map((team) => (
            <button
              key={team.id_equipo}
              type="button"
              className={Number(selectedTeamId) === Number(team.id_equipo) ? "team-row team-row--active" : "team-row"}
              onClick={() => setSelectedTeamId(team.id_equipo)}
            >
              <span className="team-row__identity">
                <TeamShield team={team} name={team.nombre} size="sm" />
                <strong>{team.nombre}</strong>
              </span>
              <span>{team.liga_nombre || "Sin liga"}</span>
              <em>{team.categoria || "Sin categoría"}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><h2>Detalle del equipo</h2></div>
        <StatusMessage
          loading={loading.teamDetail}
          error={errors.teamDetail}
          empty={!selectedTeamId && !loading.teams}
          emptyText="Seleccioná un equipo para ver plantel, entrenador y partidos."
        />
        {teamDetail && !loading.teamDetail && <TeamDetail team={teamDetail} />}
      </section>
    </ViewLayout>
  );
}

function TeamDetail({ team }) {
  return (
    <div className="detail-card">
      <h3>{team.nombre}</h3>
      <p>{team.descripcion || "Sin descripción disponible."}</p>
      <dl>
        <dt>Liga</dt><dd>{team.liga_nombre || "Sin liga"}</dd>
        <dt>Categoría</dt><dd>{team.categoria || "Sin dato"}</dd>
        <dt>Entrenador</dt><dd>{team.entrenador ? getPersonName(team.entrenador) : "Sin entrenador asignado"}</dd>
        <dt>Estado</dt><dd>{team.activo ? "Activo" : "Inactivo"}</dd>
      </dl>

      <h4>Jugadores</h4>
      <SimpleList
        items={team.jugadores || []}
        emptyText="Sin jugadores cargados."
        renderItem={(player) => `${getPersonName(player)} - ${player.categoria || "Sin categoría"}`}
      />

      <h4>Partidos jugados</h4>
      <MatchList matches={team.partidos_jugados || []} emptyText="Sin partidos jugados." />

      <h4>Partidos pendientes</h4>
      <MatchList matches={team.partidos_pendientes || []} emptyText="Sin partidos pendientes." />
    </div>
  );
}

function FixtureView({ leagues, selectedLeagueId, setSelectedLeagueId, matches, loading, errors }) {
  return (
    <ViewLayout title="Fixture">
      <section className="panel full-span">
        <div className="panel-title"><h2>Filtro</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          teams={[]}
        />
      </section>

      <section className="panel full-span">
        <div className="panel-title"><h2>Partidos y resultados</h2></div>
        <StatusMessage
          loading={loading.matches}
          error={errors.matches}
          empty={!loading.matches && matches.length === 0}
          emptyText="No se encontraron partidos."
        />
        <DataTable>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Local</th>
              <th>Resultado</th>
              <th>Visitante</th>
              <th>Lugar</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id_partido}>
                <td>{formatDate(match.fecha)}</td>
                <td>{match.horario || "--:--"}</td>
                <td>{match.equipo_local}</td>
                <td><strong>{getScore(match)}</strong></td>
                <td>{match.equipo_visitante}</td>
                <td>{match.lugar || "Sede a confirmar"}</td>
                <td>{match.estado || "programado"}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
    </ViewLayout>
  );
}

function StandingsView({ leagues, selectedLeagueId, setSelectedLeagueId, standings, leagueDetail, loading, errors }) {
  return (
    <ViewLayout title="Posiciones">
      <section className="panel full-span">
        <div className="panel-title"><h2>Tabla de posiciones</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          teams={[]}
        />
        {leagueDetail && <p className="toolbar-note">Temporada {leagueDetail.temporada_actual || "sin dato"}</p>}
        <StatusMessage
          loading={loading.leagueDetail || loading.leagues}
          error={errors.leagueDetail || errors.leagues}
          empty={!loading.leagueDetail && standings.length === 0}
          emptyText="No hay clasificación disponible."
        />
        <StandingsTable standings={standings} />
      </section>
    </ViewLayout>
  );
}

function StandingsTable({ standings, compact = false }) {
  if (!standings.length) return null;

  return (
    <table className="standings-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Equipo</th>
          <th>PJ</th>
          <th>PG</th>
          {!compact && <th>PE</th>}
          <th>PP</th>
          {!compact && <th>PF</th>}
          {!compact && <th>PC</th>}
          <th>Dif</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((team, index) => (
          <tr key={team.id_equipo}>
            <td>{index + 1}</td>
            <td>{team.nombre}</td>
            <td>{team.partidos_jugados}</td>
            <td>{team.ganados}</td>
            {!compact && <td>{team.empatados}</td>}
            <td>{team.perdidos}</td>
            {!compact && <td>{team.puntos_favor}</td>}
            {!compact && <td>{team.puntos_contra}</td>}
            <td>{team.diferencia}</td>
            <td><strong>{team.puntos}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PlayersView({ leagues, selectedLeagueId, setSelectedLeagueId, teams, selectedTeamId, setSelectedTeamId, players, loading, errors }) {
  return (
    <ViewLayout title="Jugadores">
      <section className="panel full-span">
        <div className="panel-title"><h2>Filtro</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          teams={teams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          showTeam
        />
      </section>

      <section className="panel full-span">
        <div className="panel-title"><h2>Jugadores</h2></div>
        <StatusMessage
          loading={loading.players}
          error={errors.players}
          empty={!loading.players && players.length === 0}
          emptyText="No se encontraron jugadores."
        />
        <DataTable>
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Categoría</th>
              <th>Equipo</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id_jugador}>
                <td>{getPersonName(player)}</td>
                <td>{player.categoria || "Sin categoría"}</td>
                <td>{player.equipo_nombre || "Sin equipo"}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
    </ViewLayout>
  );
}

function CoachesView({ leagues, selectedLeagueId, setSelectedLeagueId, teams, selectedTeamId, setSelectedTeamId, coaches, loading, errors }) {
  return (
    <ViewLayout title="Entrenadores">
      <section className="panel full-span">
        <div className="panel-title"><h2>Filtro</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          teams={teams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          showTeam
        />
      </section>

      <section className="panel full-span">
        <div className="panel-title"><h2>Entrenadores</h2></div>
        <StatusMessage
          loading={loading.coaches}
          error={errors.coaches}
          empty={!loading.coaches && coaches.length === 0}
          emptyText="No se encontraron entrenadores."
        />
        <div className="card-grid">
          {coaches.map((coach) => (
            <article className="mini-card" key={coach.id_entrenador}>
              <strong>{getPersonName(coach)}</strong>
              <span>ID #{coach.id_entrenador}</span>
            </article>
          ))}
        </div>
      </section>
    </ViewLayout>
  );
}

function ViewLayout({ title, children }) {
  return (
    <main className="view-page">
      <header className="view-title"><h2>{title}</h2></header>
      <div className="view-grid">{children}</div>
    </main>
  );
}

function SimpleList({ items, emptyText, renderItem }) {
  if (!items.length) return <p className="muted">{emptyText}</p>;

  return (
    <ul className="simple-list">
      {items.map((item) => (
        <li key={item.id_jugador || item.id_entrenador || item.id_partido}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

function MatchList({ matches, emptyText }) {
  return (
    <SimpleList
      items={matches}
      emptyText={emptyText}
      renderItem={(match) => `${formatDate(match.fecha)} - ${match.equipo_local} ${getScore(match)} ${match.equipo_visitante}`}
    />
  );
}

function App() {
  const [view, setView] = useState("inicio");
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [leagueDetail, setLeagueDetail] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState({
    leagues: true,
    teams: true,
    matches: true,
    players: true,
    coaches: true,
    leagueDetail: false,
    teamDetail: false,
  });
  const [errors, setErrors] = useState({
    leagues: "",
    teams: "",
    matches: "",
    players: "",
    coaches: "",
    leagueDetail: "",
    teamDetail: "",
  });

  useEffect(() => {
    getLeagues()
      .then((data) => {
        setLeagues(data);
        setSelectedLeagueId(data[0]?.id_liga ?? null);
      })
      .catch((error) => setErrors((current) => ({ ...current, leagues: error.message })))
      .finally(() => setLoading((current) => ({ ...current, leagues: false })));

    getTeams()
      .then(setTeams)
      .catch((error) => setErrors((current) => ({ ...current, teams: error.message })))
      .finally(() => setLoading((current) => ({ ...current, teams: false })));

    getMatches()
      .then(setMatches)
      .catch((error) => setErrors((current) => ({ ...current, matches: error.message })))
      .finally(() => setLoading((current) => ({ ...current, matches: false })));

    getPlayers()
      .then(setPlayers)
      .catch((error) => setErrors((current) => ({ ...current, players: error.message })))
      .finally(() => setLoading((current) => ({ ...current, players: false })));

    getCoaches()
      .then(setCoaches)
      .catch((error) => setErrors((current) => ({ ...current, coaches: error.message })))
      .finally(() => setLoading((current) => ({ ...current, coaches: false })));
  }, []);

  useEffect(() => {
    if (!selectedLeagueId) {
      setLeagueDetail(null);
      setStandings([]);
      return;
    }

    setLoading((current) => ({ ...current, leagueDetail: true }));
    setErrors((current) => ({ ...current, leagueDetail: "" }));

    Promise.all([getLeagueById(selectedLeagueId), getLeagueStandings(selectedLeagueId)])
      .then(([detail, standingsData]) => {
        setLeagueDetail(detail);
        setStandings(standingsData);
      })
      .catch((error) => setErrors((current) => ({ ...current, leagueDetail: error.message })))
      .finally(() => setLoading((current) => ({ ...current, leagueDetail: false })));
  }, [selectedLeagueId]);

  const filteredTeams = useMemo(
    () => selectedLeagueId ? teams.filter((team) => Number(team.id_liga) === Number(selectedLeagueId)) : teams,
    [teams, selectedLeagueId],
  );

  const selectedTeamIds = useMemo(
    () => new Set(filteredTeams.map((team) => Number(team.id_equipo))),
    [filteredTeams],
  );

  const filteredPlayers = useMemo(
    () => players.filter((player) => {
      const belongsToLeague = selectedTeamIds.has(Number(player.id_equipo));
      const belongsToTeam = !selectedTeamId || Number(player.id_equipo) === Number(selectedTeamId);
      return belongsToLeague && belongsToTeam;
    }),
    [players, selectedTeamIds, selectedTeamId],
  );

  const filteredCoaches = useMemo(
    () => coaches.filter((coach) => {
      const coachedTeams = filteredTeams.filter((team) => Number(team.id_entrenador) === Number(coach.id_entrenador));
      if (selectedTeamId) {
        return coachedTeams.some((team) => Number(team.id_equipo) === Number(selectedTeamId));
      }
      return coachedTeams.length > 0;
    }),
    [coaches, filteredTeams, selectedTeamId],
  );

  useEffect(() => {
    if (!selectedTeamId) return;

    const selectedTeamBelongsToLeague = filteredTeams.some(
      (team) => Number(team.id_equipo) === Number(selectedTeamId),
    );

    if (!selectedTeamBelongsToLeague) {
      setSelectedTeamId(null);
    }
  }, [filteredTeams, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      setTeamDetail(null);
      return;
    }

    setLoading((current) => ({ ...current, teamDetail: true }));
    setErrors((current) => ({ ...current, teamDetail: "" }));

    getTeamById(selectedTeamId)
      .then(setTeamDetail)
      .catch((error) => setErrors((current) => ({ ...current, teamDetail: error.message })))
      .finally(() => setLoading((current) => ({ ...current, teamDetail: false })));
  }, [selectedTeamId]);


  const teamByName = useMemo(
    () => new Map(teams.map((team) => [team.nombre, team])),
    [teams],
  );

  const leagueMatches = useMemo(
    () => selectedLeagueId ? matches.filter((match) => Number(match.id_liga) === Number(selectedLeagueId)) : matches,
    [matches, selectedLeagueId],
  );

  const viewProps = {
    leagues,
    teams: filteredTeams,
    matches: leagueMatches,
    players: filteredPlayers,
    coaches: filteredCoaches,
    selectedLeagueId,
    setSelectedLeagueId,
    selectedTeamId,
    setSelectedTeamId,
    leagueDetail,
    teamDetail,
    teamByName,
    standings,
    loading,
    errors,
    setView,
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span></span></div>
          <div className="brand-copy">
            <h1>Liga Metropolitana</h1>
            <strong>de Basket</strong>
            <p>Fundada en 1981</p>
          </div>
          <div className="header-meta">
            <span>{leagueDetail?.temporada_actual ? `Temporada ${leagueDetail.temporada_actual}` : "Temporada actual"}</span>
            <span>{new Date().toLocaleDateString("es-AR")}</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navegación principal">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? "main-nav__active" : ""}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {view === "inicio" && <HomeView {...viewProps} matches={leagueMatches} />}
      {view === "liga" && <LeagueView {...viewProps} />}
      {view === "equipos" && <TeamsView {...viewProps} />}
      {view === "fixture" && <FixtureView {...viewProps} />}
      {view === "posiciones" && <StandingsView {...viewProps} />}
      {view === "jugadores" && <PlayersView {...viewProps} />}
      {view === "entrenadores" && <CoachesView {...viewProps} />}

      <footer className="site-footer">
        <nav>
          {VIEWS.slice(0, 5).map((item) => (
            <button key={item.id} type="button" onClick={() => setView(item.id)}>{item.label}</button>
          ))}
        </nav>
        <p>Liga Metropolitana de Basket - Datos públicos - API {API_BASE_URL}</p>
      </footer>
    </div>
  );
}

export default App;
