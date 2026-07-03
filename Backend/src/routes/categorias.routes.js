const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/auth.middleware");

const {
  getCategorias,
  postCategoria,
  putCategoria,
  deleteCategoria,
} = require("../controllers/categorias.controller");

router.get("/", getCategorias);
router.post("/", verificarToken, postCategoria);
router.put("/:id", verificarToken, putCategoria);
router.delete("/:id", verificarToken, deleteCategoria);

module.exports = router;
