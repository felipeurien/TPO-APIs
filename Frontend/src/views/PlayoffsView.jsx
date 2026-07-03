import { useEffect, useMemo, useState } from "react";
import {
  generateLeaguePlayoffs,
  getLeaguePlayoffs,
  refreshLeaguePlayoffs,
} from "../api/leagues";
import {
  DataTable,
  StatusMessage,
  TeamNameWithShield,
  ViewFilters,
  ViewLayout,
} from "../components/shared";
import { formatDate, getScore } from "../utils/formatters";

const ROUND_LABELS = {
  semifinal: "Semifinal",
  final: "Final",
};

function PlayoffMatch({ match }) {
  if (!match) return <p className="muted">Partido pendiente de generarse.</p>;

  const score = getScore(match);
  const hasResult = score !== "vs.";

  return (
    <div className="playoff-match">
      <small>
        {formatDate(match.fecha)} {match.horario ? `- ${String(match.horario).slice(0, 5)}` : ""} - {match.lugar || "Sede a confirmar"}
      </small>
      {hasResult && <strong className="playoff-match__score">Resultado: {score}</strong>}
    </div>
  );
}

function PlayoffSeriesCard({ series, teamByName }) {
  const match = series.partidos?.[0];

  return (
    <article className="playoff-card">
      <header>
        <span>{ROUND_LABELS[series.ronda] || series.ronda}</span>
        <strong>{series.estado === "finalizada" ? "Finalizada" : "Pendiente"}</strong>
      </header>
      <div className="playoff-seeds">
        <span>#{series.seed_equipo_1}</span>
        <TeamNameWithShield name={series.equipo_1} teamByName={teamByName} />
        <b>vs.</b>
        <span>#{series.seed_equipo_2}</span>
        <TeamNameWithShield name={series.equipo_2} teamByName={teamByName} />
      </div>
      <PlayoffMatch match={match} />
      {series.ganador && <p className="playoff-winner">Ganador: {series.ganador}</p>}
    </article>
  );
}

function PlayoffBracket({ series, teamByName }) {
  const semifinals = series.filter((item) => item.ronda === "semifinal");
  const finals = series.filter((item) => item.ronda === "final");

  if (!series.length) {
    return <p className="state">Todavia no hay playoffs generados para esta liga.</p>;
  }

  return (
    <div className="playoff-bracket">
      <section>
        <h3>Semifinales</h3>
        <div className="playoff-column">
          {semifinals.map((item) => <PlayoffSeriesCard key={item.id_serie} series={item} teamByName={teamByName} />)}
        </div>
      </section>
      <section>
        <h3>Final</h3>
        <div className="playoff-column">
          {finals.length ? finals.map((item) => <PlayoffSeriesCard key={item.id_serie} series={item} teamByName={teamByName} />) : (
            <article className="playoff-card playoff-card--empty">
              <p>Cargá los resultados de las semifinales y actualizá para generar la final.</p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

function QualifiersTable({ teams, teamByName }) {
  if (!teams.length) return null;

  return (
    <DataTable className="qualifiers-table">
      <thead>
        <tr>
          <th>Seed</th>
          <th>Equipo</th>
          <th>Pts</th>
          <th>Dif</th>
          <th>Record</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((team, index) => (
          <tr key={team.id_equipo}>
            <td>{index + 1}</td>
            <td><TeamNameWithShield name={team.nombre} teamByName={teamByName} /></td>
            <td><strong>{team.puntos}</strong></td>
            <td>{team.diferencia}</td>
            <td>{team.ganados}-{team.perdidos}</td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

export default function PlayoffsView({
  leagues,
  selectedLeagueId,
  setSelectedLeagueId,
  teamByName,
  adminSession,
  refreshPublicData,
}) {
  const [playoffs, setPlayoffs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = adminSession?.token;
  const series = useMemo(() => playoffs?.series || [], [playoffs]);

  const loadPlayoffs = async () => {
    if (!selectedLeagueId) return;

    setLoading(true);
    setError("");

    try {
      setPlayoffs(await getLeaguePlayoffs(selectedLeagueId));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayoffs();
  }, [selectedLeagueId]);

  const handleAction = async (action) => {
    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const response = action === "generate"
        ? await generateLeaguePlayoffs(selectedLeagueId, token)
        : await refreshLeaguePlayoffs(selectedLeagueId, token);

      setMessage(action === "generate" ? "Playoffs generados." : "Playoffs actualizados.");
      setPlayoffs(response);
      await refreshPublicData?.();
      await loadPlayoffs();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ViewLayout title="Playoffs">
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
        <div className="panel-title panel-title--playoffs">
          <h2>Clasificados</h2>
          {token && (
            <div className="panel-actions">
              <button type="button" onClick={() => handleAction("generate")} disabled={actionLoading || !selectedLeagueId || series.length > 0}>
                Generar cuadro
              </button>
              <button type="button" onClick={() => handleAction("refresh")} disabled={actionLoading || !selectedLeagueId || series.length === 0}>
                Actualizar
              </button>
            </div>
          )}
        </div>
        <p className="muted">Formato: partido unico. Semifinales 1 vs 4 y 2 vs 3; el mejor clasificado juega de local.</p>
        <StatusMessage loading={loading} error={error} empty={false} />
        {message && <p className="state state--ok">{message}</p>}
        <QualifiersTable teams={playoffs?.clasificados || []} teamByName={teamByName} />
      </section>

      <section className="panel full-span">
        <div className="panel-title"><h2>Cuadro</h2></div>
        <PlayoffBracket series={series} teamByName={teamByName} />
      </section>
    </ViewLayout>
  );
}
