const db = require('../db');

// BAT-1
const getBatiments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*
       FROM batiments b
       JOIN residences r ON r.id = b.residence_id
       WHERE b.residence_id = $1 AND r.gestionnaire_id = $2
       ORDER BY b.nom`,
      [req.params.residenceId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getBatiments error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// BAT-2
const creerBatiment = async (req, res) => {
  const { nom } = req.body;

  if (!nom) {
    return res.status(400).json({ error: 'Le champ nom est obligatoire.' });
  }

  try {
    const ownerCheck = await db.query(
      'SELECT id FROM residences WHERE id = $1 AND gestionnaire_id = $2',
      [req.params.residenceId, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await db.query(
      'INSERT INTO batiments (nom, residence_id) VALUES ($1, $2) RETURNING *',
      [nom, req.params.residenceId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('creerBatiment error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// BAT-3
const supprimerBatiment = async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM batiments
       USING residences
       WHERE batiments.id = $1
         AND batiments.residence_id = residences.id
         AND residences.gestionnaire_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ message: 'Bâtiment supprimé' });
  } catch (err) {
    console.error('supprimerBatiment error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { getBatiments, creerBatiment, supprimerBatiment };
