// Authentication API routes
export function setupAuthRoutes(app, db) {
  // User registration
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
      }

      // Simple password hash (in production, use bcrypt)
      const password_hash = password; // For now, just store plaintext
      const startingBalance = 1000;
      const result = await db.query(
        'INSERT INTO users (username, email, password_hash, balance, permission) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, permission',
        [username, email, password_hash, startingBalance, 'user']
      );

      res.status(201).json({ 
        message: 'User registered successfully.',
        user: result.rows[0]
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({ message: 'Username or email already exists.' });
      } else {
        console.error("Error registering user:", error);
        res.status(500).json({ message: 'Registration failed.' });
      }
    }
  });

  // User login
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      const result = await db.query(
        'SELECT user_id, username, email, balance, permission FROM users WHERE username = $1 AND password_hash = $2',
        [username, password]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }

      res.status(200).json({ 
        message: 'Login successful.',
        user: result.rows[0]
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: 'Login failed.' });
    }
  });

  // Token refresh endpoint
  app.post('/api/auth/refresh', (req, res) => {
    // For now, just return success - the frontend manages tokens in localStorage
    res.status(200).json({ message: 'Token refreshed.' });
  });

}