const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

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
router.post("/", verificarToken, postEquipo);
router.put("/:id", verificarToken, putEquipo);
router.delete("/:id", verificarToken, deleteEquipo);

module.exports = router;
