const express = require("express");
const router = express.Router();

const {
  getLigas,
  getLigaById,
  postLiga,
} = require("../controllers/ligas.controller");

router.get("/", getLigas);
router.get("/:id", getLigaById);
router.post("/", postLiga);

module.exports = router;
