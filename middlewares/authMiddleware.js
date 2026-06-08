const jwt = require('jsonwebtoken');
const db = require('../db');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou malformé.' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

// AUTH-2
const isGestionnaire = (req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') {
    return res.status(403).json({ error: 'Réservé aux gestionnaires' });
  }
  next();
};

// AUTH-3
const checkResidenceOwner = async (req, res, next) => {
  const residence_id = req.params.residence_id
    || req.params.residenceId
    || req.body.residence_id
    || req.query.residence_id;

  if (!residence_id) {
    return res.status(400).json({ error: 'residence_id requis.' });
  }

  try {
    const result = await db.query(
      'SELECT id FROM residences WHERE id = $1 AND gestionnaire_id = $2',
      [residence_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    req.residence_id = parseInt(residence_id, 10);
    next();
  } catch (err) {
    console.error('checkResidenceOwner error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { authMiddleware, isGestionnaire, checkResidenceOwner };
