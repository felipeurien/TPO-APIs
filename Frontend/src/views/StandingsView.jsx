import { useMemo, useState } from "react";
import {
  AdPlaceholder,
  StatusMessage,
  TeamMatchesTable,
  TeamNameWithShield,
  TeamShield,
  ViewFilters,
  ViewLayout,
} from "../components/shared";
import { isPlayed } from "../utils/formatters";

function buildAdvancedStandings(standings, matches) {
  const playedMatches = matches
    .filter(isPlayed)
    .sort((a, b) => `${a.fecha} ${a.horario || ""}`.localeCompare(`${b.fecha} ${b.horario || ""}`));

  return standings.map((team) => {
    const stats = {
      ...team,
      winRate: team.partidos_jugados ? Math.round((team.ganados / team.partidos_jugados) * 100) : 0,
      homeWins: 0,
      homeLosses: 0,
      awayWins: 0,
      awayLosses: 0,
      recentForm: [],
      recentMatches: [],
      upcomingMatches: [],
    };

    playedMatches.forEach((match) => {
      const isHome = match.equipo_local === team.nombre;
      const isAway = match.equipo_visitante === team.nombre;
      if (!isHome && !isAway) return;

      const homeWon = Number(match.resultado_local) > Number(match.resultado_visitante);
      const won = isHome ? homeWon : !homeWon;

      if (isHome && won) stats.homeWins += 1;
      if (isHome && !won) stats.homeLosses += 1;
      if (isAway && won) stats.awayWins += 1;
      if (isAway && !won) stats.awayLosses += 1;

      stats.recentForm.push(won ? "G" : "P");
      stats.recentMatches.push(match);
    });

    stats.recentForm = stats.recentForm.slice(-5);
    stats.recentMatches = stats.recentMatches.slice(-5).reverse();
    stats.upcomingMatches = matches
      .filter((match) => !isPlayed(match) && (match.equipo_local === team.nombre || match.equipo_visitante === team.nombre))
      .sort((a, b) => `${a.fecha} ${a.horario || ""}`.localeCompare(`${b.fecha} ${b.horario || ""}`))
      .slice(0, 5);

    return stats;
  });
}

function AdvancedStandingsTable({ standings, teamByName, selectedTeamId, onSelectTeam }) {
  if (!standings.length) return null;

  return (
    <table className="standings-table standings-table--advanced">
      <thead>
        <tr>
          <th>#</th>
          <th>Equipo</th>
          <th>PJ</th>
          <th>PG</th>
          <th>PP</th>
          <th>PF</th>
          <th>PC</th>
          <th>Dif</th>
          <th>Pts</th>
          <th>%</th>
          <th>Local</th>
          <th>Visit.</th>
          <th>Ult.</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((team, index) => (
          <tr
            className={Number(selectedTeamId) === Number(team.id_equipo) ? "standings-row standings-row--active" : "standings-row"}
            key={team.id_equipo}
            onClick={() => onSelectTeam(team.id_equipo)}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectTeam(team.id_equipo);
            }}
          >
            <td>{index + 1}</td>
            <td><TeamNameWithShield name={team.nombre} teamByName={teamByName} /></td>
            <td>{team.partidos_jugados}</td>
            <td>{team.ganados}</td>
            <td>{team.perdidos}</td>
            <td>{team.puntos_favor}</td>
            <td>{team.puntos_contra}</td>
            <td>{team.diferencia}</td>
            <td><strong>{team.puntos}</strong></td>
            <td>{team.winRate}%</td>
            <td>{team.homeWins}-{team.homeLosses}</td>
            <td>{team.awayWins}-{team.awayLosses}</td>
            <td>
              <span className="form-strip">
                {team.recentForm.length ? team.recentForm.map((result, resultIndex) => (
                  <b className={result === "G" ? "form-pill form-pill--win" : "form-pill form-pill--loss"} key={`${team.id_equipo}-${resultIndex}`}>
                    {result}
                  </b>
                )) : "-"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StandingTeamSummary({ team, teamByName }) {
  if (!team) return <p className="state">Selecciona un equipo para ver el detalle.</p>;

  const teamInfo = teamByName?.get(team.nombre);

  return (
    <div className="standing-detail">
      <header className="standing-detail__header">
        <TeamShield team={teamInfo} name={team.nombre} size="lg" />
        <div>
          <h3>{team.nombre}</h3>
          <span>{teamInfo?.categoria || "Categoria sin dato"}</span>
        </div>
      </header>

      <dl className="standing-detail__stats">
        <div><dt>Puntos</dt><dd>{team.puntos}</dd></div>
        <div><dt>Diferencia</dt><dd>{team.diferencia}</dd></div>
        <div><dt>Record</dt><dd>{team.ganados}-{team.perdidos}</dd></div>
        <div><dt>Efectividad</dt><dd>{team.winRate}%</dd></div>
      </dl>
    </div>
  );
}

function StandingTeamMatches({ team }) {
  if (!team) return null;

  return (
    <section className="positions-matches full-span">
      <section className="panel">
        <div className="panel-title"><h2>Ultimos partidos</h2></div>
        <TeamMatchesTable matches={team.recentMatches} emptyText="Sin partidos jugados." />
      </section>

      <section className="panel">
        <div className="panel-title"><h2>Proximos partidos</h2></div>
        <TeamMatchesTable matches={team.upcomingMatches} emptyText="Sin partidos pendientes." />
      </section>
    </section>
  );
}

export default function StandingsView({ leagues, selectedLeagueId, setSelectedLeagueId, standings, loading, errors, teamByName, matches }) {
  const advancedStandings = useMemo(
    () => buildAdvancedStandings(standings, matches),
    [standings, matches],
  );
  const [selectedStandingId, setSelectedStandingId] = useState(null);
  const selectedTeam = advancedStandings.find((team) => Number(team.id_equipo) === Number(selectedStandingId)) || advancedStandings[0];

  return (
    <ViewLayout title="Posiciones">
      <section className="panel full-span">
        <div className="panel-title"><h2>Filtro</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          teams={[]}
        />
        <StatusMessage
          loading={loading.leagueDetail || loading.leagues}
          error={errors.leagueDetail || errors.leagues}
          empty={!loading.leagueDetail && standings.length === 0}
          emptyText="No hay clasificacion disponible."
        />
      </section>

      <section className="positions-workspace full-span">
        <section className="panel positions-table-panel">
          <div className="panel-title"><h2>Tabla avanzada</h2></div>
          <AdvancedStandingsTable
            standings={advancedStandings}
            teamByName={teamByName}
            selectedTeamId={selectedTeam?.id_equipo}
            onSelectTeam={setSelectedStandingId}
          />
        </section>

        <section className="panel positions-detail-panel">
          <div className="panel-title"><h2>Detalle del equipo</h2></div>
          <StandingTeamSummary team={selectedTeam} teamByName={teamByName} />
          <AdPlaceholder variant="box" image="/ads/quilmes-label.png" alt="Quilmes cerveza argentina" />
        </section>
      </section>

      <StandingTeamMatches team={selectedTeam} />
    </ViewLayout>
  );
}
