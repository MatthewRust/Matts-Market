import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">All Events</h1>
                    <p className="text-muted-foreground">Browse and participate in prediction markets</p>
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
                            <Card 
                                key={event.event_id} 
                                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => navigate(`/events/${event.event_id}`)}
                            >
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg line-clamp-2">{event.name}</h3>
                                        <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                                            {event.description}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Starts:</span>
                                            <span>{new Date(event.start_time).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Ends:</span>
                                            <span>{new Date(event.end_time).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            event.status === 'active' ? 'bg-green-100 text-green-800' :
                                            event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {event.status}
                                        </span>
                                        <button className="text-primary hover:text-primary/80 text-sm font-medium">
                                            View Details →
                                        </button>
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
export default AllEvents;