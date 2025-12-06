export function sellSharesAPI(app, db){
    app.post('/api/shares/sell', async(req, res) => {
        try{
            const {userId, shareQuantity} = req.body;
            const outcomeId = parseInt(req.body.outcomeId);

            if (!userId || !outcomeId || !shareQuantity){
                return res.status(400).json({message:"Missing required fields: userId, outcomeId, shareQuantity"});
            }
            
            if (shareQuantity <= 0 || shareQuantity % 1 !== 0){
                return res.status(400).json({message: "Share quantity must be a positive integer"});
            }

            await db.query("BEGIN");

            try {
                // Check user's wallet for shares
                const userWalletResult = await db.query(
                    'SELECT position_id, shares_held FROM wallet WHERE user_id = $1 AND outcome_id = $2',
                    [userId, outcomeId]
                );

                if (userWalletResult.rows.length === 0){
                    await db.query('ROLLBACK');
                    return res.status(400).json({message: "You do not own any shares of this outcome"});
                }

                const userPosition = userWalletResult.rows[0];

                if (shareQuantity > userPosition.shares_held){
                    await db.query('ROLLBACK');
                    return res.status(400).json({
                        message: "Insufficient shares",
                        available: userPosition.shares_held,
                        requested: shareQuantity
                    });
                }

                // Get outcome data for event_id and current pool_weight
                const outcomeResult = await db.query(
                    'SELECT event_id, pool_weight, total_shares_outstanding, name FROM outcomes WHERE outcome_id = $1',
                    [outcomeId]
                );

                if (outcomeResult.rows.length === 0) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({message: 'Outcome not found'});
                }

                const outcome = outcomeResult.rows[0];
                const saleProceeds = Math.ceil(outcome.pool_weight * shareQuantity * 100) / 100;
                const allOutcomesResult = await db.query(
                    'SELECT outcome_id, total_shares_outstanding FROM outcomes WHERE event_id = $1',
                    [outcome.event_id]
                );
                const allOutcomes = allOutcomesResult.rows;

                // Update the sold outcome's shares first
                const soldOutcomeShares = parseInt(outcome.total_shares_outstanding) - parseInt(shareQuantity);
                
                // Calculate total shares across all outcomes
                let totalEventShares = soldOutcomeShares;
                for (const o of allOutcomes) {
                    if (o.outcome_id !== outcomeId) {
                        totalEventShares += parseInt(o.total_shares_outstanding);
                    }
                }

                // Update sold outcome
                const soldPoolWeight = soldOutcomeShares / totalEventShares;
                await db.query(
                    'UPDATE outcomes SET total_shares_outstanding = $1, pool_weight = $2, current_price = $3 WHERE outcome_id = $4',
                    [soldOutcomeShares, soldPoolWeight, soldPoolWeight, outcomeId]
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

                //update the wallet
                const newSharesHeld = parseInt(userPosition.shares_held) - parseInt(shareQuantity);
                if (newSharesHeld === 0) {
                    await db.query(
                        'DELETE FROM wallet WHERE position_id = $1',
                        [userPosition.position_id]
                    );
                } else {
                    await db.query(
                        'UPDATE wallet SET shares_held = $1, updated_at = NOW() WHERE position_id = $2',
                        [newSharesHeld, userPosition.position_id]
                    );
                }

                //give the user there money
                const userResult = await db.query(
                    'SELECT balance FROM users WHERE user_id = $1',
                    [userId]
                );
                
                const currentBalance = parseFloat(userResult.rows[0].balance);
                const newBalance = currentBalance + saleProceeds;

                await db.query(
                    'UPDATE users SET balance = $1 WHERE user_id = $2',
                    [newBalance, userId]
                );

                //take note of the transaction
                await db.query(
                    'INSERT INTO transactions (user_id, outcome_id, type, share_count, price_per_share, total_amount) VALUES ($1, $2, $3, $4, $5, $6)',
                    [userId, outcomeId, 'SELL', shareQuantity, outcome.pool_weight, saleProceeds]
                );

                await db.query('COMMIT');

                res.status(200).json({
                    message: 'Shares sold successfully',
                    shares_sold: shareQuantity,
                    sale_proceeds: saleProceeds,
                    new_balance: newBalance,
                    outcome_name: outcome.name
                });

            }catch(transactionError){
                await db.query('ROLLBACK');
                throw transactionError;
            }

        }catch(error){
            console.error("An error occurred selling shares: " + error);
            res.status(500).json({message: 'Failed to sell shares'});
        }
    });

    app.get('/api/shares/userposition/:userId/:outcomeId', async(req, res) => {
        try {
            const { userId, outcomeId } = req.params;

            const result = await db.query(
                'SELECT w.shares_held, o.outcome_id, o.name, o.current_price, o.pool_weight, e.event_id, e.name as event_name FROM wallet w JOIN outcomes o ON w.outcome_id = o.outcome_id JOIN events e ON o.event_id = e.event_id WHERE w.user_id = $1 AND w.outcome_id = $2',
                [userId, outcomeId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'No position found for this outcome' });
            }

            res.status(200).json({
                position: result.rows[0]
            });

        } catch(error) {
            console.error("An error occurred fetching user position: " + error);
            res.status(500).json({ message: 'Failed to fetch position data' });
        }
    });
}