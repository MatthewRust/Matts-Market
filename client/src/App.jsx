import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import PrivateRoute from "./routes/PrivateRoutes";

import Layout from "./layout/Layout";

import Home from "./pages/Home";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Wallet from "./pages/privatePages/userPages/Wallet";
import AllEvents from "./pages/privatePages/events/AllEvents";
import EventOverview from "./pages/privatePages/events/EventOverview";
import MakeEvent from "./pages/privatePages/events/MakeEvent";
import BuyShares from "./pages/privatePages/shares/BuyShares";
import SellShares from "./pages/privatePages/shares/SellShare";
import AdminDecisions from "./pages/privatePages/adminPages/adminDecisions";



function App() {
  return (
    <ThemeProvider>
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
              <Route path="/events/makeevent" element={<MakeEvent/>} />
              <Route path="/events/buyshares/:outcomeID/:yesNo" element={<BuyShares />} />
              <Route path="/events/sellshares/:outcomeID/:yesNo" element={<SellShares />} />
              <Route path="/admin/decisions" element={<AdminDecisions />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
