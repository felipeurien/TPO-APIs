const express = require("express");
const cors = require("cors");

const administradoresRoutes = require("./routes/administradores.routes");
const authRoutes = require("./routes/auth.routes");
const entrenadoresRoutes = require("./routes/entrenadores.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend funcionando" });
});

app.use("/administradores", administradoresRoutes);
app.use("/auth", authRoutes);
app.use("/entrenadores", entrenadoresRoutes);

module.exports = app;
