import mariadb from 'mariadb';

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    socketPath: '/run/mysqld/mysqld.sock',
    connectionLimit: 5,
    connectTimeout: 30000, // 30s
    acquireTimeout: 30000  // 30s
});

export default pool;