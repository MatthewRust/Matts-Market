// Graph data API routes
export function setupGraphRoutes(app, dbClient) {
  
  // Get transaction history for a specific event
  app.get('/api/graph/event-transactions/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;

      // Get all transactions for outcomes belonging to this event
      const result = await dbClient.query(`
        SELECT 
          t.transaction_id,
          t.user_id,
          t.outcome_id,
          t.type,
          t.position,
          t.share_count,
          t.price_per_share,
          t.total_amount,
          t.created_at,
          o.name as outcome_name,
          o.current_yes_price,
          o.current_no_price,
          e.event_id,
          e.name as event_name
        FROM transactions t
        JOIN outcomes o ON t.outcome_id = o.outcome_id
        JOIN events e ON o.event_id = e.event_id
        WHERE e.event_id = $1
        ORDER BY t.created_at ASC
      `, [eventId]);

      res.status(200).json({
        transactions: result.rows
      });
    } catch (error) {
      console.error("Error fetching event transactions:", error);
      res.status(500).json({ message: 'Failed to fetch transaction history.' });
    }
  });

  // Get transaction history for a specific outcome
  app.get('/api/graph/outcome-transactions/:outcomeId', async (req, res) => {
    try {
      const { outcomeId } = req.params;

      const result = await dbClient.query(`
        SELECT 
          t.transaction_id,
          t.user_id,
          t.outcome_id,
          t.type,
          t.position,
          t.share_count,
          t.price_per_share,
          t.total_amount,
          t.created_at,
          o.name as outcome_name,
          o.current_yes_price,
          o.current_no_price
        FROM transactions t
        JOIN outcomes o ON t.outcome_id = o.outcome_id
        WHERE t.outcome_id = $1
        ORDER BY t.created_at ASC
      `, [outcomeId]);

      res.status(200).json({
        transactions: result.rows
      });
    } catch (error) {
      console.error("Error fetching outcome transactions:", error);
      res.status(500).json({ message: 'Failed to fetch transaction history.' });
    }
  });

}
