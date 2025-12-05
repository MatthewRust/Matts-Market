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
                'SELECT e.name, e.description, e.start_time, e.end_time, o.current_price, o.total_shares_outstanding, o.pool_weight FROM events e JOIN outcomes o ON e.event_id = o.event_id WHERE e.event_id = $1'
            , [eventID]);

            res.status(200).json({position: result.rows});
            
        } catch(error){
            console.error("An error occured" + error)
            res.status(500).json({ message: 'failed to fetch this events data'})
        }
    });
}