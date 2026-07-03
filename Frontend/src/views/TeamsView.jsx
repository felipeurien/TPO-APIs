import {
  AdPlaceholder,
  DataTable,
  StatusMessage,
  TeamShield,
  ViewFilters,
  ViewLayout,
  getPersonName,
} from "../components/shared";

function TeamDetail({ team }) {
  return (
    <div className="team-profile">
      <header className="team-profile__header">
        <TeamShield team={team} name={team.nombre} size="lg" />
        <div>
          <h3>{team.nombre}</h3>
          <p>{team.descripcion || "Sin descripcion disponible."}</p>
        </div>
      </header>

      <dl className="team-profile__meta">
        <div><dt>Liga</dt><dd>{team.liga_nombre || "Sin liga"}</dd></div>
        <div><dt>Categoria</dt><dd>{team.categoria || "Sin dato"}</dd></div>
        <div><dt>Entrenador</dt><dd>{team.entrenador ? getPersonName(team.entrenador) : "Sin entrenador asignado"}</dd></div>
        <div><dt>Estado</dt><dd>{team.activo ? "Activo" : "Inactivo"}</dd></div>
      </dl>

      <div className="team-profile__grid">
        <section>
          <h4>Plantel</h4>
          <DataTable>
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Categoria</th>
              </tr>
            </thead>
            <tbody>
              {(team.jugadores || []).map((player) => (
                <tr key={player.id_jugador}>
                  <td>{getPersonName(player)}</td>
                  <td>{player.categoria || "Sin categoria"}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {(!team.jugadores || team.jugadores.length === 0) && <p className="muted">Sin jugadores cargados.</p>}
        </section>

        <AdPlaceholder variant="box" image="/ads/camel.png" alt="Camel" />
      </div>
    </div>
  );
}

export default function TeamsView({ leagues, selectedLeagueId, setSelectedLeagueId, teams, selectedTeamId, setSelectedTeamId, teamDetail, loading, errors }) {
  return (
    <ViewLayout title="Equipos">
      <section className="panel full-span">
        <div className="panel-title"><h2>Filtro</h2></div>
        <ViewFilters
          leagues={leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
        />
      </section>

      <section className="teams-workspace full-span">
        <section className="panel teams-index-panel">
          <div className="panel-title"><h2>Equipos</h2></div>
          <StatusMessage
            loading={loading.teams}
            error={errors.teams}
            empty={!loading.teams && teams.length === 0}
            emptyText="No se encontraron equipos."
          />
          <div className="team-directory team-directory--cards">
            {teams.map((team) => (
              <button
                key={team.id_equipo}
                type="button"
                className={Number(selectedTeamId) === Number(team.id_equipo) ? "team-card team-card--active" : "team-card"}
                onClick={() => setSelectedTeamId(team.id_equipo)}
              >
                <TeamShield team={team} name={team.nombre} size="lg" />
                <span>
                  <strong>{team.nombre}</strong>
                  <em>{team.categoria || "Sin categoria"}</em>
                  <small>{team.entrenador_nombre ? `${team.entrenador_nombre} ${team.entrenador_apellido || ""}` : "Sin entrenador"}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel team-detail-panel">
          <div className="panel-title"><h2>Ficha del equipo</h2></div>
          <StatusMessage
            loading={loading.teamDetail}
            error={errors.teamDetail}
            empty={!selectedTeamId && !loading.teams}
            emptyText="Selecciona un equipo para ver entrenador y plantel."
          />
          {teamDetail && !loading.teamDetail && <TeamDetail team={teamDetail} />}
        </section>
      </section>

      <section className="full-span">
        <AdPlaceholder variant="wide" image="/ads/quilmes-logo.png" alt="Quilmes cerveza argentina" />
      </section>
    </ViewLayout>
  );
}
