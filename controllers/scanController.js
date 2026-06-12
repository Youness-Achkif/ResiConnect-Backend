const db = require('../db');

// B-4 : vérifier un QR code (publique)
const verifierQR = async (req, res) => {
  const { token, residence_id } = req.body;

  try {
    const result = await db.query(
      `SELECT v.*, u.nom AS resident_nom, a.numero AS appartement
       FROM visiteurs v
       JOIN users u ON u.id = v.resident_id
       LEFT JOIN appartements a ON a.user_id = u.id
       WHERE v.token = $1`,
      [token]
    );

    // 1. Token invalide
    if (result.rows.length === 0) {
      await db.query(
        `INSERT INTO historique_acces (visiteur_id, residence_id, statut, raison_refus)
         VALUES (NULL, $1, 'refusé', 'QR Code invalide')`,
        [residence_id]
      );
      return res.status(400).json({ autorise: false, raison: 'QR Code invalide' });
    }

    const v = result.rows[0];

    // 2. Mauvaise résidence
    if (v.residence_id !== parseInt(residence_id, 10)) {
      return res.status(400).json({ autorise: false, raison: 'QR Code non valide pour cette résidence' });
    }

    // 3. Annulé
    if (v.statut === 'annulé') {
      await db.query(
        `INSERT INTO historique_acces (visiteur_id, residence_id, statut, raison_refus)
         VALUES ($1, $2, 'refusé', 'QR Code annulé')`,
        [v.id, v.residence_id]
      );
      return res.status(400).json({ autorise: false, raison: 'QR Code annulé' });
    }

    // 4. Expiré
    if (new Date(v.date_validite) < new Date()) {
      await db.query(
        `INSERT INTO historique_acces (visiteur_id, residence_id, statut, raison_refus)
         VALUES ($1, $2, 'refusé', 'QR Code expiré')`,
        [v.id, v.residence_id]
      );
      return res.status(400).json({ autorise: false, raison: 'QR Code expiré' });
    }

    // 5. Max utilisations atteint
    if (v.utilisations >= v.max_utilisations) {
      await db.query(
        `INSERT INTO historique_acces (visiteur_id, residence_id, statut, raison_refus)
         VALUES ($1, $2, 'refusé', 'Nombre maximum d\'utilisations atteint')`,
        [v.id, v.residence_id]
      );
      return res.status(400).json({ autorise: false, raison: 'QR Code déjà utilisé' });
    }

    // 6. Accès autorisé
    await db.query(
      'UPDATE visiteurs SET utilisations = utilisations + 1 WHERE id = $1',
      [v.id]
    );
    await db.query(
      `INSERT INTO historique_acces (visiteur_id, residence_id, statut)
       VALUES ($1, $2, 'autorisé')`,
      [v.id, v.residence_id]
    );

    res.json({
      autorise: true,
      visiteur: {
        nom: v.nom,
        type: v.type,
        resident_nom: v.resident_nom,
        appartement: v.appartement,
        utilisations_restantes: v.max_utilisations - v.utilisations - 1,
      },
    });
  } catch (err) {
    console.error('verifierQR error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// B-5 : authentification gardien par code résidence + PIN (publique)
const scanLogin = async (req, res) => {
  const { code_residence, pin } = req.body;

  try {
    const result = await db.query(
      `SELECT id, nom, pin_gardien FROM residences
       WHERE UPPER(code) = UPPER($1)`,
      [code_residence]
    );

    if (result.rows.length === 0 || result.rows[0].pin_gardien !== pin) {
      return res.status(401).json({ error: 'Code résidence ou PIN incorrect' });
    }

    const r = result.rows[0];
    res.json({ residence_id: r.id, residence_nom: r.nom });
  } catch (err) {
    console.error('scanLogin error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { verifierQR, scanLogin };
