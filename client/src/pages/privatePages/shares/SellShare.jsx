import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SellShares = () => {
    const { outcomeID, yesNo } = useParams();
    const navigate = useNavigate();
    const [positionData, setPositionData] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [shareQuantity, setShareQuantity] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selling, setSelling] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (outcomeID) {
            getUserPosition();
            getUserBalance();
        }
    }, [outcomeID]);

    const getUserPosition = async () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                const positionResponse = await axios.get(`http://localhost:8080/api/shares/userposition/${userData.user_id}/${outcomeID}`);
                setPositionData(positionResponse.data.position);
            } else {
                setError("Please log in to sell shares");
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setError("You do not own any shares of this outcome");
            } else {
                setError("Failed to fetch your position");
            }
        } finally {
            setLoading(false);
        }
    };

    const getUserBalance = async () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                const userResponse = await axios.get(`http://localhost:8080/api/user/${userData.user_id}`);
                setUserBalance(parseFloat(userResponse.data.user.balance));
            }
        } catch (error) {
            console.error("Failed to fetch user balance", error);
        }
    };

    const calculateSaleProceeds = () => {
        if (!positionData || !shareQuantity) return 0;
        const currentPrice = yesNo === 'YES' ? parseFloat(positionData.current_yes_price) : parseFloat(positionData.current_no_price);
        return parseFloat((currentPrice * shareQuantity).toFixed(2));
    };

    const handleSell = async (e) => {
        e.preventDefault();
        setSelling(true);
        setError("");
        setSuccess("");

        try {
            if (!shareQuantity || shareQuantity <= 0) {
                setError("Please enter a valid number of shares");
                setSelling(false);
                return;
            }

            if (parseInt(shareQuantity) > positionData.shares_held) {
                setError(`You only have ${positionData.shares_held} shares to sell`);
                setSelling(false);
                return;
            }

            const storedUser = localStorage.getItem("user");
            const userData = JSON.parse(storedUser);

            const response = await axios.post("http://localhost:8080/api/shares/sell", {
                userId: userData.user_id,
                outcomeId: outcomeID,
                shareQuantity: parseInt(shareQuantity),
                yesNo
            });

            setSuccess(`Successfully sold ${shareQuantity} shares for $${response.data.sale_proceeds.toFixed(2)}!`);
            setShareQuantity("");

            //update the local storage of the user
            userData.balance = response.data.new_balance;
            localStorage.setItem("user", JSON.stringify(userData));

            //redirect the user after a few seconds
            setTimeout(() => {
                navigate("/wallet");
            }, 2000);

        } catch (error) {
            setError(error.response?.data?.message || "Failed to sell shares");
        } finally {
            setSelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading your position...</p>
            </div>
        );
    }

    if (error && !positionData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-600 text-lg">{error}</p>
                    <Button onClick={() => navigate('/wallet')}>Back to Wallet</Button>
                </div>
            </div>
        );
    }

    if (!positionData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Position not found</p>
            </div>
        );
    }

    const saleProceeds = calculateSaleProceeds();

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/wallet')}
                        className="mb-4"
                    >
                        ← Back to Wallet
                    </Button>
                    
                    <h1 className="text-3xl font-bold mb-2">Sell Shares</h1>
                    <p className="text-muted-foreground">Sell your shares in {positionData.event_name}</p>
                </div>
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold text-blue-600 mb-2">{positionData.name}</h2>
                                <p className="text-muted-foreground">{positionData.event_name}</p>
                            </div>
                            

                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground">Your Shares</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {positionData.shares_held}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Position</p>
                                    <p className="text-2xl font-bold">
                                        {yesNo}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Price Per Share</p>
                                    <p className="text-2xl font-bold">
                                        ${yesNo === 'YES' ? parseFloat(positionData.current_yes_price).toFixed(4) : parseFloat(positionData.current_no_price).toFixed(4)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <form onSubmit={handleSell} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">shares to Sell</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max={positionData.shares_held}
                                    value={shareQuantity}
                                    onChange={(e) => setShareQuantity(e.target.value)}
                                    placeholder={`Enter shares (max: ${positionData.shares_held})`}
                                    required
                                />
                            </div>
                            <div className="border rounded-md p-4 space-y-2 bg-slate-50">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Price Per Share:</span>
                                    <span className="font-medium">${yesNo === 'YES' ? parseFloat(positionData.current_yes_price).toFixed(4) : parseFloat(positionData.current_no_price).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Quantity:</span>
                                    <span className="font-medium">{shareQuantity || 0}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="font-semibold">Sale Proceeds:</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        ${saleProceeds.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current Balance:</span>
                                    <span className="font-medium text-green-600">
                                        ${userBalance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold">New Balance:</span>
                                    <span className="text-xl font-bold text-green-600">
                                        ${(userBalance + saleProceeds).toFixed(2)}
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
                                    <p className="text-green-600 text-xs mt-1">Redirecting!?!?!?!</p>
                                </div>
                            )}

                            <div className="flex space-x-4 pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={selling || !shareQuantity}
                                    className="flex-1"
                                    variant="default"
                                >
                                    {selling ? "Selling..." : "Sell Shares"}
                                </Button>
                                
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => navigate('/wallet')}
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
};
export default SellShares;