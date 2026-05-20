import { Link } from "react-router-dom";

export default function ForgotPassword() {
    return (
        <div className="auth-page">
            <main className="auth-card">
                <h1 className="auth-logo">SplitTrip</h1>

                <h2>Reset hasła</h2>

                <p style={{ marginTop: "16px", marginBottom: "24px" }}>
                    Funkcja resetowania hasła w procesie...
                </p>

                <Link to="/login" className="auth-submit" style={{ display: "block", textAlign: "center", lineHeight: "45px" }}>
                    Powrót do logowania
                </Link>
            </main>
        </div>
    );
}