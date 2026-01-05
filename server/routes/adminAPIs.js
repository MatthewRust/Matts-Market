// Admin API routes
export function setupAdminRoutes(app, dbClient) {
  
  //for checking the users permissions to see if they are an admin or nah.
  const requireAdmin = async (req, res, next) => {
    try {
      const userId = req.body.user_id || req.query.user_id;
      
      if (!userId) {
        return res.status(401).json({ message: 'User authentication required.' });
      }

      const result = await dbClient.query(
        'SELECT permission FROM users WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0 || result.rows[0].permission !== 'admin') {
        return res.status(403).json({ message: 'Admin access required.' });
      }

      next();
    } catch (error) {
      console.error("Error checking admin permission:", error);
      res.status(500).json({ message: 'Authorization check failed.' });
    }
  };

  //grabs all the pending events so the admin can decide on the events on what happened
  app.get('/api/admin/pending-events', requireAdmin, async (req, res) => {
    try {
      res.status(200).json({ 
        message: 'Admin endpoint - pending events',
        events: []
      });
    } catch (error) {
      console.error("Error fetching pending events:", error);
      res.status(500).json({ message: 'Failed to fetch pending events.' });
    }
  });
}
