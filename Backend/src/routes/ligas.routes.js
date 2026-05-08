const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

const {
  getLigas,
  getLigaById,
  postLiga,
} = require("../controllers/ligas.controller");

router.get("/", getLigas);
router.get("/:id", getLigaById);
router.post("/", verificarToken, postLiga);

module.exports = router;
