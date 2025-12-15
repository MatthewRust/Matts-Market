import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { WalletItem } from "@/components/WalletItem";

const Wallet = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchUserData(userData.user_id);
    } else {
      setError("Please log in to view your wallet");
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Fetch fresh user data including current balance
      const userResponse = await axios.get(`http://localhost:8080/api/user/${userId}`);
      setUser(userResponse.data.user);
      
      // Fetch wallet positions
      const walletResponse = await axios.get(`http://localhost:8080/api/wallet/${userId}`);
      setPositions(walletResponse.data.positions);
    } catch (error) {
      setError("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading wallet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          ← Home
        </Button>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {user?.username}'s Wallet
          </h1>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-green-600">
              ${user?.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
        

        {positions.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              No positions found. Start trading to see your wallet!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => (
              <WalletItem {...position} key={position.outcome_id || position.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
