import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MakeEvent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        start_time: "",
        end_time: ""
    });

    const [outcomes, setOutcomes] = useState([
        { name: "" },
        { name: "" }
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError("");
        if (success) setSuccess("");
    };

    const handleOutcomeChange = (index, value) => {
        const updatedOutcomes = [...outcomes];
        updatedOutcomes[index].name = value;
        setOutcomes(updatedOutcomes);
        
        if (error) setError("");
        if (success) setSuccess("");
    };

    const addOutcome = () => {
        setOutcomes([...outcomes, { name: "" }]);
    };

    const removeOutcome = (index) => {
        if (outcomes.length > 2) {
            const updatedOutcomes = outcomes.filter((_, i) => i !== index);
            setOutcomes(updatedOutcomes);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validate outcomes
        const validOutcomes = outcomes.filter(outcome => outcome.name.trim() !== "");
        if (validOutcomes.length < 2) {
            setError("Please add at least 2 outcomes");
            setLoading(false);
            return;
        }

        try {
            const requestData = {
                ...formData,
                outcomes: validOutcomes
            };

            const response = await axios.post("http://localhost:8080/api/event/createEvent", requestData);
            
            setSuccess("Event created successfully!");
            
            // Reset form
            setFormData({
                name: "",
                description: "",
                start_time: "",
                end_time: ""
            });
            setOutcomes([{ name: "" }, { name: "" }]);

            // Redirect to events page after 2 seconds
            setTimeout(() => {
                navigate("/events");
            }, 2000);

        } catch (error) {
            setError(error.response?.data?.message || "Failed to create event");
        } finally {
            setLoading(false);
        }
    };

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
                    
                    <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
                    <p className="text-muted-foreground">Create a new prediction market event</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Event Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter event name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe the event and what outcomes are being predicted"
                                rows={4}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Start Time *</Label>
                                <Input
                                    id="start_time"
                                    name="start_time"
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end_time">End Time *</Label>
                                <Input
                                    id="end_time"
                                    name="end_time"
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Outcomes * (Minimum 2 required)</Label>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={addOutcome}
                                >
                                    + Add Outcome
                                </Button>
                            </div>
                            
                            <div className="space-y-3">
                                {outcomes.map((outcome, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Input
                                            value={outcome.name}
                                            onChange={(e) => handleOutcomeChange(index, e.target.value)}
                                            placeholder={`Outcome ${index + 1} (e.g., "Team A wins")`}
                                            required={index < 2}
                                        />
                                        {outcomes.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeOutcome(index)}
                                                className="px-2"
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Add the possible outcomes for this prediction market (e.g., "Team A wins", "Team B wins", "Draw")
                            </p>
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
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? "Creating Event..." : "Create Event"}
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
    );
}
export default MakeEvent;