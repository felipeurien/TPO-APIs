const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

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
router.post("/", verificarToken, postPartido);
router.put("/:id", verificarToken, putPartido);
router.patch("/:id/resultado", verificarToken, patchResultadoPartido);
router.delete("/:id", verificarToken, deletePartido);

module.exports = router;
