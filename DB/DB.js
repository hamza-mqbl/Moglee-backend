const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
  host: 'mysql-192552-0.cloudclusters.net',
  port: 10045,
  user: 'admin',
  password: 'XpvokiFi',
  database: 'moglee_v2',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 2, // Adjust based on your needs
  queueLimit: 0
});

// Log when the pool is created
pool.on('connection', (connection) => {
  console.log('New connection established with database');
});

// Log when a connection is acquired from the pool
pool.on('acquire', (connection) => {
  console.log('Connection %d acquired', connection.threadId);
});

// Log when a connection is released back to the pool
pool.on('release', (connection) => {
  console.log('Connection %d released', connection.threadId);
});

// Log when a connection is enqueued
pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

// Log when the pool is closed
pool.on('end', () => {
  console.log('Pool has ended');
});

// Log any errors that occur with the pool
pool.on('error', (err) => {
  console.error('Pool error:', err);
});

// Test the pool connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error getting connection from pool:', err);
    return;
  }
  console.log('Successfully acquired connection from pool');

  // Release the connection back to the pool
  connection.release();
});

// Export the pool
module.exports = pool;