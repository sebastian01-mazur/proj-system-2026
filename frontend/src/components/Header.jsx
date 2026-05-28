import { Link, useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../services/authService";

import homeIcon from "../assets/home.png";
import zaproszeniaIcon from "../assets/zaproszenia.png";
import logoIcon from "../assets/logo.png";
import splitTripText from "../assets/SplitTrip.png";

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
        <img src={logoIcon} alt="Logo SplitTrip" className="header-logo-icon" />
        <img src={splitTripText} alt="SplitTrip" className="header-logo-text" />
      </Link>

      <div className="header-icons">
        <Link to="/home">
          <img src={homeIcon} alt="Strona główna" className="header-icon-img" />
        </Link>

        <Link to="/invitations">
          <img src={zaproszeniaIcon} alt="Zaproszenia" className="header-icon-img" />
        </Link>

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