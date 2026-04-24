const express = require("express");
const router = express.Router();

const {
  getAdministradores,
} = require("../controllers/administradores.controller");

router.get("/", getAdministradores);

module.exports = router;
