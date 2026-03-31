const jwt = require("jsonwebtoken");

// Vérifie le token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide" });
    }

    req.user = user; // { id, email, role }
    next();
  });
};

// Vérifie les rôles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    next();
  };
};
