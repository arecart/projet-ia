import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'Andoni',
  password: process.env.DB_PASSWORD || 'Neren07753358!',
  database: process.env.DB_NAME || 'projet_ia',
  connectionLimit: 5,
});

async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Connexion à la base de données réussie.');

    // Test d'une requête simple
    const rows = await conn.query('SELECT * FROM users LIMIT 5');
    console.log('Résultat de la requête:', rows);
  } catch (err) {
    console.error('Erreur lors de la connexion à la base de données:', err);
  } finally {
    if (conn) conn.release(); // Libérer la connexion
  }
}

testConnection();