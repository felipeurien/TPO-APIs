const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

const {
  getLigas,
  getLigaById,
  getClasificacionLiga,
  getPlayoffsLiga,
  postGenerarPlayoffsLiga,
  postActualizarPlayoffsLiga,
  postLiga,
  putLiga,
  deleteLiga,
} = require("../controllers/ligas.controller");

router.get("/", getLigas);
router.get("/:id/clasificacion", getClasificacionLiga);
router.get("/:id/playoffs", getPlayoffsLiga);
router.post("/:id/playoffs/generar", verificarToken, postGenerarPlayoffsLiga);
router.post("/:id/playoffs/actualizar", verificarToken, postActualizarPlayoffsLiga);
router.get("/:id", getLigaById);
router.post("/", verificarToken, postLiga);
router.put("/:id", verificarToken, putLiga);
router.delete("/:id", verificarToken, deleteLiga);

module.exports = router;
