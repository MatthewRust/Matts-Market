import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 space-x-2">
        <Button variant="outline" onClick={() => navigate("/login")}>
          Login
        </Button>

        <Button variant="outline" onClick={() => navigate("/register")}>
          Register
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Matt's Market</h1>
        <p className="text-lg text-muted-foreground">Welcome to the prediction market</p>
      </div>
    </div>
  );
};
export default Home