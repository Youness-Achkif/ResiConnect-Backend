const db = require('../db');

const getTousAppartements = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  try {
    const result = await db.query(
      `SELECT a.id, a.numero, a.etage,
              u.id AS resident_id, u.nom AS resident_nom, u.email AS resident_email
       FROM appartements a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.etage ASC, a.numero ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTousAppartements error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const creerAppartement = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { numero, etage, user_id } = req.body;

  if (!numero || etage === undefined || etage === null) {
    return res.status(400).json({ message: 'Champs obligatoires : numero, etage.' });
  }

  if (isNaN(etage)) {
    return res.status(400).json({ message: "L'étage doit être un nombre." });
  }

  try {
    if (user_id) {
      const userCheck = await db.query(
        `SELECT id, role FROM users WHERE id = $1`,
        [user_id]
      );
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Utilisateur introuvable.' });
      }
      if (userCheck.rows[0].role !== 'resident') {
        return res.status(400).json({ message: 'Un appartement ne peut être assigné qu\'à un résident.' });
      }
    }

    const result = await db.query(
      `INSERT INTO appartements (numero, etage, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [numero, etage, user_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('creerAppartement error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const modifierAppartement = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { numero, etage } = req.body;

  if (!numero && etage === undefined) {
    return res.status(400).json({ message: 'Au moins un champ (numero ou etage) est requis.' });
  }

  if (etage !== undefined && isNaN(etage)) {
    return res.status(400).json({ message: "L'étage doit être un nombre." });
  }

  try {
    const current = await db.query(
      `SELECT * FROM appartements WHERE id = $1`,
      [req.params.id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Appartement introuvable.' });
    }

    const nouvNumero = numero || current.rows[0].numero;
    const nouvEtage = etage !== undefined ? etage : current.rows[0].etage;

    const result = await db.query(
      `UPDATE appartements SET numero = $1, etage = $2 WHERE id = $3 RETURNING *`,
      [nouvNumero, nouvEtage, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('modifierAppartement error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const supprimerAppartement = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  try {
    const result = await db.query(
      `DELETE FROM appartements WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appartement introuvable.' });
    }

    res.json({ message: 'Appartement supprimé.', id: result.rows[0].id });
  } catch (err) {
    console.error('supprimerAppartement error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getTousAppartements, creerAppartement, modifierAppartement, supprimerAppartement };
