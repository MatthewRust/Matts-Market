import express from 'express';
import cors from 'cors';
import pg from 'pg';
import 'dotenv/config'; // Loads .env file (though Docker will handle most in this setup)
import { initializeSchema } from './db/schema.js';

const app = express();
const PORT = process.env.PORT || 8080;

// PostgreSQL Client Setup
const { Client } = pg;
const dbClient = new Client({
  host: process.env.PGHOST,       // 'postgres' - service name in docker-compose
  user: process.env.PGUSER,       // 'myuser'
  password: process.env.PGPASSWORD, // 'mysupersecretpassword'
  database: process.env.PGDATABASE, // 'appdb'
  port: 5432,
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Function to connect to DB and set up database schema
async function setupDatabase() {
  try {
    await dbClient.connect();
    console.log("✅ Successfully connected to PostgreSQL.");

    // Initialize database schema from separate file
    await initializeSchema(dbClient);

  } catch (err) {
    console.error("❌ Database connection error. Waiting for Postgres to be ready...", err.message);
    // In a production app, you'd implement a proper retry loop here.
    // Docker's depends_on helps, but doesn't guarantee the DB is fully ready.
  }
}

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    if (!dbClient._connected) {
      return res.status(503).json({ message: 'Database connection not ready.' });
    }
    const result = await dbClient.query('SELECT text, created_at FROM messages ORDER BY created_at DESC LIMIT 1');
    res.status(200).json({ 
        message: result.rows.length > 0 ? result.rows[0].text : 'No messages found.',
        timestamp: result.rows.length > 0 ? result.rows[0].created_at : null
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: 'Failed to fetch data.' });
  }
});

app.get('/', (req, res) => {
    res.status(200).send('Node.js Server is Running!');
});

// Start the server and connect to the database
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  setupDatabase();
});