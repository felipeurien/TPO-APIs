import {
  AdRotator,
  LeagueTitleSelect,
  StandingsTable,
  StatusMessage,
  TeamNameWithShield,
  TeamShield,
} from "../components/shared";
import {
  formatShortDate,
  getDateKey,
  getLeagueRound,
  getScore,
  isPlayed,
  parseDateKey,
} from "../utils/formatters";

function getCalendarMonth(matches) {
  const upcoming = matches
    .filter((match) => !isPlayed(match))
    .map((match) => parseDateKey(match.fecha))
    .filter(Boolean)
    .sort((a, b) => a.key.localeCompare(b.key));

  if (upcoming[0]) return upcoming[0];

  return matches
    .map((match) => parseDateKey(match.fecha))
    .filter(Boolean)
    .sort((a, b) => b.key.localeCompare(a.key))[0];
}

function MatchCarousel({ matches, teamByName, loading, error }) {
  if (loading || error || matches.length === 0) {
    return (
      <section className="match-carousel-panel">
        <StatusMessage
          loading={loading}
          error={error}
          empty={!loading && matches.length === 0}
          emptyText="No hay resultados jugados."
        />
      </section>
    );
  }

  const shouldScroll = matches.length > 2;
  const items = shouldScroll ? [...matches, ...matches] : matches;

  return (
    <section className="match-carousel-panel" aria-label="Resultados recientes">
      <div className="match-carousel">
        <div
          className={
            shouldScroll
              ? "match-carousel__track"
              : "match-carousel__track match-carousel__track--static"
          }
        >
          {items.map((match, index) => (
            <article
              className="match-carousel__item"
              key={`${match.id_partido}-${index}`}
            >
              <strong className="match-carousel__status">
                Resultado final
              </strong>
              <div className="match-carousel__teams">
                <div>
                  <TeamShield
                    team={teamByName.get(match.equipo_local)}
                    name={match.equipo_local}
                  />
                  <b title={match.equipo_local}>{match.equipo_local}</b>
                </div>
                <span className="match-carousel__score">{getScore(match)}</span>
                <div>
                  <TeamShield
                    team={teamByName.get(match.equipo_visitante)}
                    name={match.equipo_visitante}
                  />
                  <b title={match.equipo_visitante}>{match.equipo_visitante}</b>
                </div>
              </div>
              <small>
                {formatShortDate(match.fecha)} - {match.horario || "--:--"}
              </small>
              <em>{match.lugar || "Sede a confirmar"}</em>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MatchCalendar({ matches }) {
  const calendarMonth = getCalendarMonth(matches);

  if (!calendarMonth) {
    return <p className="state">No hay partidos para armar el calendario.</p>;
  }

  const monthMatches = matches.filter((match) => {
    const parts = parseDateKey(match.fecha);
    return (
      parts?.year === calendarMonth.year &&
      parts?.monthIndex === calendarMonth.monthIndex
    );
  });
  const matchesByDate = monthMatches.reduce((accumulator, match) => {
    const key = getDateKey(match.fecha);
    accumulator[key] = accumulator[key]
      ? [...accumulator[key], match]
      : [match];
    return accumulator;
  }, {});
  const daysInMonth = new Date(
    calendarMonth.year,
    calendarMonth.monthIndex + 1,
    0,
  ).getDate();
  const firstDayOffset =
    (new Date(calendarMonth.year, calendarMonth.monthIndex, 1).getDay() + 6) %
    7;
  const calendarCells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const monthLabel = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date(calendarMonth.year, calendarMonth.monthIndex, 1));
  const matchDays = Object.entries(matchesByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .slice(0, 5);

  return (
    <div className="match-calendar">
      <strong className="match-calendar__month">{monthLabel}</strong>
      <div className="match-calendar__weekdays" aria-hidden="true">
        {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="match-calendar__grid">
        {calendarCells.map((day, index) => {
          if (!day)
            return (
              <span className="match-calendar__empty" key={`empty-${index}`} />
            );

          const key = `${calendarMonth.year}-${String(calendarMonth.monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayMatches = matchesByDate[key] || [];

          return (
            <span
              className={
                dayMatches.length
                  ? "match-calendar__day match-calendar__day--match"
                  : "match-calendar__day"
              }
              title={
                dayMatches.length
                  ? `${dayMatches.length} partido${dayMatches.length > 1 ? "s" : ""}`
                  : ""
              }
              key={key}
            >
              {day}
              {dayMatches.length > 0 && <small>{dayMatches.length}</small>}
            </span>
          );
        })}
      </div>
      <div className="match-calendar__agenda">
        {matchDays.map(([date, dayMatches]) => (
          <div key={date}>
            <b>{formatShortDate(date)}</b>
            <span>
              {dayMatches.length} partido{dayMatches.length > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeSidebar({ matches }) {
  const sidebarAds = [
    { image: "/ads/quilmes-logo.png", alt: "Quilmes cerveza argentina" },
    { image: "/ads/seven-up.png", alt: "7UP" },
    { image: "/ads/pepsi-small.jpg", alt: "Pepsi" },
  ];

  return (
    <aside className="home-side-column">
      <section className="panel ad-panel ad-panel--plain">
        <AdRotator ads={sidebarAds} />
      </section>

      <section className="panel calendar-panel">
        <div className="panel-title">
          <h2>Calendario</h2>
        </div>
        <MatchCalendar matches={matches} />
      </section>
    </aside>
  );
}

export default function HomeView({
  leagues,
  selectedLeagueId,
  setSelectedLeagueId,
  loading,
  errors,
  matches,
  standings,
  leagueDetail,
  teamByName,
  setView,
}) {
  const playedMatches = matches.filter(isPlayed);
  const recentPlayedDates = [
    ...new Set(playedMatches.map((match) => String(match.fecha).slice(0, 10))),
  ]
    .sort()
    .slice(-2);
  const recentPlayedMatches = playedMatches
    .filter((match) =>
      recentPlayedDates.includes(String(match.fecha).slice(0, 10)),
    )
    .sort((a, b) =>
      `${a.fecha} ${a.horario || ""}`.localeCompare(
        `${b.fecha} ${b.horario || ""}`,
      ),
    )
    .reverse();
  const latestResults = recentPlayedMatches.slice(0, 6);
  const upcomingMatches = matches
    .filter((match) => !isPlayed(match))
    .slice(0, 6);
  const currentRound = getLeagueRound(leagueDetail);

  return (
    <main className="home-grid">
      <section className="full-span">
        <MatchCarousel
          matches={recentPlayedMatches}
          teamByName={teamByName}
          loading={loading.matches}
          error={errors.matches}
        />
      </section>

      <section className="home-main-column">
        <section className="panel standings-panel standings-panel--home">
          <div className="panel-title panel-title--with-select">
            <div className="home-league-title">
              <LeagueTitleSelect
                leagues={leagues}
                selectedLeagueId={selectedLeagueId}
                setSelectedLeagueId={setSelectedLeagueId}
              />
              <span className="home-league-meta">
                Temporada {leagueDetail?.temporada_actual || "2026"}
              </span>
              {currentRound && (
                <span className="home-league-meta">Fecha {currentRound}</span>
              )}
            </div>
            <button
              type="button"
              className="text-link text-link--light"
              onClick={() => setView("posiciones")}
            >
              Ver tabla completa
            </button>
          </div>
          <StatusMessage
            loading={loading.leagueDetail || loading.leagues}
            error={errors.leagueDetail || errors.leagues}
            empty={!loading.leagueDetail && standings.length === 0}
            emptyText="No hay clasificacion disponible."
          />
          <StandingsTable
            standings={standings}
            teamByName={teamByName}
            compact
          />
        </section>

        <div className="two-up">
          <section className="panel">
            <div className="panel-title">
              <h2>Ultimos resultados</h2>
              <button
                type="button"
                className="text-link text-link--light"
                onClick={() => setView("fixture")}
              >
                Fixture
              </button>
            </div>
            <table className="data-table home-match-table home-match-table--results">
              <tbody>
                {latestResults.map((match) => (
                  <tr key={match.id_partido}>
                    <td data-label="Fecha">{formatShortDate(match.fecha)}</td>
                    <td data-label="Local">
                      <TeamNameWithShield
                        name={match.equipo_local}
                        teamByName={teamByName}
                      />
                    </td>
                    <td data-label="Local">
                      <strong>{match.resultado_local}</strong>
                    </td>
                    <td aria-hidden="true">-</td>
                    <td data-label="Visitante">
                      <strong>{match.resultado_visitante}</strong>
                    </td>
                    <td data-label="Visitante">
                      <TeamNameWithShield
                        name={match.equipo_visitante}
                        teamByName={teamByName}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>Proximos partidos</h2>
              <button
                type="button"
                className="text-link text-link--light"
                onClick={() => setView("fixture")}
              >
                Fixture
              </button>
            </div>
            <table className="data-table home-match-table home-match-table--upcoming">
              <tbody>
                {upcomingMatches.map((match) => (
                  <tr key={match.id_partido}>
                    <td data-label="Fecha">{formatShortDate(match.fecha)}</td>
                    <td data-label="Hora">{match.horario || "--:--"}</td>
                    <td data-label="Local">
                      <TeamNameWithShield
                        name={match.equipo_local}
                        teamByName={teamByName}
                      />
                    </td>
                    <td aria-hidden="true">vs.</td>
                    <td data-label="Visitante">
                      <TeamNameWithShield
                        name={match.equipo_visitante}
                        teamByName={teamByName}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </section>

      <HomeSidebar matches={matches} />
    </main>
  );
}
