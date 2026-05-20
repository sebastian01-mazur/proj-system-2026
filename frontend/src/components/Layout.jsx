import Header from "./Header";
import BottomNav from "./BottomNav";

export default function Layout({ children }) {
  return (
    <div className="mobile-page">
      <Header />
      {children}
      <BottomNav />
    </div>
  );
}