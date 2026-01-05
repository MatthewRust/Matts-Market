import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { getApiUrl } from "@/lib/apiUrl";

export default function AdminEventDecision() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [outcomes, setOutcomes] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      fetchEventDetails();
    }
  }, [user, eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(
        `${getApiUrl()}/admin/pending-events?user_id=${user.user_id}`
      );
      const foundEvent = response.data.events.find(
        (e) => e.event_id === parseInt(eventId)
      );
      
      if (foundEvent) {
        setEvent(foundEvent);
        setOutcomes(foundEvent.outcomes || []);
      } else {
        setError("Event not found");
      }
    } catch (error) {
      setError("Failed to load event details");
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionChange = (outcomeId, position) => {
    setDecisions((prev) => ({
      ...prev,
      [outcomeId]: position,
    }));
  };

  const handleSubmit = async () => {
    //needs all the outcomes to have a decision
    const allDecided = outcomes.every((outcome) => decisions[outcome.outcome_id]);
    
    if (!allDecided) {
      setError("Please select YES or NO for all outcomes");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      //submit the decisions
      const promises = outcomes.map((outcome) =>
        axios.post(`${getApiUrl()}/admin/decide-outcome`, {
          user_id: user.user_id,
          outcome_id: outcome.outcome_id,
          winning_position: decisions[outcome.outcome_id],
        })
      );

      await Promise.all(promises);

      //update the status of the event to complete
      await axios.post(`${getApiUrl()}/admin/complete-event`, {
        user_id: user.user_id,
        event_id: parseInt(eventId),
      });
      navigate("/admin/decisions");
    } catch (error) {
      setError("Failed to submit decisions. Please try again.");
      console.error("Error submitting decisions:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading event...</p>
      </div>
    );
  }

  if (error && !event) {
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
        onClick={() => navigate("/admin/decisions")}
        className="mb-6"
      >
        ← Back to Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{event?.event_name}</h1>
        <p className="text-muted-foreground">{event?.description}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {outcomes.map((outcome) => (
          <Card key={outcome.outcome_id} className="p-6">
            <h3 className="text-lg font-semibold mb-4">{outcome.outcome_name}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-muted-foreground">Outstanding YES Shares</p>
                <p className="font-medium">{outcome.outstanding_yes_shares}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Outstanding NO Shares</p>
                <p className="font-medium">{outcome.outstanding_no_shares}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button
                variant={decisions[outcome.outcome_id] === "YES" ? "default" : "outline"}
                className={decisions[outcome.outcome_id] === "YES" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => handleDecisionChange(outcome.outcome_id, "YES")}
              >
                YES
              </Button>
              <Button
                variant={decisions[outcome.outcome_id] === "NO" ? "default" : "outline"}
                className={decisions[outcome.outcome_id] === "NO" ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => handleDecisionChange(outcome.outcome_id, "NO")}
              >
                NO
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? "Submitting..." : "Submit All Decisions & Complete Event"}
      </Button>
    </div>
  );
}
