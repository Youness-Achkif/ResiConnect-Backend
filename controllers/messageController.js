const db = require('../db');

const getMessages = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*,
              e.nom AS expediteur_nom, e.email AS expediteur_email,
              d.nom AS destinataire_nom, d.email AS destinataire_email
       FROM messages m
       JOIN users e ON e.id = m.expediteur_id
       JOIN users d ON d.id = m.destinataire_id
       WHERE m.expediteur_id = $1 OR m.destinataire_id = $1
       ORDER BY m.date_envoi ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const envoyerMessage = async (req, res) => {
  const { destinataire_id, contenu } = req.body;

  if (!destinataire_id || !contenu) {
    return res.status(400).json({ message: 'Champs obligatoires : destinataire_id, contenu.' });
  }

  if (Number(destinataire_id) === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer un message à vous-même.' });
  }

  try {
    const destCheck = await db.query('SELECT id FROM users WHERE id = $1', [destinataire_id]);
    if (destCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Destinataire introuvable.' });
    }

    const result = await db.query(
      `INSERT INTO messages (expediteur_id, destinataire_id, contenu)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, destinataire_id, contenu]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('envoyerMessage error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const marquerLu = async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE messages SET lu = TRUE
       WHERE id = $1 AND destinataire_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message introuvable ou non autorisé.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('marquerLu error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getMessages, envoyerMessage, marquerLu };
