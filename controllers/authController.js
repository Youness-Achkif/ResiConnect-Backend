const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const register = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { nom, email, mot_de_passe, role } = req.body;

  if (!nom || !email || !mot_de_passe || !role) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }

  if (!['gestionnaire', 'resident'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);

    const result = await db.query(
      'INSERT INTO users (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role, created_at',
      [nom, email, hash, role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { register, login };
