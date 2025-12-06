import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 relative">
      <nav className="absolute top-4 left-0 right-0 flex justify-between items-center px-6">
        <div className="flex space-x-4">
          {user && (
            <>
              <Button variant="outline" onClick={() => navigate("/events")}>
                Events
              </Button>
              <Button variant="outline" onClick={() => navigate("/wallet")}>
                Wallet
              </Button>
              <Button variant="outline" onClick={() => navigate("/events/makeevent")}>
                Make Event
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground mr-2">
                Welcome, {user.username}!
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="outline" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </div>
      </nav>

      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Matt's Market</h1>
        <p className="text-lg text-muted-foreground">
          {user ? `Welcome back, ${user.username}!` : "Welcome to the prediction market"}
        </p>
      </div>
    </div>
  );
};
export default Home