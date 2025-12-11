import cron from 'node-cron';
//my first little robot aint he the sweetest. For refrence he's called cornealus
export function startCornelius(db) {
    cron.schedule('*/10 * * * * *', async () => { //runs every 10 seconds he's a hard worker
        try {
            const currentTime = new Date();
            const result = await db.query(
                `UPDATE events 
                 SET status = 'pending' 
                 WHERE status != 'pending' 
                 AND status != 'completed' 
                 AND end_time < $1 
                 RETURNING event_id, name, end_time`,
                [currentTime]
            );

            if (result.rows.length > 0) {
                console.log(`Cornelius updated ${result.rows.length} events to pending:`);
                result.rows.forEach(event => {
                    console.log(`Event ID ${event.event_id}: "${event.name}"`);
                });
            }
        } catch (error) {
            console.error('Cornelius error :( =>', error);
        }
    });

    console.log('✅ Cornelius has begun...');
}
