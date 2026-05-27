import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home.jsx";
import NewTrip from "./pages/NewTrip.jsx";
import Invitations from "./pages/Invitations.jsx";

function HomeMock() {
    return <h1 style={{ padding: 40 }}>Home (tymczasowy)</h1>;
}

export default function App() {
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
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <HomeMock />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}