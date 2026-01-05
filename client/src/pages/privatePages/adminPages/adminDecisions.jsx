import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import axios from "axios";

export default function AdminDecisions() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPendingEvents();
    }
  }, [user]);

  const fetchPendingEvents = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/admin/pending-events?user_id=${user.user_id}`
      );
      setEvents(response.data.events);
    } catch (error) {
      setError("Failed to load pending events");
      console.error("Error fetching pending events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading pending events...</p>
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
    <div className="container mx-auto p-6">
      <Button 
        variant="outline" 
        onClick={() => navigate("/")}
        className="mb-6"
      >
        ← Home
      </Button>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard - Pending Events</h1>
      
      {events.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">No pending events to review.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card 
              key={event.event_id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/decisions/${event.event_id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{event.event_name}</h2>
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                  <div className="text-sm text-muted-foreground">
                    <p>Outcomes: {event.outcomes?.length || 0}</p>
                    <p>End Time: {new Date(event.end_time).toLocaleString()}</p>
                  </div>
                </div>
                <Button variant="outline">Decide →</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
