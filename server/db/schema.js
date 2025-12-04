// Database schema setup
export async function initializeSchema(client) {
  try {
    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        balance DECIMAL(12, 2) DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'users' ensured.");

    // Events (initially without winning_outcome FK to avoid circular dependency)
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        event_id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        winning_outcome_id INT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'events' ensured.");

    // Outcomes (references events)
    await client.query(`
      CREATE TABLE IF NOT EXISTS outcomes (
        outcome_id SERIAL PRIMARY KEY,
        event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        current_price DECIMAL(10, 4) DEFAULT 0.0000,
        total_shares_outstanding INT DEFAULT 0,
        pool_weight DECIMAL(12, 6),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'outcomes' ensured.");

    // Add winning_outcome_id FK now that outcomes exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_events_winning_outcome'
            AND table_name = 'events'
        ) THEN
          ALTER TABLE events
            ADD CONSTRAINT fk_events_winning_outcome
            FOREIGN KEY (winning_outcome_id)
            REFERENCES outcomes(outcome_id)
            DEFERRABLE INITIALLY DEFERRED;
        END IF;
      END$$;
    `);

    // Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        outcome_id INT NOT NULL REFERENCES outcomes(outcome_id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        share_count INT NOT NULL,
        price_per_share DECIMAL(10, 4) NOT NULL,
        total_amount DECIMAL(14, 2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'transactions' ensured.");

    // Wallet / Positions
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet (
        position_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        outcome_id INT NOT NULL REFERENCES outcomes(outcome_id) ON DELETE CASCADE,
        shares_held INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'wallet' ensured.");

    console.log("✅ Database schema initialized successfully.");
  } catch (error) {
    console.error("❌ Error initializing database schema:", error.message);
    throw error;
  }
}
