require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const hash = await bcrypt.hash('12345678', 12);

  const result = await pool.query(
    `UPDATE users
     SET email = $1, mot_de_passe = $2
     WHERE email = 'youness.achkif@gmail.com'
     RETURNING id, email`,
    ['gestionnaire.resiconnect@gmail.com', hash]
  );

  if (result.rowCount === 0) {
    console.error('Aucun compte trouvé avec email youness.achkif@gmail.com');
    process.exit(1);
  }

  console.log('Mise à jour réussie :', result.rows[0]);
  await pool.end();
})().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
