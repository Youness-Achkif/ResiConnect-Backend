const db = require('../db');

// APT-1
const getAppartements = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*,
         b.nom AS batiment_nom,
         u.nom AS resident_nom, u.email AS resident_email
       FROM appartements a
       LEFT JOIN batiments b ON b.id = a.batiment_id
       LEFT JOIN users u     ON u.id = a.user_id
       WHERE a.residence_id = $1
       ORDER BY b.nom, a.numero`,
      [req.params.residenceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAppartements error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// APT-2
const creerAppartement = async (req, res) => {
  const { numero, batiment_id, residence_id } = req.body;

  if (!numero) {
    return res.status(400).json({ error: 'Le champ numero est obligatoire.' });
  }

  const rid = residence_id || req.params.residenceId;

  try {
    const ownerCheck = await db.query(
      'SELECT id FROM residences WHERE id = $1 AND gestionnaire_id = $2',
      [rid, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await db.query(
      `INSERT INTO appartements (numero, batiment_id, residence_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [numero, batiment_id || null, rid]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('creerAppartement error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// APT-3
const assignerResident = async (req, res) => {
  const { user_id } = req.body;

  try {
    const result = await db.query(
      'UPDATE appartements SET user_id = $1 WHERE id = $2 RETURNING *',
      [user_id || null, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Appartement introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('assignerResident error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// APT-4
const supprimerAppartement = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM appartements WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Appartement introuvable.' });
    }
    res.json({ message: 'Appartement supprimé.', id: result.rows[0].id });
  } catch (err) {
    console.error('supprimerAppartement error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { getAppartements, creerAppartement, assignerResident, supprimerAppartement };
