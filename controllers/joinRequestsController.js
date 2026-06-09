const db = require('../db');

// B-4 : résident envoie une demande d'adhésion
const envoyerDemande = async (req, res) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ message: 'Accès réservé aux résidents.' });
  }

  const { residence_id, appartement_id, message } = req.body;

  if (!residence_id) {
    return res.status(400).json({ message: 'residence_id est obligatoire.' });
  }

  try {
    const userCheck = await db.query('SELECT residence_id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows[0].residence_id) {
      return res.status(400).json({ message: 'Vous êtes déjà membre d\'une résidence.' });
    }

    const existing = await db.query(
      `SELECT id FROM join_requests
       WHERE resident_id = $1 AND residence_id = $2 AND statut = 'en attente'`,
      [req.user.id, residence_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Vous avez déjà une demande en attente pour cette résidence.' });
    }

    await db.query(
      `INSERT INTO join_requests (resident_id, residence_id, appartement_id, message)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, residence_id, appartement_id || null, message || null]
    );

    res.status(201).json({ message: 'Demande envoyée avec succès' });
  } catch (err) {
    console.error('envoyerDemande error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// B-5 : gestionnaire consulte les demandes en attente
const getDemandesEnAttente = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT jr.id, jr.statut, jr.message, jr.created_at,
              u.nom AS resident_nom, u.email AS resident_email,
              r.nom AS residence_nom,
              a.numero AS appartement_numero
       FROM join_requests jr
       JOIN users u ON u.id = jr.resident_id
       JOIN residences r ON r.id = jr.residence_id
       LEFT JOIN appartements a ON a.id = jr.appartement_id
       WHERE r.gestionnaire_id = $1
         AND jr.statut = 'en attente'
       ORDER BY jr.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getDemandesEnAttente error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// B-6 : gestionnaire accepte une demande (transaction)
const accepterDemande = async (req, res) => {
  const { id } = req.params;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const check = await client.query(
      `SELECT jr.*, r.gestionnaire_id
       FROM join_requests jr
       JOIN residences r ON r.id = jr.residence_id
       WHERE jr.id = $1 AND r.gestionnaire_id = $2 AND jr.statut = 'en attente'`,
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Demande introuvable ou non autorisée.' });
    }

    const jr = check.rows[0];

    await client.query(
      'UPDATE users SET residence_id = $1 WHERE id = $2',
      [jr.residence_id, jr.resident_id]
    );

    if (jr.appartement_id) {
      await client.query(
        'UPDATE appartements SET user_id = $1 WHERE id = $2',
        [jr.resident_id, jr.appartement_id]
      );
    }

    await client.query(
      "UPDATE join_requests SET statut = 'accepté' WHERE id = $1",
      [id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Demande acceptée' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('accepterDemande error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
};

// B-7 : gestionnaire refuse une demande
const refuserDemande = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE join_requests SET statut = 'refusé'
       WHERE id = $1
         AND residence_id IN (
           SELECT id FROM residences WHERE gestionnaire_id = $2
         )
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Demande introuvable ou non autorisée.' });
    }

    res.json({ message: 'Demande refusée' });
  } catch (err) {
    console.error('refuserDemande error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { envoyerDemande, getDemandesEnAttente, accepterDemande, refuserDemande };
