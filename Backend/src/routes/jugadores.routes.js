const express = require("express");
const router = express.Router();

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
router.post("/", postJugador);
router.put("/:id", putJugador);
router.delete("/:id", deleteJugador);

module.exports = router;
