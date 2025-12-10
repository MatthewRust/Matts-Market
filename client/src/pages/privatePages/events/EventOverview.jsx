import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EventOverview = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [eventData, setEventData] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (eventId) {
            getEventData(eventId);
        }
    }, [eventId]);

    // Refetch data whenever component comes into focus (e.g., navigating back from BuyShares)
    useEffect(() => {
        const handleFocus = () => {
            if (eventId) {
                getEventData(eventId);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [eventId]);

    const getEventData = async (eventID) =>{
        try{
            const eventResponse = await axios.get(`http://localhost:8080/api/event/showEventData/${eventID}`);
            setEventData(eventResponse.data.position);
        } catch (error) {
            setError("The event was not able to be found");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading event...</p>
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

    if (!eventData || eventData.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">No event data found</p>
            </div>
        );
    }

    const event = eventData[0]; // Get the first event data

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/events')}
                        className="mb-4"
                    >
                        ← Back to Events
                    </Button>
                    
                    <Card className="p-8">
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
                                <p className="text-muted-foreground text-lg">{event.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold">Event Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Start Time:</span>
                                            <span>{new Date(event.start_time).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">End Time:</span>
                                            <span>{new Date(event.end_time).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Available Outcomes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {eventData.map((outcome, index) => (
                            <Card key={index} className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-lg">{outcome.outcome_name}</h3>
                                    </div>
                                    
                                    <div className="space-y-2 bg-muted/50 p-4 rounded-md">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Yes Price:</span>
                                            <span className="font-semibold text-green-600">
                                                ${parseFloat(outcome.current_yes_price).toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Yes Shares:</span>
                                            <span className="font-semibold">{outcome.outstanding_yes_shares}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">No Price:</span>
                                            <span className="font-semibold text-red-600">
                                                ${parseFloat(outcome.current_no_price).toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">No Shares:</span>
                                            <span className="font-semibold">{outcome.outstanding_no_shares}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-2 pt-2">
                                        <Button 
                                            className="flex-1" 
                                            variant="default"
                                            onClick={() => navigate(`/events/buyshares/${outcome.outcome_id}/YES`)}
                                        >
                                            Yes
                                        </Button>
                                        <Button className="flex-1" variant="outline" onClick={() => navigate(`/events/buyshares/${outcome.outcome_id}/NO`)}>
                                            No
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );




};
export default EventOverview;