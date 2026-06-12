import { Link } from "react-router-dom";

export default function Privacy() {
    return (
        <div className="auth-page">
            <main className="auth-card legal-card">
                <h1 className="auth-logo">SplitTrip</h1>

                <Link to="/register" className="back-btn">
                    ← Wróć
                </Link>

                <h2>Privacy Policy</h2>

                <div className="legal-content">
                    <h3>1. Administrator danych</h3>
                    <p>Zespół projektowy SplitTrip.</p>

                    <h3>2. Zakres danych</h3>
                    <p>
                        Imię, email, podróże, wydatki i dane profilu użytkownika.
                    </p>

                    <h3>3. Cel przetwarzania</h3>
                    <p>Obsługa aplikacji i rozliczeń podróżyy.</p>

                    <h3>4. Przechowywanie danych</h3>
                    <p>Dane mogą być przechowywane w naszej bazie danych.</p>

                    <h3>5. Prawa użytkownikaa</h3>
                    <p>Możliwość wglądu, edycji i usunięcia danych.</p>
                </div>
            </main>
        </div>
    );
}