import { useEffect, useMemo, useState } from "react";
import AdminPanel from "./AdminPanel.jsx";
import { getCategories } from "./api/categories";
import { API_BASE_URL } from "./api/client";
import { getCoaches } from "./api/coaches";
import { getLeagueById, getLeagues, getLeagueStandings } from "./api/leagues";
import { getMatches } from "./api/matches";
import { getPlayers } from "./api/players";
import { getTeamById, getTeams } from "./api/teams";
import { VIEWS } from "./constants";
import FixtureView from "./views/FixtureView";
import HomeView from "./views/HomeView";
import PlayoffsView from "./views/PlayoffsView";
import StandingsView from "./views/StandingsView";
import TeamsView from "./views/TeamsView";

function App() {
  const [view, setView] = useState("inicio");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminSession, setAdminSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminSession")) || null;
    } catch {
      return null;
    }
  });
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [categories, setCategories] = useState([]);
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
    categories: true,
    leagueDetail: false,
    teamDetail: false,
  });
  const [errors, setErrors] = useState({
    leagues: "",
    teams: "",
    matches: "",
    players: "",
    coaches: "",
    categories: "",
    leagueDetail: "",
    teamDetail: "",
  });

  const refreshPublicData = async () => {
    setLoading((current) => ({
      ...current,
      leagues: true,
      teams: true,
      matches: true,
      players: true,
      coaches: true,
      categories: true,
    }));

    const results = await Promise.allSettled([
      getLeagues(),
      getTeams(),
      getMatches(),
      getPlayers(),
      getCoaches(),
      getCategories(),
    ]);

    const [leaguesResult, teamsResult, matchesResult, playersResult, coachesResult, categoriesResult] = results;

    if (leaguesResult.status === "fulfilled") {
      setLeagues(leaguesResult.value);
      setSelectedLeagueId((current) => current ?? leaguesResult.value[0]?.id_liga ?? null);
      setErrors((current) => ({ ...current, leagues: "" }));
    } else {
      setErrors((current) => ({ ...current, leagues: leaguesResult.reason.message }));
    }

    if (teamsResult.status === "fulfilled") {
      setTeams(teamsResult.value);
      setErrors((current) => ({ ...current, teams: "" }));
    } else {
      setErrors((current) => ({ ...current, teams: teamsResult.reason.message }));
    }

    if (matchesResult.status === "fulfilled") {
      setMatches(matchesResult.value);
      setErrors((current) => ({ ...current, matches: "" }));
    } else {
      setErrors((current) => ({ ...current, matches: matchesResult.reason.message }));
    }

    if (playersResult.status === "fulfilled") {
      setPlayers(playersResult.value);
      setErrors((current) => ({ ...current, players: "" }));
    } else {
      setErrors((current) => ({ ...current, players: playersResult.reason.message }));
    }

    if (coachesResult.status === "fulfilled") {
      setCoaches(coachesResult.value);
      setErrors((current) => ({ ...current, coaches: "" }));
    } else {
      setErrors((current) => ({ ...current, coaches: coachesResult.reason.message }));
    }

    if (categoriesResult.status === "fulfilled") {
      setCategories(categoriesResult.value);
      setErrors((current) => ({ ...current, categories: "" }));
    } else {
      setErrors((current) => ({ ...current, categories: categoriesResult.reason.message }));
    }

    setLoading((current) => ({
      ...current,
      leagues: false,
      teams: false,
      matches: false,
      players: false,
      coaches: false,
      categories: false,
    }));
  };

  useEffect(() => {
    refreshPublicData();
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

  const handleAdminLogin = (session) => {
    setAdminSession(session);
    localStorage.setItem("adminSession", JSON.stringify(session));
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    localStorage.removeItem("adminSession");
  };

  const handleViewChange = (viewId) => {
    setView(viewId);
    setMobileNavOpen(false);
  };

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
    adminSession,
    refreshPublicData,
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <img src="/branding/liga-metropolitana-logo.png" alt="" />
          </div>
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

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={mobileNavOpen}
          aria-controls="main-navigation"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <span aria-hidden="true"></span>
          <span>Menu</span>
        </button>

        <nav
          id="main-navigation"
          className={mobileNavOpen ? "main-nav main-nav--open" : "main-nav"}
          aria-label="Navegacion principal"
        >
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? "main-nav__active" : ""}
              onClick={() => handleViewChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {view === "inicio" && <HomeView {...viewProps} />}
      {view === "equipos" && <TeamsView {...viewProps} />}
      {view === "fixture" && <FixtureView {...viewProps} />}
      {view === "posiciones" && <StandingsView {...viewProps} />}
      {view === "playoffs" && <PlayoffsView {...viewProps} />}
      {view === "admin" && (
        <AdminPanel
          session={adminSession}
          onLogin={handleAdminLogin}
          onLogout={handleAdminLogout}
          leagues={leagues}
          teams={teams}
          players={players}
          coaches={coaches}
          categories={categories}
          matches={matches}
          refreshData={refreshPublicData}
        />
      )}

      <footer className="site-footer">
        <nav>
          {VIEWS.map((item) => (
            <button key={item.id} type="button" onClick={() => handleViewChange(item.id)}>{item.label}</button>
          ))}
        </nav>
        <p>Liga Metropolitana de Basket - Datos publicos - API {API_BASE_URL}</p>
      </footer>
    </div>
  );
}

export default App;
