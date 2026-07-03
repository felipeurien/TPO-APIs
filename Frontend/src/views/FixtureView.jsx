import {
  AdPlaceholder,
  DataTable,
  StatusMessage,
  ViewFilters,
  ViewLayout,
} from "../components/shared";
import {
  formatDate,
  getDateKey,
  getScore,
  isPlayed,
} from "../utils/formatters";

function groupMatchesByDate(matches) {
  const groups = new Map();

  matches.forEach((match) => {
    const roundNumber = getRoundNumber(match);
    const dateKey = getDateKey(match.fecha);
    const groupKey = roundNumber ? `round-${roundNumber}` : `date-${dateKey}`;
    const group = groups.get(groupKey) || {
      key: groupKey,
      roundNumber,
      dates: new Set(),
      matches: [],
    };
    group.dates.add(dateKey);
    group.matches.push(match);
    groups.set(groupKey, group);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    dates: [...group.dates].sort((a, b) => a.localeCompare(b)),
    matches: group.matches.sort((a, b) => `${a.fecha} ${a.horario || ""}`.localeCompare(`${b.fecha} ${b.horario || ""}`)),
  }));
}

function getRoundNumber(match) {
  return match.numero_fecha ? Number(match.numero_fecha) : null;
}

function FixtureDateSection({ dates, matches, statusLabel, roundNumber }) {
  const dateLabel = dates.map(formatDate).join(" / ");

  return (
    <section className="fixture-date-section">
      <header>
        <div>
          <strong>{roundNumber ? `Fecha ${roundNumber}` : "Sin numero de fecha"}</strong>
          <small>{dateLabel}</small>
        </div>
        <span>{statusLabel}</span>
      </header>
      <DataTable className="fixture-table">
        <thead>
          <tr>
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
  );
}

export default function FixtureView({ leagues, selectedLeagueId, setSelectedLeagueId, matches, loading, errors }) {
  const playedGroups = groupMatchesByDate(matches.filter(isPlayed))
    .sort((a, b) => (b.roundNumber || 0) - (a.roundNumber || 0) || b.dates[0].localeCompare(a.dates[0]));
  const scheduledGroups = groupMatchesByDate(matches.filter((match) => !isPlayed(match)))
    .sort((a, b) => (a.roundNumber || 9999) - (b.roundNumber || 9999) || a.dates[0].localeCompare(b.dates[0]));

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

      <section className="full-span">
        <AdPlaceholder variant="wide" image="/ads/pepsi.png" alt="Pepsi" />
      </section>

      <section className="panel full-span">
        <div className="panel-title"><h2>Partidos y resultados</h2></div>
        <StatusMessage
          loading={loading.matches}
          error={errors.matches}
          empty={!loading.matches && matches.length === 0}
          emptyText="No se encontraron partidos."
        />
        <div className="fixture-date-list">
          {playedGroups.map((group) => (
            <FixtureDateSection
              key={`played-${group.key}`}
              dates={group.dates}
              matches={group.matches}
              roundNumber={group.roundNumber}
              statusLabel="Jugados"
            />
          ))}
          {scheduledGroups.map((group) => (
            <FixtureDateSection
              key={`scheduled-${group.key}`}
              dates={group.dates}
              matches={group.matches}
              roundNumber={group.roundNumber}
              statusLabel="Programados"
            />
          ))}
        </div>
      </section>
    </ViewLayout>
  );
}
