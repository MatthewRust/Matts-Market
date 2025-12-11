import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventOverviewCard } from "@/components/EventOverviewCard";

const AllEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getEventsData();
    }, []);

    const getEventsData = async () => {
        try{
            const eventResponse = await axios.get("http://localhost:8080/api/event/showEvents");
            setEvents(eventResponse.data.events);
        } catch(error){
            setError("The events where not able to fetched")
        }finally {
            setLoading(false);
        }
    }
    if(error){
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }
    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="mb-6"
                >
                  ← Home
                </Button>
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">All Events</h1>
                            <p className="text-muted-foreground">Browse and participate in prediction markets</p>
                        </div>
                        <Button onClick={() => navigate('/events/makeevent')}>
                            Create Event
                        </Button>
                    </div>
                </div>

                {events.length === 0 ? (
                    <Card className="p-8">
                        <div className="text-center">
                            <p className="text-muted-foreground text-lg">No events found</p>
                            <p className="text-muted-foreground mt-2">Check back later for new prediction markets!</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {events.map((event) => (
                            <EventOverviewCard key={event.event_id} event={event}/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );


};
export default AllEvents;