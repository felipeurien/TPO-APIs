import { useEffect, useMemo, useState } from "react";
import { createAdmin, getAdmins } from "./api/admins";
import { loginAdmin } from "./api/auth";
import { createCategory, deleteCategory, updateCategory } from "./api/categories";
import { createCoach, deleteCoach, updateCoach } from "./api/coaches";
import { createLeague, deleteLeague, updateLeague } from "./api/leagues";
import { createMatch, deleteMatch, updateMatch, updateMatchResult } from "./api/matches";
import { createPlayer, deletePlayer, updatePlayer } from "./api/players";
import { createTeam, deleteTeam, updateTeam } from "./api/teams";

const ADMIN_TABS = [
  { id: "partidos", label: "Partidos" },
  { id: "equipos", label: "Equipos" },
  { id: "jugadores", label: "Jugadores" },
  { id: "ligas", label: "Ligas" },
  { id: "categorias", label: "Categorias" },
  { id: "entrenadores", label: "Entrenadores" },
  { id: "admins", label: "Admins" },
];

const EMPTY_FORMS = {
  ligas: { nombre: "", temporada_actual: "2026", descripcion: "", activa: true },
  equipos: {
    nombre: "",
    categoria: "",
    id_liga: "",
    id_entrenador: "",
    descripcion: "",
    escudo_url: "",
    activo: true,
  },
  jugadores: { nombre: "", apellido: "", categoria: "", id_equipo: "" },
  categorias: { nombre: "", descripcion: "", activa: true },
  entrenadores: { nombre: "", apellido: "" },
  partidos: {
    id_equipo_local: "",
    id_equipo_visitante: "",
    id_liga: "",
    fecha: "",
    numero_fecha: "",
    horario: "",
    lugar: "",
    resultado_local: "",
    resultado_visitante: "",
    estado: "programado",
  },
  admins: { username: "", password: "" },
  resultado: { resultado_local: "", resultado_visitante: "" },
};

const EMPTY_FILTERS = {
  categoria: "",
  id_equipo: "",
  estado: "",
  fase: "",
};

function cleanPayload(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value === "") return [key, null];
      if (key.startsWith("id_") || key.startsWith("resultado_") || key === "numero_fecha") return [key, Number(value)];
      return [key, value];
    }),
  );
}

function personName(person) {
  return [person?.nombre, person?.apellido].filter(Boolean).join(" ") || "Sin nombre";
}

function matchLabel(match) {
  return `${match.equipo_local || match.id_equipo_local} vs. ${match.equipo_visitante || match.id_equipo_visitante}`;
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "es"))
    .map((value) => ({ value, label: value }));
}

function getRowTeamIds(tab, row) {
  if (tab === "partidos") return [row.id_equipo_local, row.id_equipo_visitante].filter(Boolean).map(Number);
  if (tab === "equipos") return [row.id_equipo].filter(Boolean).map(Number);
  if (tab === "jugadores") return [row.id_equipo].filter(Boolean).map(Number);
  return [];
}

function getRowCategories(tab, row, teamById) {
  const ownCategory = row.categoria ? [row.categoria] : [];
  const teamCategories = getRowTeamIds(tab, row)
    .map((teamId) => teamById.get(Number(teamId))?.categoria)
    .filter(Boolean);

  return [...ownCategory, ...teamCategories];
}

function matchesAdminFilters(tab, row, filters, teamById) {
  const teamIds = getRowTeamIds(tab, row);
  const categories = getRowCategories(tab, row, teamById);

  if (filters.id_equipo && !teamIds.includes(Number(filters.id_equipo))) return false;
  if (filters.categoria && !categories.includes(filters.categoria)) return false;
  if (tab === "partidos" && filters.estado && row.estado !== filters.estado) return false;
  if (tab === "partidos" && filters.fase && (row.fase || "regular") !== filters.fase) return false;

  return true;
}

