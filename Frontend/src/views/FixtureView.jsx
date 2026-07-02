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
    const dateKey = getDateKey(match.fecha);
    const group = groups.get(dateKey) || [];
    group.push(match);
    groups.set(dateKey, group);
  });

  return [...groups.entries()].map(([date, dateMatches]) => ({
    date,
    matches: dateMatches.sort((a, b) => (a.horario || "").localeCompare(b.horario || "")),
  }));
}

function buildRoundLookup(matches) {
  return [...new Set(matches.map((match) => getDateKey(match.fecha)))]
    .sort((a, b) => a.localeCompare(b))
    .reduce((rounds, date, index) => {
      rounds[date] = index + 1;
      return rounds;
    }, {});
}

function FixtureDateSection({ date, matches, statusLabel, roundNumber }) {
  return (
    <section className="fixture-date-section">
      <header>
        <div>
          <strong>Fecha {roundNumber}</strong>
          <small>{formatDate(date)}</small>
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
  const roundLookup = buildRoundLookup(matches);
  const playedGroups = groupMatchesByDate(matches.filter(isPlayed))
    .sort((a, b) => b.date.localeCompare(a.date));
  const scheduledGroups = groupMatchesByDate(matches.filter((match) => !isPlayed(match)))
    .sort((a, b) => a.date.localeCompare(b.date));

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
              key={`played-${group.date}`}
              date={group.date}
              matches={group.matches}
              roundNumber={roundLookup[group.date]}
              statusLabel="Jugados"
            />
          ))}
          {scheduledGroups.map((group) => (
            <FixtureDateSection
              key={`scheduled-${group.date}`}
              date={group.date}
              matches={group.matches}
              roundNumber={roundLookup[group.date]}
              statusLabel="Programados"
            />
          ))}
        </div>
      </section>
    </ViewLayout>
  );
}
