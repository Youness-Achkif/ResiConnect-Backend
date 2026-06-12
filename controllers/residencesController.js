const db = require('../db');

// RES-1
const getMesResidences = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*,
         COUNT(DISTINCT b.id)::int  AS nb_batiments,
         COUNT(DISTINCT a.id)::int  AS nb_appartements,
         COUNT(DISTINCT u.id)::int  AS nb_residents
       FROM residences r
       LEFT JOIN batiments b   ON b.residence_id = r.id
       LEFT JOIN appartements a ON a.residence_id = r.id
       LEFT JOIN users u        ON u.residence_id = r.id AND u.role = 'resident'
       WHERE r.gestionnaire_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getMesResidences error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// RES-2
const creerResidence = async (req, res) => {
  const { nom, adresse } = req.body;

  if (!nom) {
    return res.status(400).json({ error: 'Le champ nom est obligatoire.' });
  }

  try {
    let code;
    while (true) {
      code = 'RC-' + Math.floor(1000 + Math.random() * 9000);
      const exists = await db.query('SELECT id FROM residences WHERE code = $1', [code]);
      if (exists.rows.length === 0) break;
    }

    const result = await db.query(
      `INSERT INTO residences (nom, adresse, gestionnaire_id, code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nom, adresse || null, req.user.id, code]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('creerResidence error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// B-3
const searchResidences = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    let result;
    if (q.toUpperCase().startsWith('RC-')) {
      result = await db.query(
        `SELECT r.id, r.nom, r.adresse, r.code,
                COUNT(a.id) FILTER (WHERE a.user_id IS NULL) AS apparts_libres
         FROM residences r
         LEFT JOIN appartements a ON a.residence_id = r.id
         WHERE UPPER(r.code) = UPPER($1)
         GROUP BY r.id`,
        [q]
      );
    } else {
      result = await db.query(
        `SELECT r.id, r.nom, r.adresse, r.code,
                COUNT(a.id) FILTER (WHERE a.user_id IS NULL) AS apparts_libres
         FROM residences r
         LEFT JOIN appartements a ON a.residence_id = r.id
         WHERE r.nom ILIKE '%' || $1 || '%'
         GROUP BY r.id`,
        [q]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('searchResidences error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// RES-3
const modifierResidence = async (req, res) => {
  const { nom, adresse } = req.body;

  if (!nom && adresse === undefined) {
    return res.status(400).json({ error: 'Au moins un champ (nom ou adresse) est requis.' });
  }

  try {
    const current = await db.query(
      'SELECT * FROM residences WHERE id = $1 AND gestionnaire_id = $2',
      [req.params.id, req.user.id]
    );

    if (current.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const row = current.rows[0];
    const result = await db.query(
      `UPDATE residences SET nom = $1, adresse = $2
       WHERE id = $3 AND gestionnaire_id = $4
       RETURNING *`,
      [nom || row.nom, adresse !== undefined ? adresse : row.adresse, req.params.id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('modifierResidence error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// RES-4
const supprimerResidence = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM residences WHERE id = $1 AND gestionnaire_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ message: 'Résidence supprimée.', id: parseInt(req.params.id, 10) });
  } catch (err) {
    console.error('supprimerResidence error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// B-7 : gestionnaire définit le PIN gardien
const definirPin = async (req, res) => {
  const { pin } = req.body;

  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: 'Le PIN doit contenir entre 4 et 6 chiffres.' });
  }

  try {
    const result = await db.query(
      `UPDATE residences SET pin_gardien = $1
       WHERE id = $2 AND gestionnaire_id = $3
       RETURNING id`,
      [pin, req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    res.json({ message: 'PIN mis à jour' });
  } catch (err) {
    console.error('definirPin error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { getMesResidences, creerResidence, modifierResidence, supprimerResidence, searchResidences, definirPin };
