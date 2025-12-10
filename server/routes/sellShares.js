export function sellSharesAPI(app, db){
    // LMSR liquidity parameter
    const b = 100;

    // LMSR cost function
    function costFunction(qYes, qNo) {
        return b * Math.log(Math.exp(qYes / b) + Math.exp(qNo / b));
    }

    // Get marginal price of YES
    function priceYes(qYes, qNo) {
        const eYes = Math.exp(qYes / b);
        const eNo = Math.exp(qNo / b);
        return eYes / (eYes + eNo);
    }

    // Get marginal price of NO
    function priceNo(qYes, qNo) {
        return 1 - priceYes(qYes, qNo);
    }

    // Trade YES shares (delta > 0 for buy, < 0 for sell)
    function tradeYes(currentYes, currentNo, deltaYes) {
        const oldCost = costFunction(currentYes, currentNo);
        const newCost = costFunction(currentYes + deltaYes, currentNo);
        const cost = newCost - oldCost;

        return {
            cost,
            newYesShares: currentYes + deltaYes,
            newNoShares: currentNo,
            newPriceYes: parseFloat(priceYes(currentYes + deltaYes, currentNo).toFixed(4)),
            newPriceNo: parseFloat(priceNo(currentYes + deltaYes, currentNo).toFixed(4))
        };
    }

    // Trade NO shares (delta > 0 for buy, < 0 for sell)
    function tradeNo(currentYes, currentNo, deltaNo) {
        const oldCost = costFunction(currentYes, currentNo);
        const newCost = costFunction(currentYes, currentNo + deltaNo);
        const cost = newCost - oldCost;

        return {
            cost,
            newYesShares: currentYes,
            newNoShares: currentNo + deltaNo,
            newPriceYes: parseFloat(priceYes(currentYes, currentNo + deltaNo).toFixed(4)),
            newPriceNo: parseFloat(priceNo(currentYes, currentNo + deltaNo).toFixed(4))
        };
    }

    app.post('/api/shares/sell', async(req, res) => {
        try{
            const {userId, shareQuantity, yesNo} = req.body;
            const outcomeId = parseInt(req.body.outcomeId);

            if (!userId || !outcomeId || !shareQuantity){
                return res.status(400).json({message:"Missing required fields: userId, outcomeId, shareQuantity"});
            }
            
            if (shareQuantity <= 0 || shareQuantity % 1 !== 0){
                return res.status(400).json({message: "Share quantity must be a positive integer"});
            }

            await db.query("BEGIN");

            try {
                //checks the users wallet for any posistions that they may have for certain outcomes.
                const userWalletResult = await db.query(
                    'SELECT position_id, shares_held FROM wallet WHERE user_id = $1 AND outcome_id = $2 AND position = $3',
                    [userId, outcomeId, yesNo]
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

                //grabs the outcome data
                const outcomeResult = await db.query(
                    'SELECT event_id, current_yes_price, current_no_price, outstanding_yes_shares, outstanding_no_shares, total_shares_outstanding, name FROM outcomes WHERE outcome_id = $1',
                    [outcomeId]
                );

                if (outcomeResult.rows.length === 0) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({message: 'Outcome not found'});
                }

                const outcome = outcomeResult.rows[0];
                const yesSharesInt = parseInt(outcome.outstanding_yes_shares);
                const noSharesInt = parseInt(outcome.outstanding_no_shares);
                const quantityInt = parseInt(shareQuantity);

                // Use LMSR to calculate proceeds and new prices (negative delta for selling)
                const tradeResult = yesNo === 'YES' 
                    ? tradeYes(yesSharesInt, noSharesInt, -quantityInt)
                    : tradeNo(yesSharesInt, noSharesInt, -quantityInt);

                const saleProceeds = parseFloat(Math.abs(tradeResult.cost).toFixed(2));

                // Update outcomes with LMSR calculated values
                await db.query(
                    'UPDATE outcomes SET outstanding_yes_shares = $1, outstanding_no_shares = $2, total_shares_outstanding = $3, current_yes_price = $4, current_no_price = $5 WHERE outcome_id = $6',
                    [tradeResult.newYesShares, tradeResult.newNoShares, tradeResult.newYesShares + tradeResult.newNoShares, tradeResult.newPriceYes, tradeResult.newPriceNo, outcomeId]
                );

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
                    'INSERT INTO transactions (user_id, outcome_id, type, position, share_count, price_per_share, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [userId, outcomeId, 'SELL', yesNo, shareQuantity, (saleProceeds / shareQuantity).toFixed(4), saleProceeds]
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
                'SELECT w.shares_held, w.position, o.outcome_id, o.name, o.current_yes_price, o.current_no_price, e.event_id, e.name as event_name FROM wallet w JOIN outcomes o ON w.outcome_id = o.outcome_id JOIN events e ON o.event_id = e.event_id WHERE w.user_id = $1 AND w.outcome_id = $2',
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