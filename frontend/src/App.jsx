import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useEffect } from "react";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home.jsx";
import NewTrip from "./pages/NewTrip.jsx";
import Invitations from "./pages/Invitations.jsx";
import TripDetails from "./pages/TripDetails.jsx"
import Expenses from "./pages/Expenses.jsx"
import Reports from "./pages/Reports.jsx"
import Profile from "./pages/Profile.jsx"
import Participants from "./pages/Participants.jsx"
import { saveOAuthTokenFromUrl } from "./services/authService";

export default function App() {
    useEffect(() => {
        saveOAuthTokenFromUrl();
    }, []);
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/home" element={<Home />} />
                <Route path="/new-trip" element={<NewTrip />} />
                <Route path="/invitations" element={<Invitations />} />
                <Route path="/trip/:id" element={<TripDetails />} />
                <Route path="/trip/:id/expenses" element={<Expenses />} />
                <Route path="/trip/:id/participants" element={<Participants />} />
                <Route path="/trip/:id/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />

            </Routes>
        </BrowserRouter>
    );
}