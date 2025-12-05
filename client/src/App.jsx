import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import PrivateRoute from "./routes/PrivateRoutes";

import Layout from "./layout/Layout";

import Home from "./pages/Home";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Wallet from "./pages/privatePages/userPages/Wallet";
import AllEvents from "./pages/privatePages/events/AllEvents";
import EventOverview from "./pages/privatePages/events/EventOverview";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/events" element={<AllEvents />} />
            <Route path="/events/:eventId" element={<EventOverview />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
