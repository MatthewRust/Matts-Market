export function buySharesAPI(app, db) {
    app.post('/api/shares/buy', async(req, res) => {
        try {
            const { userId, shareQuantity } = req.body;
            const outcomeId = parseInt(req.body.outcomeId);

            // Validate required fields
            if (!userId || !outcomeId || !shareQuantity) {
                return res.status(400).json({ message: 'Missing required fields: userId, outcomeId, shareQuantity' });
            }

            if (shareQuantity <= 0) {
                return res.status(400).json({ message: 'Share quantity must be greater than 0' });
            }

            // Begin transaction
            await db.query('BEGIN');

            try {
                // Get user's current balance
                const userResult = await db.query(
                    'SELECT balance FROM users WHERE user_id = $1',
                    [userId]
                );

                if (userResult.rows.length === 0) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({ message: 'User not found' });
                }

                const userBalance = parseFloat(userResult.rows[0].balance);

                // Get outcome data
                const outcomeResult = await db.query(
                    'SELECT o.outcome_id, o.event_id, o.current_price, o.total_shares_outstanding, o.pool_weight, o.name FROM outcomes o WHERE o.outcome_id = $1',
                    [outcomeId]
                );

                if (outcomeResult.rows.length === 0) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({ message: 'Outcome not found' });
                }

                const outcome = outcomeResult.rows[0];
                const totalCost = outcome.current_price * shareQuantity;

                // Check if user has enough balance
                if (userBalance < totalCost) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({ 
                        message: 'Insufficient balance',
                        required: totalCost,
                        available: userBalance
                    });
                }

                // Get all outcomes for this event to recalculate pool weights
                const allOutcomesResult = await db.query(
                    'SELECT outcome_id, total_shares_outstanding FROM outcomes WHERE event_id = $1',
                    [outcome.event_id]
                );

                const allOutcomes = allOutcomesResult.rows;

                // Update the bought outcome's shares first
                const boughtOutcomeShares = parseInt(outcome.total_shares_outstanding) + parseInt(shareQuantity);
                
                // Calculate total shares across all outcomes
                let totalEventShares = boughtOutcomeShares;
                for (const o of allOutcomes) {
                    if (o.outcome_id !== outcomeId) {
                        totalEventShares += parseInt(o.total_shares_outstanding);
                    }
                }

                // Update bought outcome
                const boughtPoolWeight = boughtOutcomeShares / totalEventShares;
                await db.query(
                    'UPDATE outcomes SET total_shares_outstanding = $1, pool_weight = $2, current_price = $3 WHERE outcome_id = $4',
                    [boughtOutcomeShares, boughtPoolWeight, boughtPoolWeight, outcomeId]
                );

                // Update all other outcomes with recalculated pool weights
                for (const o of allOutcomes) {
                    if (o.outcome_id !== outcomeId) {
                        const outcomeShares = parseInt(o.total_shares_outstanding);
                        const poolWeight = outcomeShares / totalEventShares;
                        await db.query(
                            'UPDATE outcomes SET pool_weight = $1, current_price = $2 WHERE outcome_id = $3',
                            [poolWeight, poolWeight, o.outcome_id]
                        );
                    }
                }

                // Add shares to user's wallet
                const existingWalletResult = await db.query(
                    'SELECT position_id, shares_held FROM wallet WHERE user_id = $1 AND outcome_id = $2',
                    [userId, outcomeId]
                );

                if (existingWalletResult.rows.length > 0) {
                    // Update existing position
                    const newShares = parseInt(existingWalletResult.rows[0].shares_held) + parseInt(shareQuantity);
                    await db.query(
                        'UPDATE wallet SET shares_held = $1, updated_at = NOW() WHERE position_id = $2',
                        [newShares, existingWalletResult.rows[0].position_id]
                    );
                } else {
                    // Create new position
                    await db.query(
                        'INSERT INTO wallet (user_id, outcome_id, shares_held) VALUES ($1, $2, $3)',
                        [userId, outcomeId, parseInt(shareQuantity)]
                    );
                }

                // Deduct from user's balance
                const newBalance = userBalance - totalCost;
                await db.query(
                    'UPDATE users SET balance = $1 WHERE user_id = $2',
                    [newBalance, userId]
                );

                // Record transaction
                await db.query(
                    'INSERT INTO transactions (user_id, outcome_id, type, share_count, price_per_share, total_amount) VALUES ($1, $2, $3, $4, $5, $6)',
                    [userId, outcomeId, 'BUY', shareQuantity, outcome.current_price, totalCost]
                );

                // Commit transaction
                await db.query('COMMIT');

                res.status(200).json({
                    message: 'Shares purchased successfully',
                    shares_bought: shareQuantity,
                    total_cost: totalCost,
                    new_balance: newBalance,
                    outcome_name: outcome.name
                });

            } catch (transactionError) {
                await db.query('ROLLBACK');
                throw transactionError;
            }

        } catch(error) {
            console.error("An error occurred buying shares: " + error);
            res.status(500).json({ message: 'Failed to purchase shares' });
        }
    });

    app.get('/api/shares/outcome/:outcomeId', async(req, res) => {
        try {
            const { outcomeId } = req.params;

            const result = await db.query(
                'SELECT o.outcome_id, o.name, o.current_price, o.total_shares_outstanding, o.pool_weight, e.event_id, e.name as event_name, e.description, e.start_time, e.end_time, e.status FROM outcomes o JOIN events e ON o.event_id = e.event_id WHERE o.outcome_id = $1',
                [outcomeId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Outcome not found' });
            }

            res.status(200).json({
                outcome: result.rows[0]
            });

        } catch(error) {
            console.error("An error occurred fetching outcome: " + error);
            res.status(500).json({ message: 'Failed to fetch outcome data' });
        }
    });
}
