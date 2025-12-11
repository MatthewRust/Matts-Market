import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";

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
              <Card key={position.position_id} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{position.event_name}</h3>
                    <p className="text-muted-foreground">{position.outcome_name}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p><span className="font-medium">Shares Held:</span> {position.shares_held}</p>
                    <p><span className="font-medium">Current Price:</span> ${position.current_yes_price || '0.0000'}</p>
                    <p><span className="font-medium">Current Position:</span> {position.position} </p>
                    <p><span className="font-medium">Event Status:</span> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        position.event_status === 'completed' ? 'bg-green-100 text-green-800' :
                        position.event_status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {position.event_status}
                      </span>
                    </p>
                    <Button 
                      className="flex-1" 
                      variant="default"
                      onClick={() => navigate(`/events/sellshares/${position.outcome_id}/${position.position}`)}>
                        Sell
                      </Button>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Updated: {new Date(position.updated_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Position ID: {position.position_id}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
