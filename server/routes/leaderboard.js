export function leaderboardAPI(app, db){

    app.get(`/api/leaderboard/getPlayers`, async(req, res) => {
        try {
            const {result} = await db.query('SELECT user_id, username, balance FROM users ORDER BY balance;');
            res.status(200).json({leaderboard: result});
        } catch(error){
            console.error("Failed fetching leaderboard data", error);
            res.status(500).json({ message: 'Failed fetching the leaderboard data' });
        }
    });
}