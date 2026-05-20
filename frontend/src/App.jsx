import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function HomeMock() {
    return <h1 style={{ padding: 40 }}>Home (tymczasowy)</h1>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />

                <Route path="/login" element={<Login />} />

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