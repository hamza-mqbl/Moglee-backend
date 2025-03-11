const mysql = require('mysql2');

// MySQL Connection Configuration using client's credentials
const db = mysql.createConnection({
  host: 'mysql-192552-0.cloudclusters.net',
  port: 10045,
  user: 'admin',
  password: 'XpvokiFi',
  database: 'moglee_v2',
  charset: 'utf8mb4'  // Ensuring proper character encoding
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database: moglee_v2');
  }
});

module.exports = db;