function getAdminRowId(tab, row) {
  const idsByTab = {
    partidos: row.id_partido,
    equipos: row.id_equipo,
    jugadores: row.id_jugador,
    ligas: row.id_liga,
    entrenadores: row.id_entrenador,
    categorias: row.id_categoria,
    admins: row.id_administrador,
  };

  return idsByTab[tab];
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginAdmin(form);
      onLogin({ token: response.token, user: response.data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="view-page">
      <header className="view-title"><h2>Administracion</h2></header>
      <section className="panel admin-login">
        <div className="panel-title"><h2>Ingreso admin</h2></div>
        <form className="admin-form" onSubmit={submit}>
          <label>
            Usuario
            <input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="state state--error">{error}</p>}
          <button type="submit" className="admin-button" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminField({ label, children }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}

function TextInput({ value, onChange, type = "text", required = false }) {
  return <input type={type} value={value ?? ""} required={required} onChange={(event) => onChange(event.target.value)} />;
}

function SelectInput({ value, onChange, options, placeholder, required = false }) {
  return (
    <select value={value ?? ""} required={required} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function AdminForm({ tab, form, setForm, editingId, onSubmit, onCancel, leagues, teams, coaches, categories }) {
  const leagueOptions = leagues.map((league) => ({ value: league.id_liga, label: league.nombre }));
  const categoryOptions = categories
    .filter((category) => category.activa)
    .map((category) => ({ value: category.nombre, label: category.nombre }));
  const playerTeamOptions = teams
    .filter((team) => !form.categoria || team.categoria === form.categoria)
    .map((team) => ({ value: team.id_equipo, label: team.nombre }));
  const matchTeamOptions = teams
    .filter((team) => !form.id_liga || Number(team.id_liga) === Number(form.id_liga))
    .map((team) => ({ value: team.id_equipo, label: team.nombre }));
  const coachOptions = coaches.map((coach) => ({ value: coach.id_entrenador, label: personName(coach) }));
  const update = (key, value) => setForm((current) => ({
    ...current,
    [key]: value,
    ...(tab === "jugadores" && key === "categoria" ? { id_equipo: "" } : {}),
  }));

  return (
    <form className="admin-form admin-form--grid" onSubmit={onSubmit}>
      {tab === "ligas" && (
        <>
          <AdminField label="Nombre"><TextInput required value={form.nombre} onChange={(value) => update("nombre", value)} /></AdminField>
          <AdminField label="Temporada"><TextInput required value={form.temporada_actual} onChange={(value) => update("temporada_actual", value)} /></AdminField>
          <AdminField label="Descripcion"><TextInput value={form.descripcion} onChange={(value) => update("descripcion", value)} /></AdminField>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.activa)} onChange={(event) => update("activa", event.target.checked)} /> Activa</label>
        </>
      )}

      {tab === "equipos" && (
        <>
          <AdminField label="Nombre"><TextInput required value={form.nombre} onChange={(value) => update("nombre", value)} /></AdminField>
          <AdminField label="Categoria"><SelectInput required value={form.categoria} onChange={(value) => update("categoria", value)} options={categoryOptions} placeholder="Elegir categoria" /></AdminField>
          <AdminField label="Liga"><SelectInput required value={form.id_liga} onChange={(value) => update("id_liga", value)} options={leagueOptions} placeholder="Elegir liga" /></AdminField>
          <AdminField label="Entrenador"><SelectInput value={form.id_entrenador} onChange={(value) => update("id_entrenador", value)} options={coachOptions} placeholder="Sin entrenador" /></AdminField>
          <AdminField label="Descripcion"><TextInput value={form.descripcion} onChange={(value) => update("descripcion", value)} /></AdminField>
          <AdminField label="Escudo URL"><TextInput value={form.escudo_url} onChange={(value) => update("escudo_url", value)} /></AdminField>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.activo)} onChange={(event) => update("activo", event.target.checked)} /> Activo</label>
        </>
      )}

      {tab === "jugadores" && (
        <>
          <AdminField label="Nombre"><TextInput required value={form.nombre} onChange={(value) => update("nombre", value)} /></AdminField>
          <AdminField label="Apellido"><TextInput required value={form.apellido} onChange={(value) => update("apellido", value)} /></AdminField>
          <AdminField label="Categoria"><SelectInput required value={form.categoria} onChange={(value) => update("categoria", value)} options={categoryOptions} placeholder="Elegir categoria" /></AdminField>
          <AdminField label="Equipo"><SelectInput required value={form.id_equipo} onChange={(value) => update("id_equipo", value)} options={playerTeamOptions} placeholder="Elegir equipo" /></AdminField>
        </>
      )}

      {tab === "categorias" && (
        <>
          <AdminField label="Nombre"><TextInput required value={form.nombre} onChange={(value) => update("nombre", value)} /></AdminField>
          <AdminField label="Descripcion"><TextInput value={form.descripcion} onChange={(value) => update("descripcion", value)} /></AdminField>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.activa)} onChange={(event) => update("activa", event.target.checked)} /> Activa</label>
        </>
      )}

      {tab === "entrenadores" && (
        <>
          <AdminField label="Nombre"><TextInput required value={form.nombre} onChange={(value) => update("nombre", value)} /></AdminField>
          <AdminField label="Apellido"><TextInput required value={form.apellido} onChange={(value) => update("apellido", value)} /></AdminField>
        </>
      )}

      {tab === "partidos" && (
        <>
          <AdminField label="Liga"><SelectInput required value={form.id_liga} onChange={(value) => update("id_liga", value)} options={leagueOptions} placeholder="Elegir liga" /></AdminField>
          <AdminField label="Local"><SelectInput required value={form.id_equipo_local} onChange={(value) => update("id_equipo_local", value)} options={matchTeamOptions} placeholder="Equipo local" /></AdminField>
          <AdminField label="Visitante"><SelectInput required value={form.id_equipo_visitante} onChange={(value) => update("id_equipo_visitante", value)} options={matchTeamOptions} placeholder="Equipo visitante" /></AdminField>
          <AdminField label="Fecha"><TextInput required type="date" value={form.fecha} onChange={(value) => update("fecha", value)} /></AdminField>
          <AdminField label="Nro. fecha"><TextInput type="number" value={form.numero_fecha} onChange={(value) => update("numero_fecha", value)} /></AdminField>
          <AdminField label="Horario"><TextInput required type="time" value={form.horario} onChange={(value) => update("horario", value)} /></AdminField>
          <AdminField label="Lugar"><TextInput required value={form.lugar} onChange={(value) => update("lugar", value)} /></AdminField>
          <AdminField label="Estado">
            <select value={form.estado} onChange={(event) => update("estado", event.target.value)}>
              <option value="programado">programado</option>
              <option value="jugado">jugado</option>
              <option value="suspendido">suspendido</option>
            </select>
          </AdminField>
          <AdminField label="Resultado local"><TextInput type="number" value={form.resultado_local} onChange={(value) => update("resultado_local", value)} /></AdminField>
          <AdminField label="Resultado visitante"><TextInput type="number" value={form.resultado_visitante} onChange={(value) => update("resultado_visitante", value)} /></AdminField>
        </>
      )}

      {tab === "admins" && (
        <>
          <AdminField label="Usuario"><TextInput required value={form.username} onChange={(value) => update("username", value)} /></AdminField>
          <AdminField label="Password"><TextInput required type="password" value={form.password} onChange={(value) => update("password", value)} /></AdminField>
        </>
      )}

      <div className="admin-actions">
        <button type="submit" className="admin-button">{editingId ? "Guardar cambios" : "Crear"}</button>
        {editingId && <button type="button" className="admin-button admin-button--muted" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}

