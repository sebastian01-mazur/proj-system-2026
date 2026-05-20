import { Link } from "react-router-dom";

export default function Terms() {
    return (
        <div className="auth-page">
            <main className="auth-card legal-card">
                <h1 className="auth-logo">SplitTrip</h1>

                <Link to="/register" className="back-btn">
                    ← Wróć
                </Link>

                <h2>Terms & Conditions</h2>

                <div className="legal-content">
                    <h3>1. Postanowienia ogólne</h3>
                    <p>
                        Aplikacja SplitTrip służy do planowania podróży, rejestrowania
                        wydatków oraz rozliczania kosztów pomiędzy uczestnikami.
                    </p>

                    <h3>2. Konto użytkownika</h3>
                    <p>
                        Użytkownik zobowiązuje się do podania prawdziwych danych oraz
                        zabezpieczenia swojego konta.
                    </p>

                    <h3>3. Dane podróży</h3>
                    <p>
                        Użytkownik odpowiada za poprawność danych wprowadzanych do aplikacji.
                    </p>

                    <h3>4. Odpowiedzialność</h3>
                    <p>
                        Aplikacja ma charakter pomocniczy – wyniki należy zweryfikować.
                    </p>

                    <h3>5. Zmiany regulaminu</h3>
                    <p>Regulamin może ulec zmianie wraz z rozwojem aplikacji.</p>
                </div>
            </main>
        </div>
    );
}