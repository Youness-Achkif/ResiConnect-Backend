const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { sendActivationEmail } = require('../utils/mailer');

// AUTH-1 : public, crée uniquement un gestionnaire
const register = async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);

    const result = await db.query(
      `INSERT INTO users (nom, email, mot_de_passe, role, is_active)
       VALUES ($1, $2, $3, 'gestionnaire', TRUE)
       RETURNING id, nom, email, role`,
      [nom, email, hash]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// AUTH-8 : vérifie is_active
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

    if (!user.is_active) {
      return res.status(403).json({ error: 'Compte non activé, vérifiez vos emails' });
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

const supprimerUser = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }

  try {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, nom, email, role',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    res.json({ message: 'Utilisateur supprimé.', user: result.rows[0] });
  } catch (err) {
    console.error('supprimerUser error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// AUTH-7 : gestionnaire d'une résidence spécifique
const getGestionnaireByResidence = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nom
       FROM users u
       JOIN residences r ON r.gestionnaire_id = u.id
       WHERE r.id = $1`,
      [req.params.residenceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gestionnaire introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('getGestionnaireByResidence error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// AUTH-4 : invitation d'un résident (protégée par isGestionnaire + checkResidenceOwner)
const inviterResident = async (req, res) => {
  const { nom, email, appartement_id } = req.body;
  const residence_id = req.residence_id; // posé par checkResidenceOwner

  if (!nom || !email) {
    return res.status(400).json({ error: 'Champs obligatoires : nom, email.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Cette adresse email est déjà utilisée par un autre compte.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const result = await db.query(
      `INSERT INTO users (nom, email, mot_de_passe, role, residence_id, activation_token, token_expiry, is_active)
       VALUES ($1, $2, '', 'resident', $3, $4, $5, FALSE)
       RETURNING id`,
      [nom, email, residence_id, token, tokenExpiry]
    );

    if (appartement_id) {
      await db.query(
        'UPDATE appartements SET user_id = $1 WHERE id = $2',
        [result.rows[0].id, appartement_id]
      );
    }

    const lien = process.env.FRONTEND_URL + '/activate/' + token;
    await sendActivationEmail(email, nom, lien);

    res.status(201).json({ message: 'Invitation envoyée à ' + email });
  } catch (err) {
    console.error('inviterResident error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// AUTH-5 : vérification du token d'activation
const activateToken = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT email, nom FROM users
       WHERE activation_token = $1 AND token_expiry > NOW()`,
      [req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    res.json({ valid: true, email: result.rows[0].email, nom: result.rows[0].nom });
  } catch (err) {
    console.error('activateToken error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// AUTH-6 : définition du mot de passe
const setPassword = async (req, res) => {
  const { token, mot_de_passe } = req.body;

  if (!token || !mot_de_passe) {
    return res.status(400).json({ error: 'Champs obligatoires : token, mot_de_passe.' });
  }

  try {
    const hash = await bcrypt.hash(mot_de_passe, 10);

    const result = await db.query(
      `UPDATE users
       SET mot_de_passe = $1, is_active = TRUE, activation_token = NULL, token_expiry = NULL
       WHERE activation_token = $2 AND token_expiry > NOW()`,
      [hash, token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Lien expiré' });
    }

    res.json({ message: 'Compte activé avec succès' });
  } catch (err) {
    console.error('setPassword error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// B-2 : inscription résident en autonomie
const registerResident = async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    const result = await db.query(
      `INSERT INTO users (nom, email, mot_de_passe, role, is_active)
       VALUES ($1, $2, $3, 'resident', TRUE)
       RETURNING id, nom, email, role`,
      [nom, email, hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('registerResident error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nom, u.email, u.role, u.residence_id,
              r.nom AS residence_nom, r.adresse AS residence_adresse
       FROM users u
       LEFT JOIN residences r ON r.id = u.residence_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  register,
  login,
  supprimerUser,
  getGestionnaireByResidence,
  inviterResident,
  activateToken,
  setPassword,
  getMe,
  registerResident,
};
