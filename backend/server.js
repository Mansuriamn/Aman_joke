// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');
// const mysql = require('mysql');  // Import MySQL package

// dotenv.config();

// const _dirname = path.resolve();

// const app = express();
// app.use(express.json());
// app.use(cors());  // You can pass options if needed, e.g., cors({ origin: 'http://localhost:4000' })
// app.use(express.static(path.join(_dirname, "/frontend/dist")));

// // Create MySQL connection
// const db = mysql.createConnection({
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || 'root',
//   database: process.env.DB_NAME || 'joke'
// });

// // Connect to MySQL
// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err);
//   } else {
//     console.log('Connected to MySQL');
//   }
// });

// // Sample data
// // Get route for posts
// app.get('/post', (req, res) => {
//   // Example MySQL query
//   db.query('SELECT * FROM jokes', (err, results) => {
//     if (err) {
//       console.error('Error executing query:', err);
//       res.status(500).json({ error: 'Database query failed' });
//     } else {
//       res.json(results);
//     }
//   });
// });

// // Catch-all route for frontend
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"));
// });

// // Set up the server to listen on port 3000
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });


const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql');

dotenv.config();

const _dirname = path.resolve();
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(_dirname, "/frontend/dist")));

// Create MySQL connection pool instead of single connection
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'joke'
});

// Middleware to handle database errors
const handleDatabaseError = (err, req, res, next) => {
  console.error('Database error:', err);
  res.status(503).json({
    error: 'Database service temporarily unavailable',
    message: 'Please try again later'
  });
};

app.get('/post', (req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting database connection:', err);
      return next(err);
    }

    connection.query('SELECT * FROM jokes', (error, results) => {
      // Always release the connection back to the pool
      connection.release();
      
      if (error) {
        return next(error);
      }
      
      // Set cache headers
      res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      res.json(results);
    });
  });
});

app.use(handleDatabaseError);

// Catch-all route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});