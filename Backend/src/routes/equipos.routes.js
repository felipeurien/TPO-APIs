const express = require("express");
const router = express.Router();

const {
  getEquipos,
  getEquipoById,
  postEquipo,
  putEquipo,
  deleteEquipo,
} = require("../controllers/equipos.controller");

// Rutas publicas
router.get("/", getEquipos);
router.get("/:id", getEquipoById);

// Rutas que requieren Auth
router.post("/", postEquipo);
router.put("/:id", putEquipo);
router.delete("/:id", deleteEquipo);

module.exports = router;
