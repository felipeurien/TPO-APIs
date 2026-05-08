const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

const {
  getAdministradores,
  postAdministradores,
} = require("../controllers/administradores.controller");

router.get("/", verificarToken, getAdministradores);
router.post("/", verificarToken, postAdministradores);

module.exports = router;
