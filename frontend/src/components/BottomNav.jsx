import { Link } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <Link to="/home">Home</Link>
      <Link to="/new-trip">Nowa podróż</Link>
      <Link to="/invitations">Zaproszenia</Link>
    </nav>
  );
}