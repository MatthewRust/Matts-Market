// Admin api routes
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
      // Get all events with status 'pending' along with their outcomes
      const eventsResult = await dbClient.query(`
        SELECT 
          e.event_id,
          e.name AS event_name,
          e.description,
          e.start_time,
          e.end_time,
          e.status,
          json_agg(
            json_build_object(
              'outcome_id', o.outcome_id,
              'outcome_name', o.name,
              'current_yes_price', o.current_yes_price,
              'current_no_price', o.current_no_price,
              'outstanding_yes_shares', o.outstanding_yes_shares,
              'outstanding_no_shares', o.outstanding_no_shares
            )
          ) AS outcomes
        FROM events e
        LEFT JOIN outcomes o ON e.event_id = o.event_id
        WHERE e.status = 'pending'
        GROUP BY e.event_id
        ORDER BY e.end_time DESC
      `);

      res.status(200).json({ 
        events: eventsResult.rows
      });
    } catch (error) {
      console.error("Error fetching pending events:", error);
      res.status(500).json({ message: 'Failed to fetch pending events.' });
    }
  });

  //this api is for deciding the outcomes and paying out the users
  app.post('/api/admin/decide-outcome', requireAdmin, async (req, res) => {
    try {
      const { outcome_id, winning_position } = req.body;

      if (!outcome_id || !winning_position) {
        return res.status(400).json({ message: 'outcome_id and winning_position are required.' });
      }

      if (winning_position !== 'YES' && winning_position !== 'NO') {
        return res.status(400).json({ message: 'winning_position must be YES or NO.' });
      }

      await dbClient.query('BEGIN');

      //grabs the events id and name for the results
      const outcomeResult = await dbClient.query(
        'SELECT event_id, name FROM outcomes WHERE outcome_id = $1',
        [outcome_id]
      );

      if (outcomeResult.rows.length === 0) {
        await dbClient.query('ROLLBACK');
        return res.status(404).json({ message: 'Outcome not found.' });
      }

      const event_id = outcomeResult.rows[0].event_id;
      const outcome_name = outcomeResult.rows[0].name;

      //gets all the users with the winning shares so that we can then run through the winners and pay them accordingly
      const winnersResult = await dbClient.query(
        'SELECT user_id, shares_held FROM wallet WHERE outcome_id = $1 AND position = $2 AND shares_held > 0',
        [outcome_id, winning_position]
      );

      const winners = winnersResult.rows;
      let totalPayout = 0;

      //pay every item in the winner array
      for (const winner of winners) {
        const payout = winner.shares_held * 1.0; // $1 per share
        totalPayout += payout;

        // update the users balance
        await dbClient.query(
          'UPDATE users SET balance = balance + $1 WHERE user_id = $2',
          [payout, winner.user_id]
        );

        //log the transaction in the transaction table 
        await dbClient.query(
          `INSERT INTO transactions 
           (user_id, outcome_id, type, position, share_count, price_per_share, total_amount) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [winner.user_id, outcome_id, 'payout', winning_position, winner.shares_held, 1.0, payout]
        );
      }

      // Update event with winning outcome
      await dbClient.query(
        'UPDATE events SET winning_outcome_id = $1, winning_position = $2, status = $3 WHERE event_id = $4',
        [outcome_id, winning_position, 'resolved', event_id]
      );

      await dbClient.query('COMMIT');

      res.status(200).json({
        message: 'Outcome decided and payouts completed.',
        outcome_id,
        outcome_name,
        winning_position,
        winners_count: winners.length,
        total_payout: totalPayout
      });

    } catch (error) {
      await dbClient.query('ROLLBACK');
      console.error("Error deciding outcome:", error);
      res.status(500).json({ message: 'Failed to decide outcome and process payouts.' });
    }
  });

  //make the events completed when called
  app.post('/api/admin/complete-event', requireAdmin, async (req, res) => {
    try {
      const { event_id } = req.body;

      if (!event_id) {
        return res.status(400).json({ message: 'event_id is required.' });
      }

      //updated the status of the event to completed
      await dbClient.query(
        'UPDATE events SET status = $1 WHERE event_id = $2',
        ['completed', event_id]
      );

      res.status(200).json({
        message: 'Event marked as completed.',
        event_id
      });

    } catch (error) {
      console.error("Error completing event:", error);
      res.status(500).json({ message: 'Failed to complete event.' });
    }
  });
}
