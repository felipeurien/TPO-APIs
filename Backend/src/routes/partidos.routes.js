const express = require("express");
const router = express.Router();

const {
  getPartidos,
  getPartidoById,
  postPartido,
  putPartido,
  patchResultadoPartido,
  deletePartido,
} = require("../controllers/partidos.controller");

// Rutas publicas
router.get("/", getPartidos);
router.get("/:id", getPartidoById);

// Rutas que requieren Auth
router.post("/", postPartido);
router.put("/:id", putPartido);
router.patch("/:id/resultado", patchResultadoPartido);
router.delete("/:id", deletePartido);

module.exports = router;
