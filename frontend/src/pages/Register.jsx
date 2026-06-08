import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import facebookIcon from "../assets/fb.png";
import googleIcon from "../assets/google.png";
import logoIcon from "../assets/logo.png";

export default function Register() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("Jan Kowalski");
    const [email, setEmail] = useState("jan.kowalski@o2.pl");
    const [password, setPassword] = useState("Test1234");
    const [confirmPassword, setConfirmPassword] = useState("Test1234");

    const [acceptAll, setAcceptAll] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(true);
    const [acceptPrivacy, setAcceptPrivacy] = useState(true);
    const [acceptSmsMarketing, setAcceptSmsMarketing] = useState(false);
    const [acceptEmailMarketing, setAcceptEmailMarketing] = useState(false);

    const [error, setError] = useState("");

    function handleAcceptAllChange(event) {
        const checked = event.target.checked;

        setAcceptAll(checked);
        setAcceptTerms(checked);
        setAcceptPrivacy(checked);
        setAcceptSmsMarketing(checked);
        setAcceptEmailMarketing(checked);
    }

    function validatePassword(value) {
        const hasMinLength = value.length >= 8;
        const hasUppercase = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);

        return hasMinLength && hasUppercase && hasNumber;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!validatePassword(password)) {
            setError(
                "Hasło musi mieć minimum 8 znaków, jedną wielką literę i jedną cyfrę."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Hasła muszą być takie same.");
            return;
        }

        if (!acceptTerms || !acceptPrivacy) {
            setError("Musisz zaakceptować regulamin oraz politykę prywatności.");
            return;
        }

        const [name = "", ...surnameParts] = fullName.trim().split(" ");
        const surname = surnameParts.join(" ");

        await register({
            name,
            surname,
            email,
            password,
        });

        navigate("/home");
    }

    return (
        <div className="auth-page">
            <main className="auth-card register-card">
                <div className="auth-logo-icon"><img src={logoIcon} alt="Logo" className="oauth-logo"/></div>
                <h1 className="auth-logo">SplitTrip</h1>

                <h2>Zarejestruj się</h2>

                {error && <div className="auth-error">{error}</div>}

                <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => {
                        window.location.href = "http://localhost:8080/oauth2/authorization/google";
                    }}
                >
                    <img src={googleIcon} alt="Google" className="oauth-google" />
                    Kontynuuj z Google
                </button>
                <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => {
                        window.location.href = "http://localhost:8080/oauth2/authorization/facebook";
                    }}
                >
                    <img src={facebookIcon} alt="Facebook" className="oauth-fb" />
                    Kontynuuj z Facebook
                </button>

                <div className="auth-separator">Lub</div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label>Imię i nazwisko</label>
                    <input
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Piotr Kowalski"
                        required
                    />

                    <label>Email</label>
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

                    <label>Powtórz hasło</label>
                    <input
                        type="password"
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Powtórz haslo"
                        required
                    />

                    <div className="consents">
                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                checked={acceptAll}
                                onChange={handleAcceptAllChange}
                            />
                            <span>I accept all consents.</span>
                        </label>

                        <label className="checkbox-row nested">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(event) => setAcceptTerms(event.target.checked)}
                            />
                            <span>
                I accept the <Link to="/terms">Terms & Conditions</Link> *
              </span>
                        </label>

                        <label className="checkbox-row nested">
                            <input
                                type="checkbox"
                                checked={acceptPrivacy}
                                onChange={(event) => setAcceptPrivacy(event.target.checked)}
                            />
                            <span>
                I have read the <Link to="/privacy">Privacy Policy</Link> *
              </span>
                        </label>

                        <label className="checkbox-row nested">
                            <input
                                type="checkbox"
                                checked={acceptSmsMarketing}
                                onChange={(event) =>
                                    setAcceptSmsMarketing(event.target.checked)
                                }
                            />
                            <span>
                I agree to receive marketing messages via SMS (optional)
              </span>
                        </label>

                        <label className="checkbox-row nested">
                            <input
                                type="checkbox"
                                checked={acceptEmailMarketing}
                                onChange={(event) =>
                                    setAcceptEmailMarketing(event.target.checked)
                                }
                            />
                            <span>
                I agree to receive marketing messages via email (optional)
              </span>
                        </label>
                    </div>

                    <button className="auth-submit" type="submit">
                        Utwórz konto
                    </button>
                </form>

                <p className="auth-bottom">
                    Masz już konto? <Link to="/login">Zaloguj się</Link>
                </p>
            </main>
        </div>
    );
}