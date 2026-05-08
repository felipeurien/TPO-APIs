const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

const {
  getEntrenadores,
  getEntrenadorById,
  postEntrenador,
  putEntrenador,
  deleteEntrenador,
} = require("../controllers/entrenadores.controller");

// Rutas publicas
router.get("/", getEntrenadores);
router.get("/:id", getEntrenadorById);

// Rutas que requieren Auth
router.post("/", verificarToken, postEntrenador);
router.put("/:id", verificarToken, putEntrenador);
router.delete("/:id", verificarToken, deleteEntrenador);

module.exports = router;
