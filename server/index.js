import express from 'express';
import cors from 'cors';
import pg from 'pg';
import 'dotenv/config'; // Loads .env file 
import { initializeSchema } from './db/schema.js';
import { setupAuthRoutes } from './routes/auth.js';
import { setupUserRoutes } from './routes/user.js';
import { eventsAPI } from './routes/events.js';
import { buySharesAPI } from './routes/buyShares.js';
import { sellSharesAPI } from './routes/sellShares.js';
import { startCornelius } from './routes/cornelius.js';
import { setupAdminRoutes } from './routes/adminAPIs.js';
import { setupGraphRoutes } from './routes/graph.js';
import { leaderboardAPI } from './routes/leaderboard.js';




const app = express();
const PORT = process.env.PORT || 8080;

// PostgreSQL Client Setup
const { Client } = pg;
const db = new Client({
  host: process.env.PGHOST,       // 'postgres' - service name in docker-compose
  user: process.env.PGUSER,       // 'myuser'
  password: process.env.PGPASSWORD, // 'mysupersecretpassword'
  database: process.env.PGDATABASE, // 'appdb'
  port: 5432,
});

// Middleware
app.use(cors({ 
  origin: 'http://localhost:3000',
  credentials: true 
}));
app.use(express.json());

// Function to connect to DB and set up database schema
async function setupDatabase() {

  //changes to the connecting making sure the system retires when the first db connection fails
  const max = 10;
  let retries = 0;
  
  while (retries < max) {
    try {
      await db.connect();
      console.log("✅ successfully connected :)");

      //once connected make the db with the schema
      await initializeSchema(db);
      
      // spins up C dog woof woof
      startCornelius(db);
      
      return; //leave the retrie loop
      
    } catch (err) {
      retries++;
      console.error(`❌ Database connection error attempt ${retries}:`, err.message);
      
      if (retries < max) {
        // wait for 2 seconds until the retrie is tried again
        console.log(`retrieing in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  //if we didnt get a connection after 10 attempts we give up
  throw new Error("couldnt connect to the db after 10 attempts looser :(");
}
// Setup authentication routes
setupAuthRoutes(app, db);

// Setup user routes
setupUserRoutes(app, db);

// Setup events routes
eventsAPI(app, db);

// Setup buy shares routes
buySharesAPI(app, db);

// Setup sell shares routes
sellSharesAPI(app, db);

// Setup admin routes
setupAdminRoutes(app, db);

// Setup graph routes
setupGraphRoutes(app, db);

//leaderboard api 
leaderboardAPI(app, db);

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    if (!db._connected) {
      return res.status(503).json({ message: 'Database connection not ready.' });
    }
    const result = await db.query('SELECT text, created_at FROM messages ORDER BY created_at DESC LIMIT 1');
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
  setupDatabase().catch(err => {
    console.error("Fatal error during database setup:", err);
    process.exit(1);
  });
});

