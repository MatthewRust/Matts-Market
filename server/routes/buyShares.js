export function buySharesAPI(app, db) {
    app.post('/api/shares/buy', async(req, res) => {
        try {
            const { userId, shareQuantity, yesNo } = req.body;
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
                    'SELECT o.outcome_id, o.event_id, o.current_yes_price, o.current_no_price, o.outstanding_yes_shares, o.outstanding_no_shares, o.total_shares_outstanding, o.name FROM outcomes o WHERE o.outcome_id = $1',
                    [outcomeId]
                );

                if (outcomeResult.rows.length === 0) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({ message: 'Outcome not found' });
                }

                const outcome = outcomeResult.rows[0];
                const currentPrice = yesNo === 'YES' ? outcome.current_yes_price : outcome.current_no_price;
                const totalCost = currentPrice * shareQuantity;

                // checks the users balance
                if (userBalance < totalCost) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({ 
                        message: 'Insufficient balance',
                        required: totalCost,
                        available: userBalance
                    });
                }

                // update whether its yes or no
                const yesSharesInt = parseInt(outcome.outstanding_yes_shares);
                const noSharesInt = parseInt(outcome.outstanding_no_shares);
                const totalSharesInt = parseInt(outcome.total_shares_outstanding);
                const quantityInt = parseInt(shareQuantity);
                
                const newTotalShares = totalSharesInt + quantityInt;
                let newYesShares = yesSharesInt;
                let newNoShares = noSharesInt;
                
                if (yesNo === 'YES') {
                    newYesShares += quantityInt;
                } else {
                    newNoShares += quantityInt;
                }
                
                // price = shares / total_shares (ensures prices are between 0 and 1)
                const newYesPrice = parseFloat((newYesShares / newTotalShares).toFixed(4));
                const newNoPrice = parseFloat((newNoShares / newTotalShares).toFixed(4));
                
                await db.query(
                    'UPDATE outcomes SET outstanding_yes_shares = $1, outstanding_no_shares = $2, total_shares_outstanding = $3, current_yes_price = $4, current_no_price = $5 WHERE outcome_id = $6',
                    [newYesShares, newNoShares, newTotalShares, newYesPrice, newNoPrice, outcomeId]
                );

                // Verify the update
                const verifyResult = await db.query(
                    'SELECT outstanding_yes_shares, outstanding_no_shares, total_shares_outstanding, current_yes_price, current_no_price FROM outcomes WHERE outcome_id = $1',
                    [outcomeId]
                );
                console.log(`[VERIFY] After DB update:`, verifyResult.rows[0]);
                console.log(`=== BUY SHARES DEBUG END ===\n`);

                //add shares to user wallet
                const existingWalletResult = await db.query(
                    'SELECT position_id, shares_held FROM wallet WHERE user_id = $1 AND outcome_id = $2 AND position = $3',
                    [userId, outcomeId, yesNo]
                );

                if (existingWalletResult.rows.length > 0) {
                    //update the price with the new one
                    const newShares = parseInt(existingWalletResult.rows[0].shares_held) + parseInt(shareQuantity);
                    await db.query(
                        'UPDATE wallet SET shares_held = $1, updated_at = NOW() WHERE position_id = $2',
                        [newShares, existingWalletResult.rows[0].position_id]
                    );
                } else {
                    //if no shares are already owned a new position is made 
                    await db.query(
                        'INSERT INTO wallet (user_id, outcome_id, position, shares_held) VALUES ($1, $2, $3, $4)',
                        [userId, outcomeId, yesNo, parseInt(shareQuantity)]
                    );
                }

                //take money from the user
                const newBalance = userBalance - totalCost;
                await db.query(
                    'UPDATE users SET balance = $1 WHERE user_id = $2',
                    [newBalance, userId]
                );

                //add a new transaction in
                await db.query(
                    'INSERT INTO transactions (user_id, outcome_id, type, position, share_count, price_per_share, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [userId, outcomeId, 'BUY', yesNo, shareQuantity, currentPrice, totalCost]
                );

                //commit
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
                'SELECT o.outcome_id, o.name, o.current_yes_price, o.current_no_price,o.outstanding_yes_shares, o.outstanding_no_shares, o.total_shares_outstanding, e.event_id, e.name as event_name, e.description, e.start_time, e.end_time, e.status FROM outcomes o JOIN events e ON o.event_id = e.event_id WHERE o.outcome_id = $1',
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
