const express = require("express");
const router = express.Router();

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
router.post("/", postEntrenador);
router.put("/:id", putEntrenador);
router.delete("/:id", deleteEntrenador);

module.exports = router;
