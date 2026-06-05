import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import facebookIcon from "../assets/fb.png";
import googleIcon from "../assets/google.png";
import logoIcon from "../assets/logo.png";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("jan.kowalski@o2.pl");
    const [password, setPassword] = useState("Test1234");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        try {
            await login(email, password);
            navigate("/home");
        } catch (err) {
            setError("Dane logowania są niepoprawne.");
        }
    }

    return (
        <div className="auth-page">
            <main className="auth-card">
                <div className="auth-logo-icon"><img src={logoIcon} alt="Logo" className="oauth-logo"/></div>
                <h1 className="auth-logo">SplitTrip</h1>

                {error && (
                    <div className="auth-error">
                        Brak połączenia z serwerem. Spróbuj skorzystać z aplikacji później.
                    </div>
                )}

                <h2>Zaloguj się</h2>

                <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => {
                        window.location.href = "http://130.162.56.186:8001/oauth2/authorization/google";
                    }}
                >
                    <img src={googleIcon} alt="Google" className="oauth-google" />
                    Kontynuuj z Google
                </button>
                <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => {
                        window.location.href = "http://130.162.56.186:8001/oauth2/authorization/facebook";
                    }}
                >
                    <img src={facebookIcon} alt="Facebook" className="oauth-fb" />
                    Kontynuuj z Facebook
                </button>

                <div className="auth-separator">Lub</div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label>E-mail</label>
                    <input
                        type="email"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="kowalski@gmail.com"
                        required
                    />

                    <label>Hasło</label>
                    <input
                        type="password"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="twoje haslo"
                        required
                    />

                    <Link to="/forgot-password" className="small-link">
                        Nie pamiętam hasła
                    </Link>

                    <button className="auth-submit" type="submit">
                        Zaloguj się
                    </button>
                </form>

                <p className="auth-bottom">
                    Nie masz jeszcze konta? <Link to="/register">Zarejestruj się</Link>
                </p>
            </main>
        </div>
    );
}