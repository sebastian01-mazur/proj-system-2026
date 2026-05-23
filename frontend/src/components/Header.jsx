import { Link, useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../services/authService";

export default function Header() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="header">
      <Link to="/home" className="logo">
        SplitTrip
      </Link>

      <div className="header-icons">
        <Link to="/home">🏠</Link>
        <Link to="/invitations">✉️</Link>

        <Link to="/profile" className="profile-header-link">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profil" />
          ) : (
            <span>👤</span>
          )}
        </Link>

        <button className="logout-btn" onClick={handleLogout}>
          Wyloguj
        </button>
      </div>
    </header>
  );
}