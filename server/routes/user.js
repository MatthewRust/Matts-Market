// User API routes
export function setupUserRoutes(app, db) {
  // Get user data
  app.get('/api/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await db.query(
        'SELECT user_id, username, email, balance FROM users WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }

      res.status(200).json({
        user: result.rows[0]
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: 'Failed to fetch user data.' });
    }
  });

  // Get user wallet/positions added a few more fields to be grabbed from the db
  app.get('/api/wallet/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await db.query(`
        SELECT 
          w.position_id,
          w.shares_held,
          w.updated_at,
          w.position,
          o.outcome_id as outcome_id,
          o.name as outcome_name,
          o.current_yes_price,
          o.current_no_price,
          e.name as event_name,
          e.status as event_status
        FROM wallet w
        JOIN outcomes o ON w.outcome_id = o.outcome_id
        JOIN events e ON o.event_id = e.event_id
        WHERE w.user_id = $1 AND e.status = $2
        ORDER BY w.updated_at DESC
      `, [userId, 'active']);

      res.status(200).json({
        positions: result.rows
      });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: 'Failed to fetch wallet data.' });
    }
  });
}