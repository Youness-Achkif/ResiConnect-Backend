const db = require('../db');

const getTousResidents = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { residence_id } = req.query;
  if (!residence_id) return res.json([]);

  try {
    const result = await db.query(
      `SELECT u.id, u.nom, u.email, u.is_active, u.residence_id, u.created_at,
              a.id AS appartement_id, a.numero, a.etage
       FROM users u
       LEFT JOIN appartements a ON a.user_id = u.id
       WHERE u.role = 'resident' AND u.residence_id = $1
       ORDER BY u.nom ASC`,
      [residence_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTousResidents error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getResident = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.nom, u.email, u.created_at,
              a.id AS appartement_id, a.numero, a.etage
       FROM users u
       LEFT JOIN appartements a ON a.user_id = u.id
       WHERE u.id = $1 AND u.role = 'resident'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Résident introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('getResident error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const modifierResident = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { nom, email } = req.body;

  if (!nom && !email) {
    return res.status(400).json({ message: 'Au moins un champ (nom ou email) est requis.' });
  }

  try {
    const current = await db.query(
      `SELECT id, nom, email FROM users WHERE id = $1 AND role = 'resident'`,
      [req.params.id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Résident introuvable.' });
    }

    const nouvNom = nom || current.rows[0].nom;
    const nouvEmail = email || current.rows[0].email;

    if (email && email !== current.rows[0].email) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.params.id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
      }
    }

    const result = await db.query(
      `UPDATE users SET nom = $1, email = $2 WHERE id = $3
       RETURNING id, nom, email, role, created_at`,
      [nouvNom, nouvEmail, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('modifierResident error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const supprimerResident = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  try {
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 AND role = 'resident' RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Résident introuvable.' });
    }

    res.json({ message: 'Résident supprimé.', id: result.rows[0].id });
  } catch (err) {
    console.error('supprimerResident error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getProfilResident = async (req, res) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ message: 'Accès réservé aux résidents.' });
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.nom, u.email, u.created_at,
              a.id AS appartement_id, a.numero, a.etage
       FROM users u
       LEFT JOIN appartements a ON a.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('getProfilResident error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getTousResidents, getResident, modifierResident, supprimerResident, getProfilResident };
