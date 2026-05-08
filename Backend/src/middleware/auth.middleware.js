const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      ok: false,
      message: "Token requerido",
    });
  }

  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      ok: false,
      message: "Formato de token invalido",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = {
      id_administrador: payload.id_administrador,
      username: payload.username,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Token invalido o expirado",
    });
  }
};

module.exports = verificarToken;
