import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GridScan from "@/components/GridScan";

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
      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <GridScan className="w-full h-full" />
      </div>
      {/* NAV */}
      {user && (
        <nav className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 z-10 shadow-lg">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 hover:text-white transition-colors rounded-full px-4"
              onClick={() => navigate("/events")}
            >
              Events
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 hover:text-white transition-colors rounded-full px-4"
              onClick={() => navigate("/wallet")}
            >
              Wallet
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 hover:text-white transition-colors rounded-full px-4"
              onClick={() => navigate("/events/makeevent")}
            >
              Make Event
            </Button>
          </div>
          
          <div className="w-px h-6 bg-white/20" />
          
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              className="rounded-full px-6 hover:bg-white/90 transition-colors text-white hover:text-black"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="text-center z-10 pointer-events-none shadow-2xl">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-white tracking-tighter pointer-events-auto">Matt's Market</h1>
        <p className="text-xl md:text-2xl text-white/80 mb-8 font-light tracking-wide pointer-events-auto">
          Predict the Future. Own the Outcome.
        </p>
        <div className="flex justify-center gap-4 pointer-events-auto">
          {!user ? (
            <>
              <Button 
                className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6 rounded-full"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button 
                className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 text-lg px-8 py-6 rounded-full"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </>
          ) : (
            <Button 
              className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6 rounded-full font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300"
              onClick={() => navigate("/events")}
            >
              Place your bets
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default Home