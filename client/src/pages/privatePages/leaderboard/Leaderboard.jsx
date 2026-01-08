import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Leaderboard = () => {
	const [players, setPlayers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const leaderboard = async () => {
			setLoading(true);
			setError("");
			try {
				const { data } = await api.get("/leaderboard/getPlayers");
				setPlayers(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
			} catch (e) {
				setError("Failed to load leaderboard");
			} finally {
				setLoading(false);
			}
		};
		leaderboard();
	}, []);

	const formatCurrency = (n) =>
		new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));

	return (
		<div className="container mx-auto max-w-4xl p-4 md:p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Leaderboard</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="animate-pulse space-y-3">
							<div className="h-10 bg-muted rounded" />
							<div className="h-10 bg-muted rounded" />
							<div className="h-10 bg-muted rounded" />
						</div>
					) : error ? (
						<div className="text-destructive">{error}</div>
					) : players.length === 0 ? (
						<div className="text-muted-foreground">No players yet.</div>
					) : (
						<div className="overflow-x-auto">
							<div className="min-w-[480px]">
								<div className="grid grid-cols-12 px-3 py-2 text-sm text-muted-foreground border-b">
									<div className="col-span-2">Rank</div>
									<div className="col-span-6">User</div>
									<div className="col-span-4 text-right">Balance</div>
								</div>
								{players.map((p, idx) => (
									<div
										key={p.username ?? idx}
										className="grid grid-cols-12 px-3 py-3 items-center border-b hover:bg-muted/40"
									>
										<div className="col-span-2 font-medium">#{idx + 1}</div>
										<div className="col-span-6 truncate">{p.username}</div>
										<div className="col-span-4 text-right tabular-nums">
											{formatCurrency(p.balance)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default Leaderboard;