function ResultForm({ match, token, onDone }) {
  const [form, setForm] = useState({
    resultado_local: match.resultado_local ?? "",
    resultado_visitante: match.resultado_visitante ?? "",
  });
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await updateMatchResult(match.id_partido, cleanPayload(form), token);
      setMessage("Resultado cargado.");
      onDone();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <form className="result-form" onSubmit={submit}>
      <input type="number" min="0" value={form.resultado_local} onChange={(event) => setForm((current) => ({ ...current, resultado_local: event.target.value }))} />
      <input type="number" min="0" value={form.resultado_visitante} onChange={(event) => setForm((current) => ({ ...current, resultado_visitante: event.target.value }))} />
      <button type="submit" className="admin-button">OK</button>
      {message && <small>{message}</small>}
    </form>
  );
}

function AdminFilters({ tab, filters, setFilters, rows, teams, teamById }) {
  if (tab === "admins" || tab === "ligas" || tab === "entrenadores" || tab === "categorias") return null;

  const categories = uniqueOptions(rows.flatMap((row) => getRowCategories(tab, row, teamById)));
  const rowsMatchingCategory = filters.categoria
    ? rows.filter((row) => getRowCategories(tab, row, teamById).includes(filters.categoria))
    : rows;
  const teamIdsInRows = new Set(rowsMatchingCategory.flatMap((row) => getRowTeamIds(tab, row)));
  const teamOptions = teams
    .filter((team) => teamIdsInRows.has(Number(team.id_equipo)))
    .map((team) => ({ value: team.id_equipo, label: team.nombre }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
  const update = (key, value) => setFilters((current) => ({
    ...current,
    [key]: value,
    ...(key === "categoria" ? { id_equipo: "" } : {}),
  }));
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="admin-filters">
      <label>
        Categoria
        <select value={filters.categoria} onChange={(event) => update("categoria", event.target.value)}>
          <option value="">Todas</option>
          {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label>
        Equipo
        <select value={filters.id_equipo} onChange={(event) => update("id_equipo", event.target.value)}>
          <option value="">Todos</option>
          {teamOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {tab === "partidos" && (
        <>
          <label>
            Estado
            <select value={filters.estado} onChange={(event) => update("estado", event.target.value)}>
              <option value="">Todos</option>
              <option value="programado">programado</option>
              <option value="jugado">jugado</option>
              <option value="suspendido">suspendido</option>
            </select>
          </label>
          <label>
            Fase
            <select value={filters.fase} onChange={(event) => update("fase", event.target.value)}>
              <option value="">Todas</option>
              <option value="regular">regular</option>
              <option value="playoff">playoff</option>
            </select>
          </label>
        </>
      )}
      {hasFilters && (
        <button type="button" className="admin-button admin-button--muted" onClick={() => setFilters(EMPTY_FILTERS)}>
          Limpiar
        </button>
      )}
    </div>
  );
}

function AdminTable({ tab, rows, onEdit, onDelete, token, refreshData }) {
  if (!rows.length) return <p className="state">No hay registros.</p>;

  return (
    <div className="admin-table-wrap">
      <table className="data-table admin-table">
        <tbody>
          {rows.map((row) => {
            const id = getAdminRowId(tab, row);
            return (
              <tr key={`${tab}-${id}`}>
                <td>
                  <strong>
                    {row.nombre || row.username || matchLabel(row)}
                  </strong>
                  <span className="admin-row-note">
                    ID #{id}
                    {row.categoria ? ` - ${row.categoria}` : ""}
                    {row.temporada_actual ? ` - Temp. ${row.temporada_actual}` : ""}
                    {row.estado ? ` - ${row.estado}` : ""}
                    {row.fase && row.fase !== "regular" ? ` - ${row.fase}` : ""}
                    {row.ronda ? ` - ${row.ronda}` : ""}
                  </span>
                </td>
                {tab === "partidos" && (
                  <td>
                    <ResultForm match={row} token={token} onDone={refreshData} />
                  </td>
                )}
                <td className="admin-table__actions">
                  {tab !== "admins" && <button type="button" onClick={() => onEdit(row)}>Editar</button>}
                  {tab !== "admins" && <button type="button" onClick={() => onDelete(row)}>Borrar</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function prepareEditForm(tab, row) {
  if (tab === "partidos") {
    return {
      ...EMPTY_FORMS.partidos,
      ...row,
      fecha: row.fecha ? String(row.fecha).slice(0, 10) : "",
      numero_fecha: row.numero_fecha ?? "",
      horario: row.horario ? String(row.horario).slice(0, 5) : "",
      resultado_local: row.resultado_local ?? "",
      resultado_visitante: row.resultado_visitante ?? "",
    };
  }

  return { ...EMPTY_FORMS[tab], ...row };
}

export default function AdminPanel({ session, onLogin, onLogout, leagues, teams, players, coaches, categories, matches, refreshData }) {
  const [tab, setTab] = useState("partidos");
  const [form, setForm] = useState(EMPTY_FORMS.partidos);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [admins, setAdmins] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    setForm(EMPTY_FORMS[tab]);
    setEditingId(null);
    setMessage("");
    setFilters(EMPTY_FILTERS);
  }, [tab]);

  useEffect(() => {
    if (!session?.token) return;
    getAdmins(session.token).then(setAdmins).catch(() => setAdmins([]));
  }, [session?.token]);

  const rows = useMemo(() => ({
    ligas: leagues,
    equipos: teams,
    jugadores: players,
    categorias: categories,
    entrenadores: coaches,
    partidos: matches,
    admins,
  }), [admins, categories, coaches, leagues, matches, players, teams]);

  const teamById = useMemo(
    () => new Map(teams.map((team) => [Number(team.id_equipo), team])),
    [teams],
  );

  const filteredRows = useMemo(
    () => rows[tab].filter((row) => matchesAdminFilters(tab, row, filters, teamById)),
    [filters, rows, tab, teamById],
  );

  if (!session?.token) {
    return <AdminLogin onLogin={onLogin} />;
  }

  const token = session.token;

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = cleanPayload(form);

      if (tab === "ligas") {
        editingId ? await updateLeague(editingId, payload, token) : await createLeague(payload, token);
      } else if (tab === "equipos") {
        editingId ? await updateTeam(editingId, payload, token) : await createTeam(payload, token);
      } else if (tab === "jugadores") {
        editingId ? await updatePlayer(editingId, payload, token) : await createPlayer(payload, token);
      } else if (tab === "categorias") {
        editingId ? await updateCategory(editingId, payload, token) : await createCategory(payload, token);
      } else if (tab === "entrenadores") {
        editingId ? await updateCoach(editingId, payload, token) : await createCoach(payload, token);
      } else if (tab === "partidos") {
        editingId ? await updateMatch(editingId, payload, token) : await createMatch(payload, token);
      } else if (tab === "admins") {
        await createAdmin(payload, token);
        setAdmins(await getAdmins(token));
      }

      setMessage(editingId ? "Registro actualizado." : "Registro creado.");
      setForm(EMPTY_FORMS[tab]);
      setEditingId(null);
      await refreshData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const edit = (row) => {
    const id = getAdminRowId(tab, row);
    setEditingId(id);
    setForm(prepareEditForm(tab, row));
    setMessage("");
  };

  const remove = async (row) => {
    const id = getAdminRowId(tab, row);
    const label = row.nombre || row.username || matchLabel(row) || `ID #${id}`;

    if (!window.confirm(`¿Seguro que querés borrar "${label}"?`)) {
      return;
    }

    setMessage("");

    try {
      if (tab === "ligas") await deleteLeague(id, token);
      if (tab === "equipos") await deleteTeam(id, token);
      if (tab === "jugadores") await deletePlayer(id, token);
      if (tab === "categorias") await deleteCategory(id, token);
      if (tab === "entrenadores") await deleteCoach(id, token);
      if (tab === "partidos") await deleteMatch(id, token);
      setMessage("Registro eliminado.");
      await refreshData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <main className="view-page">
      <header className="view-title admin-title">
        <h2>Administracion</h2>
        <button type="button" className="admin-button admin-button--muted" onClick={onLogout}>Salir</button>
      </header>

      <section className="panel full-span">
        <div className="panel-title"><h2>Panel admin</h2><span>{session.user?.username}</span></div>
        <nav className="admin-tabs">
          {ADMIN_TABS.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "admin-tabs__active" : ""} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </section>

      <div className="admin-grid">
        <section className="panel">
          <div className="panel-title"><h2>{editingId ? "Editar" : "Nuevo"}</h2></div>
          <AdminForm
            tab={tab}
            form={form}
            setForm={setForm}
            editingId={editingId}
            onSubmit={submit}
            onCancel={() => {
              setEditingId(null);
              setForm(EMPTY_FORMS[tab]);
            }}
            leagues={leagues}
            teams={teams}
            coaches={coaches}
            categories={categories}
          />
          {message && <p className={message.includes("Error") || message.includes("No se") || message.includes("oblig") ? "state state--error" : "state"}>{message}</p>}
        </section>

        <section className="panel">
          <div className="panel-title"><h2>Registros</h2><span>{filteredRows.length}/{rows[tab].length}</span></div>
          <AdminFilters
            tab={tab}
            filters={filters}
            setFilters={setFilters}
            rows={rows[tab]}
            teams={teams}
            teamById={teamById}
          />
          <AdminTable
            tab={tab}
            rows={filteredRows}
            onEdit={edit}
            onDelete={remove}
            token={token}
            refreshData={refreshData}
          />
        </section>
      </div>
    </main>
  );
}
