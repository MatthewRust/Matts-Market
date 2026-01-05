import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/apiUrl";
import { Label } from "@/components/ui/label";

const BuyShares = () => {
    const { outcomeID, yesNo } = useParams();
    const navigate = useNavigate();
    const [outcomeData, setOutcomeData] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [shareQuantity, setShareQuantity] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [success, setSuccess] = useState("");
    const [calculatedPrice, setCalcPrice] = useState(null);

    useEffect(() => {
        if (outcomeID) {
            getOutcomeData();
            getUserBalance();
        }
    }, [outcomeID]);

    const getOutcomeData = async () => {
        try {
            const outcomeResponse = await axios.get(`${getApiUrl()}/shares/outcome/${outcomeID}`);
            setOutcomeData(outcomeResponse.data.outcome);
        } catch (error) {
            setError("The outcome couldn't be found");
        } finally {
            setLoading(false);
        }
    };

    const getUserBalance = async () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                const userResponse = await axios.get(`${getApiUrl()}/user/${userData.user_id}`);
                setUserBalance(parseFloat(userResponse.data.user.balance));
            }
        } catch (error) {
            setError("Failed to fetch user balance");
        }
    };

    // does the same thing as in sell stocks 
    useEffect(() => {
        if (outcomeData && shareQuantity && shareQuantity > 0) {
            calculatePrice();
        } else {
            setCalcPrice(null);
        }
    }, [shareQuantity, outcomeData]);

    const calculatePrice = async () => { //grabs the buy price
        try {
            const response = await axios.post(`${getApiUrl()}/shares/grabBuyPrice`, {
                outcomeId: outcomeID,
                shareQuantity: parseInt(shareQuantity),
                yesNo
            });
            setCalcPrice(response.data);
        } catch (error) {
            console.error('Failed to calculate price:', error);
            setCalcPrice(null);
        }
    };

    const calculateTotalCost = () => {
        if (!calculatedPrice) return 0;
        return calculatedPrice.totalCost.toFixed(2);
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        setPurchasing(true);
        setError("");
        setSuccess("");

        try {
            if (!shareQuantity || shareQuantity <= 0) {
                setError("Please enter a valid number of shares");
                setPurchasing(false);
                return;
            }

            const totalCost = parseFloat(calculateTotalCost());

            if (totalCost > userBalance) {
                setError("Insufficient balance to purchase these shares");
                setPurchasing(false);
                return;
            }

            const storedUser = localStorage.getItem("user");
            const userData = JSON.parse(storedUser);

            const response = await axios.post(`${getApiUrl()}/shares/buy`, {
                userId: userData.user_id,
                outcomeId: outcomeID,
                shareQuantity: parseInt(shareQuantity), 
                yesNo
            });

            setSuccess(`Successfully purchased ${shareQuantity} shares!`);
            setShareQuantity("");

            // Update localStorage with new balance
            userData.balance = response.data.new_balance;
            localStorage.setItem("user", JSON.stringify(userData));
            await getOutcomeData();

            navigate("/events");

        } catch (error) {
            setError(error.response?.data?.message || "Failed to purchase shares");
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading outcome...</p>
            </div>
        );
    }

    if (error && !outcomeData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!outcomeData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Outcome not found</p>
            </div>
        );
    }

    const totalCost = calculateTotalCost();
    const canAfford = totalCost <= userBalance;
    
    // so we show the right yes or no when buying and there cost
    const currentPrice = yesNo === 'YES' ? outcomeData.current_yes_price : outcomeData.current_no_price;
    const sharesOutstanding = yesNo === 'YES' ? outcomeData.outstanding_yes_shares : outcomeData.outstanding_no_shares;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/events')}
                        className="mb-4"
                    >
                        ← Back to Events
                    </Button>
                    
                    <h1 className="text-3xl font-bold mb-2">Buy {yesNo} Shares</h1>
                    <p className="text-muted-foreground">Purchase shares in {outcomeData.event_name}</p>
                </div>

                <div className="space-y-6">
                    {/* Outcome Information */}
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className={`text-2xl font-bold mb-2 ${yesNo === 'NO' ? 'text-red-600' : 'text-green-600'}`}>{outcomeData.name}</h2>
                                <p className="text-muted-foreground">{outcomeData.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground">Price Per {yesNo} Share</p>
                                    <p className={`text-2xl font-bold ${yesNo === 'NO' ? 'text-red-600' : 'text-green-600'}`}>
                                        ${parseFloat(currentPrice).toFixed(4)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Shares Outstanding</p>
                                    <p className="text-2xl font-bold">
                                        {sharesOutstanding}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Purchase Form */}
                    <Card className="p-6">
                        <form onSubmit={handlePurchase} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Number of Shares</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={shareQuantity}
                                    onChange={(e) => setShareQuantity(e.target.value)}
                                    placeholder="Enter number of shares"
                                    required
                                />
                            </div>

                            {/* Cost Summary */}
                            <div className="border rounded-md p-4 space-y-2 bg-card">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current market price:</span>
                                    <span className="font-medium">${parseFloat(currentPrice).toFixed(4)}</span>
                                </div>
                                {calculatedPrice && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Average price per share:</span>
                                        <span className="font-medium">${calculatedPrice.averagePricePerShare.toFixed(4)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Quantity:</span>
                                    <span className="font-medium">{shareQuantity || 0}</span>
                                </div>
                                {calculatedPrice && (
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>New {yesNo} price after purchase:</span>
                                        <span>${yesNo === 'YES' ? calculatedPrice.newPriceYes.toFixed(4) : calculatedPrice.newPriceNo.toFixed(4)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="font-semibold">Total Cost:</span>
                                    <span className="text-xl font-bold">
                                        ${totalCost}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Your Balance:</span>
                                    <span className={`font-medium ${canAfford || !shareQuantity ? 'text-green-600' : 'text-red-600'}`}>
                                        ${userBalance.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-green-600 text-sm">{success}</p>
                                    <p className="text-green-600 text-xs mt-1">Redirecting to events page...</p>
                                </div>
                            )}

                            <div className="flex space-x-4 pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={purchasing || !canAfford || !shareQuantity}
                                    className="flex-1"
                                >
                                    {purchasing ? "Purchasing..." : "Purchase Shares"}
                                </Button>
                                
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => navigate('/events')}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
export default BuyShares;