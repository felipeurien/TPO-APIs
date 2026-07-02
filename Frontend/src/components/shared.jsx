import { useEffect, useState } from "react";
import {
  formatDate,
  getLeagueCategory,
  getPersonName,
  getScore,
  getTeamCode,
} from "../utils/formatters";

const BANFIELD_SHIELD_URL_LOCAL = "/escudos/banfield.svg";

export function StatusMessage({ loading, error, empty, emptyText }) {
  if (loading) return <p className="state">Cargando...</p>;
  if (error) return <p className="state state--error">{error}</p>;
  if (empty) return <p className="state">{emptyText}</p>;
  return null;
}

export function DataTable({ children, className = "" }) {
  return <table className={`data-table ${className}`.trim()}>{children}</table>;
}

export function TeamShield({ team, name, size = "md" }) {
  const label = name || team?.nombre || "Equipo";
  const shieldUrl = label.toLowerCase().startsWith("banfield")
    ? BANFIELD_SHIELD_URL_LOCAL
    : team?.escudo_url;

  if (shieldUrl) {
    return (
      <span className={`team-shield team-shield--${size}`}>
        <img src={shieldUrl} alt={`Escudo de ${label}`} loading="lazy" />
      </span>
    );
  }

  return <span className={`team-shield team-shield--${size}`}>{getTeamCode(label)}</span>;
}

export function TeamNameWithShield({ name, teamByName, size = "xs" }) {
  return (
    <span className="team-name-with-shield">
      <TeamShield team={teamByName?.get(name)} name={name} size={size} />
      <span>{name || "Sin equipo"}</span>
    </span>
  );
}

export function LeagueFilter({ leagues, selectedLeagueId, setSelectedLeagueId }) {
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

export function LeagueTitleSelect({ leagues, selectedLeagueId, setSelectedLeagueId }) {
  return (
    <label className="title-league-select">
      <span>Liga Metropolitana de Basket</span>
      <select value={selectedLeagueId || ""} onChange={(event) => setSelectedLeagueId(event.target.value || null)}>
        {leagues.map((league) => (
          <option key={league.id_liga} value={league.id_liga}>{getLeagueCategory(league)}</option>
        ))}
      </select>
    </label>
  );
}

export function TeamFilter({ teams, selectedTeamId, setSelectedTeamId, includeAll = true }) {
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

export function ViewFilters({ leagues, selectedLeagueId, setSelectedLeagueId, teams, selectedTeamId, setSelectedTeamId, showTeam = false }) {
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

export function AdPlaceholder({ variant = "wide", image, alt = "Publicidad" }) {
  return (
    <aside className={`ad-placeholder ad-placeholder--${variant}`} aria-label="Espacio publicitario">
      {image ? (
        <img src={image} alt={alt} loading="lazy" />
      ) : (
        <>
          <strong>Publicidad</strong>
          <span>Espacio disponible</span>
          <small>Liga Metropolitana de Basket</small>
        </>
      )}
    </aside>
  );
}

export function AdRotator({ ads, intervalMs = 3500 }) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentAdIndex((index) => (index + 1) % ads.length);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [ads.length, intervalMs]);

  const currentAd = ads[currentAdIndex];

  return (
    <div className="ad-rotator">
      <AdPlaceholder variant="side" image={currentAd.image} alt={currentAd.alt} />
      <div className="ad-rotator__dots" aria-hidden="true">
        {ads.map((ad, index) => (
          <span className={index === currentAdIndex ? "ad-rotator__dot ad-rotator__dot--active" : "ad-rotator__dot"} key={ad.image} />
        ))}
      </div>
    </div>
  );
}

export function TeamMatchesTable({ matches, emptyText }) {
  if (!matches.length) return <p className="muted">{emptyText}</p>;

  return (
    <DataTable>
      <tbody>
        {matches.map((match) => (
          <tr key={match.id_partido}>
            <td>{formatDate(match.fecha)}</td>
            <td>{match.equipo_local}</td>
            <td><strong>{getScore(match)}</strong></td>
            <td>{match.equipo_visitante}</td>
            <td>{match.lugar || "Sede a confirmar"}</td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

export function StandingsTable({ standings, compact = false, teamByName }) {
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
            <td>
              {teamByName ? (
                <TeamNameWithShield name={team.nombre} teamByName={teamByName} />
              ) : (
                team.nombre
              )}
            </td>
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

export function LeagueSummary({ league }) {
  if (!league) return null;

  return (
    <div className="league-summary">
      <div>
        <strong>{league.nombre}</strong>
        <span>Temporada {league.temporada_actual || "sin dato"} - {league.activa ? "Activa" : "Inactiva"}</span>
      </div>
      {league.descripcion && <p>{league.descripcion}</p>}
    </div>
  );
}

export function ViewLayout({ title, children }) {
  return (
    <main className="view-page">
      <header className="view-title"><h2>{title}</h2></header>
      <div className="view-grid">{children}</div>
    </main>
  );
}

export { getPersonName };
