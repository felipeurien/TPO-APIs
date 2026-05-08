const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

const {
  getJugadores,
  getJugadorById,
  postJugador,
  putJugador,
  deleteJugador,
} = require("../controllers/jugadores.controller");

// Rutas publicas
router.get("/", getJugadores);
router.get("/:id", getJugadorById);

// Rutas que requieren Auth
router.post("/", verificarToken, postJugador);
router.put("/:id", verificarToken, putJugador);
router.delete("/:id", verificarToken, deleteJugador);

module.exports = router;
