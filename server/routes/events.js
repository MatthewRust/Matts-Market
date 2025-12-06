export function eventsAPI(app, db){
    app.get('/api/event/showEvents', async(req, res) => {
        try{
            const result = await db.query(
                'SELECT event_id, name, description, start_time, end_time, status FROM events ORDER BY start_time DESC'
            );
            
            res.status(200).json({
                events: result.rows
            });
        }catch(error){
            console.error("An error occured " + error)
            res.status(500).json({ message: 'Failed to fetch event data?!?!'});
        }


    });

    
    app.get('/api/event/showEventData/:eventID', async(req, res) => {
        try{
            const {eventID} = req.params;
            const result = await db.query(
                'SELECT o.outcome_id, e.name, e.description, e.start_time, e.end_time, o.name as outcome_name, o.current_price, o.total_shares_outstanding, o.pool_weight FROM events e JOIN outcomes o ON e.event_id = o.event_id WHERE e.event_id = $1'
            , [eventID]);

            res.status(200).json({position: result.rows});
            
        } catch(error){
            console.error("An error occured" + error)
            res.status(500).json({ message: 'failed to fetch this events data'})
        }
    });

    //creating a new event with outcomes
    app.post('/api/event/createEvent', async(req, res) => {
        try{
            const { name, description, start_time, end_time, outcomes } = req.body;
            
            if (!name || !description || !start_time || !end_time) {
                return res.status(400).json({ message: 'Missing required fields: name, description, start_time, end_time' });
            }

            // Validate outcomes
            if (!outcomes || !Array.isArray(outcomes) || outcomes.length < 2) {
                return res.status(400).json({ message: 'At least 2 outcomes are required' });
            }

            // Validate outcome names
            const validOutcomes = outcomes.filter(outcome => outcome.name && outcome.name.trim() !== '');
            if (validOutcomes.length < 2) {
                return res.status(400).json({ message: 'At least 2 valid outcome names are required' });
            }

            const startDate = new Date(start_time);
            const endDate = new Date(end_time);
            const currentDate = new Date();

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }

            // checking that the start time is befor the end time
            if (startDate >= endDate) {
                return res.status(400).json({ message: 'Start time must be before end time' });
            }

            // dont allow events that have already ended
            if (endDate <= currentDate) {
                return res.status(400).json({ message: 'Cannot create events that have already ended' });
            }

            // get the status of the event from the times provided byy the user
            let status;
            if (currentDate < startDate) {
                status = 'upcoming';
            } else if (currentDate >= startDate && currentDate < endDate) {
                status = 'active';
            }

            // Begin transaction
            await db.query('BEGIN');

            try {
                // Create the event first
                const eventResult = await db.query(
                    'INSERT INTO events (name, description, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING event_id, name, description, start_time, end_time, status',
                    [name, description, start_time, end_time, status]
                );

                const eventId = eventResult.rows[0].event_id;

                // Calculate shares and prices for outcomes
                const sharesPerOutcome = 100;
                const totalSharesForEvent = validOutcomes.length * sharesPerOutcome;
                const poolWeight = sharesPerOutcome / totalSharesForEvent;
                const currentPrice = 1 * poolWeight;

                // Create outcomes for the event
                const outcomePromises = validOutcomes.map(outcome => {
                    return db.query(
                        'INSERT INTO outcomes (event_id, name, current_price, total_shares_outstanding, pool_weight) VALUES ($1, $2, $3, $4, $5)',
                        [eventId, outcome.name.trim(), currentPrice, sharesPerOutcome, poolWeight]
                    );
                });

                await Promise.all(outcomePromises);

                // Commit transaction
                await db.query('COMMIT');

                res.status(201).json({
                    message: 'Event and outcomes created successfully',
                    event: eventResult.rows[0],
                    outcomeCount: validOutcomes.length
                });

            } catch (transactionError) {
                // Rollback transaction on error
                await db.query('ROLLBACK');
                throw transactionError;
            }

        } catch(error){
            console.error("An error occurred creating event: " + error);
            res.status(500).json({ message: 'Failed to create event' });
        }
    });
}