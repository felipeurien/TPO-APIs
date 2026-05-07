const express = require("express");
const cors = require("cors");

const administradoresRoutes = require("./routes/administradores.routes");
const authRoutes = require("./routes/auth.routes");
const entrenadoresRoutes = require("./routes/entrenadores.routes");
const equiposRoutes = require("./routes/equipos.routes");
const jugadoresRoutes = require("./routes/jugadores.routes");
const partidosRoutes = require("./routes/partidos.routes");
const ligas = require("");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend funcionando" });
});

app.use("/administradores", administradoresRoutes);
app.use("/auth", authRoutes);
app.use("/entrenadores", entrenadoresRoutes);
app.use("/equipos", equiposRoutes);
app.use("/jugadores", jugadoresRoutes);
app.use("/partidos", partidosRoutes);

module.exports = app;
