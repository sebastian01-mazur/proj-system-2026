import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Button from "../components/ui/Button";

import { getTripById, getTripExpenses } from "../services/tripService";

export default function TripDetails() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTripDetails() {
      const tripData = await getTripById(id);
      const expensesData = await getTripExpenses(id);

      setTrip(tripData);
      setTripExpenses(expensesData);
      setLoading(false);
    }

    loadTripDetails();
  }, [id]);

  function formatMoney(amount) {
    return Number(amount || 0).toFixed(2);
  }

  function getPersonAvatar(name = "") {
    if (name.includes("Piotr")) return "👨🏻";
    if (name.includes("Joanna")) return "👩🏻";
    if (name.includes("Jan")) return "👨🏻‍💼";
    if (name.includes("Marek")) return "👨🏼";
    if (name.includes("Marysia")) return "👩🏼";
    if (name.includes("Mateusz")) return "👨🏼";
    return "👤";
  }

  function getExpenseName(expense) {
    return expense.name || expense.title || expense.category || "Wydatek";
  }

  function getExpenseDate(expense) {
    return expense.expenseDate || expense.date || "";
  }

  function getExpenseOriginalAmount(expense) {
    return Number(expense.originalAmount ?? expense.amount ?? 0);
  }

  function getExpenseOriginalCurrency(expense) {
    return expense.originalCurrency || expense.currency || "PLN";
  }

  function getExpenseConvertedAmount(expense) {
    return Number(expense.convertedAmount ?? expense.amount ?? 0);
  }

  function getExpenseBaseCurrency(expense) {
    return expense.baseCurrency || trip?.currency || "PLN";
  }

  if (loading) {
    return (
      <div className="mobile-page">
        <Header />
        <main className="content">
          <p>Ładowanie szczegółów podróży...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mobile-page">
        <Header />
        <main className="content">
          <h2>Nie znaleziono podróży</h2>
          <Link to="/home">Wróć do strony głównej</Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const totalExpenses = tripExpenses.reduce(
    (sum, expense) => sum + getExpenseConvertedAmount(expense),
    0
  );

  const budget = Number(trip.budget || 0);
  const remainingBudget = budget - totalExpenses;
  const budgetUsage =
    budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;

  const visibleParticipants = trip.participants.slice(0, 4);
  const visibleExpenses = [...tripExpenses].slice(-3).reverse();

  const hiddenParticipantsCount =
    trip.participants.length - visibleParticipants.length;

  const hiddenExpensesCount = tripExpenses.length - visibleExpenses.length;

  return (
    <div className="mobile-page">
      <Header />

      <main className="content details-content">
        <section className="details-trip-card">
          <img src={trip.image} alt={trip.name} />

          <div className="details-trip-info">
            <div className="details-trip-header">
              <span className="details-status">{trip.status}</span>
              <button className="edit-btn">Edytuj ✎</button>
            </div>

            <h1>{trip.name}</h1>
            <p>🇫🇷 {trip.country}</p>
            <p>
              📅 Termin: {trip.startDate} - {trip.endDate}
            </p>
            <p>👥 Ilość uczestników: {trip.participants.length}</p>
            <p>
              💲 Budżet: {trip.budget} {trip.currency}
            </p>
          </div>
        </section>

        <section className="details-section">
          <div className="section-header">
            <h3>Uczestnicy</h3>

            <Link to="/invitations">
              <Button variant="blue" className="small-btn">
                + Wyślij zaproszenie
              </Button>
            </Link>
          </div>

          <div className="participants-row">
            {visibleParticipants.map((participant, index) => (
              <div className="participant-card" key={participant}>
                <div className="avatar">{getPersonAvatar(participant)}</div>

                <div>
                  <strong>{participant}</strong>
                  <p>{index === 0 ? "Organizator" : "Uczestnik"}</p>
                </div>
              </div>
            ))}

            {hiddenParticipantsCount > 0 && (
              <Link
                to={`/trip/${trip.id}/participants`}
                className="more-card more-link"
              >
                +{hiddenParticipantsCount} →
              </Link>
            )}
          </div>
        </section>

        <section className="details-section">
          <div className="section-header">
            <h3>Najnowsze wydatki</h3>

            <Link to={`/trip/${trip.id}/expenses`}>
              <Button className="small-btn">+ Dodaj wydatek</Button>
            </Link>
          </div>

          <div className="expenses-row">
            {visibleExpenses.length === 0 && (
              <div className="expense-card">
                <p>Nie dodano jeszcze żadnych wydatków.</p>
              </div>
            )}

            {visibleExpenses.map((expense) => (
              <div className="expense-card" key={expense.id}>
                <div className="expense-user">
                  <div className="avatar">{getPersonAvatar(expense.paidBy)}</div>

                  <div>
                    <strong>{getExpenseName(expense)}</strong>
                    <p>{getExpenseDate(expense)}</p>
                  </div>
                </div>

                <p>Zapłacił: {expense.paidBy}</p>

                <h2>
                  {formatMoney(getExpenseOriginalAmount(expense))} {" "}
                  {getExpenseOriginalCurrency(expense)}
                </h2>

                <span>
                  ≈ {formatMoney(getExpenseConvertedAmount(expense))} {" "}
                  {getExpenseBaseCurrency(expense)}
                </span>
              </div>
            ))}

            {hiddenExpensesCount > 0 && (
              <Link
                to={`/trip/${trip.id}/expenses`}
                className="more-card more-link"
              >
                +{hiddenExpensesCount} →
              </Link>
            )}
          </div>
        </section>

        <section className="budget-section">
          <div className="budget-bar">
            <div
              className="budget-progress"
              style={{ width: `${budgetUsage}%` }}
            />
          </div>

          <p>{budgetUsage}% wykorzystania budżetu</p>
        </section>

        <section className="details-section">
          <div className="section-header">
            <h3>Statystyki</h3>

            <Link to={`/trip/${trip.id}/reports`}>
              <Button variant="blue" className="small-btn">
                + Wygeneruj raport
              </Button>
            </Link>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Łączne wydatki</span>
              <strong>
                {formatMoney(totalExpenses)} {trip.currency}
              </strong>
            </div>

            <div className="stat-box">
              <span>Budżet pozostały</span>
              <strong>
                {formatMoney(remainingBudget)} {trip.currency}
              </strong>
            </div>

            <div className="stat-box">
              <span>Uczestnicy</span>
              <strong>{trip.participants.length}</strong>
            </div>

            <div className="stat-box">
              <span>Wydatki</span>
              <strong>{tripExpenses.length}</strong>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
