const express = require("express");
const router = express.Router();

const {
  getAdministradores,
  postAdministradores,
} = require("../controllers/administradores.controller");

router.get("/", getAdministradores);
router.post("/", postAdministradores);

module.exports = router;
