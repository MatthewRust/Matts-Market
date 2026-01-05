import express from 'express';
import cors from 'cors';
import pg from 'pg';
import 'dotenv/config'; // Loads .env file (though Docker will handle most in this setup)
import { initializeSchema } from './db/schema.js';
import { setupAuthRoutes } from './routes/auth.js';
import { setupUserRoutes } from './routes/user.js';
import { eventsAPI } from './routes/events.js';
import { buySharesAPI } from './routes/buyShares.js';
import { sellSharesAPI } from './routes/sellShares.js';
import { startCornelius } from './routes/cornelius.js';
import { setupAdminRoutes } from './routes/adminAPIs.js';
import { setupGraphRoutes } from './routes/graphs.js';




const app = express();
const PORT = process.env.PORT || 8080;

// Function to create a new PostgreSQL client
function createDbClient() {
  const { Client } = pg;
  return new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT || 5432,
  });
}

let dbClient = null;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint (doesn't require database)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.status(200).send('Node.js Server is Running!');
});

// Function to connect to DB and set up database schema
async function setupDatabase() {

  //changes to the connecting making sure the system retires when the first db connection fails
  const max = 10;
  let retries = 0;
  
  while (retries < max) {
    try {      // Create fresh client for this attempt
      if (dbClient) {
        try { await dbClient.end(); } catch (e) { /* ignore */ }
      }
      dbClient = createDbClient();
            await dbClient.connect();
      console.log("✅ successfully connected :)");

      //once connected make the db with the schema
      await initializeSchema(dbClient);
      
      // spins up C dog woof woof
      startCornelius(dbClient);
      
      // Setup all routes after database connection is established
      console.log("📝 Registering routes...");
      setupAuthRoutes(app, dbClient);
      console.log("  ✅ Auth routes registered");
      setupUserRoutes(app, dbClient);
      console.log("  ✅ User routes registered");
      eventsAPI(app, dbClient);
      console.log("  ✅ Events routes registered");
      buySharesAPI(app, dbClient);
      console.log("  ✅ Buy shares routes registered");
      sellSharesAPI(app, dbClient);
      console.log("  ✅ Sell shares routes registered");
      setupAdminRoutes(app, dbClient);
      console.log("  ✅ Admin routes registered");
      setupGraphRoutes(app, dbClient);
      console.log("  ✅ Graph routes registered");
      
      // Add 404 handler for unmatched routes
      app.use((req, res) => {
        console.log(`⚠️  404 Not Found: ${req.method} ${req.path}`);
        res.status(404).json({ message: 'Route not found' });
      });
      
      console.log("✅ All routes registered successfully");
      
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

// Start the server and connect to the database
app.listen(PORT, async () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  try {
    await setupDatabase();
    console.log('✅ Server fully initialized and ready');
  } catch (err) {
    console.error("Fatal error during database setup:", err);
    process.exit(1);
  }
});

