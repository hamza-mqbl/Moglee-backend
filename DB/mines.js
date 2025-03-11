const mysql = require('mysql2');

// MySQL Connection Configuration
const db = mysql.createConnection({
  host: 'localhost',   // Change this if MySQL is on another machine
  user: 'Hamza-Maqbool',
  password: 'Awais@#786',
  database: 'world',   // Use the 'world' database
  port: 3306           // Default MySQL port
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database: world');
  }
});

module.exports = db; // Corrected export
