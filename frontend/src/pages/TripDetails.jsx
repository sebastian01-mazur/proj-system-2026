import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Button from "../components/ui/Button";

import { getTripById } from "../services/tripApiService.js";
import {
  getTripExpenses,
  getParticipantId,
  getParticipantName,
} from "../services/expenseApiService.js";

function getText(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.fullName ||
      value.displayName ||
      value.username ||
      value.email ||
      value.code ||
      value.label ||
      fallback
    );
  }

  return fallback;
}

function getId(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.id ||
      value.uuid ||
      value.userId ||
      value.tripId ||
      value.accountId ||
      value.memberId ||
      value.user?.id ||
      value.user?.userId ||
      fallback
    );
  }

  return fallback;
}

function getCurrency(trip) {
  return getText(trip?.currency || trip?.baseCurrency, "PLN");
}

function getCountry(trip) {
  return getText(trip?.country, "");
}

function getCity(trip) {
  return getText(trip?.city, "");
}

function getTripName(trip) {
  return getText(trip?.name || trip?.title, "Podróż");
}

function getTripImage(trip) {
  return (
    trip?.image ||
    trip?.imageUrl ||
    trip?.photo ||
    trip?.photoUrl ||
    "/src/assets/photo-1502602898657-3e91760cbb34.jpg"
  );
}

function getTripStatus(trip) {
  return getText(trip?.status, "Aktywna");
}

function getTripBudget(trip) {
  return Number(trip?.budget || trip?.plannedBudget || trip?.totalBudget || 0);
}

function getTripStartDate(trip) {
  return getText(trip?.startDate || trip?.dateFrom || trip?.start_date, "");
}

function getTripEndDate(trip) {
  return getText(trip?.endDate || trip?.dateTo || trip?.end_date, "");
}

function getOrganizerName(trip) {
  return getText(
    trip?.organizerName ||
      trip?.createdByName ||
      trip?.ownerName ||
      trip?.organizer ||
      trip?.owner ||
      trip?.createdBy,
    "Organizator"
  );
}

function getParticipantAvatar(participant) {
  if (!participant || typeof participant !== "object") {
    return "";
  }

  return (
    participant.avatar ||
    participant.avatarUrl ||
    participant.photoUrl ||
    participant.profilePicture ||
    participant.user?.avatar ||
    participant.user?.avatarUrl ||
    participant.user?.photoUrl ||
    ""
  );
}

function getInitials(name = "") {
  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "👤";
}

function ParticipantAvatar({ participant }) {
  const avatar = getParticipantAvatar(participant);
  const name = getParticipantName(participant);

  return (
    <div className="avatar">
      {avatar ? <img src={avatar} alt={name} /> : <span>{getInitials(name)}</span>}
    </div>
  );
}

function sameParticipant(firstParticipant, secondParticipant) {
  const firstId = getParticipantId(firstParticipant);
  const secondId = getParticipantId(secondParticipant);

  if (firstId && secondId && String(firstId) === String(secondId)) {
    return true;
  }

  return getParticipantName(firstParticipant) === getParticipantName(secondParticipant);
}

function buildParticipants(trip) {
  const organizer = {
    id: getId(trip.organizer?.id || trip.organizer?.userId || trip.organizerId, "organizer"),
    userId: getId(trip.organizer?.userId || trip.organizer?.id || trip.organizerId, "organizer"),
    name: getOrganizerName(trip),
    role: "Organizator",
    isOrganizer: true,
  };

  const rawParticipants = Array.isArray(trip.participants)
    ? trip.participants
    : Array.isArray(trip.members)
      ? trip.members
      : [];

  return rawParticipants.reduce(
    (participants, participant) => {
      const normalizedParticipant = {
        ...participant,
        id: getParticipantId(participant),
        userId: getParticipantId(participant),
        name: getParticipantName(participant),
        avatar: getParticipantAvatar(participant),
        role: sameParticipant(participant, organizer) ? "Organizator" : "Uczestnik",
        isOrganizer: sameParticipant(participant, organizer),
      };

      const alreadyExists = participants.some((existingParticipant) =>
        sameParticipant(existingParticipant, normalizedParticipant)
      );

      if (!alreadyExists) {
        participants.push(normalizedParticipant);
      }

      return participants;
    },
    [organizer]
  );
}

function getExpenseName(expense) {
  return getText(expense?.name || expense?.description || expense?.category, "Wydatek");
}

function getExpenseCategory(expense) {
  return getText(expense?.category, "Inne");
}

function getExpenseDate(expense) {
  return getText(expense?.expenseDate || expense?.date, "");
}

function getExpensePaidBy(expense) {
  return getText(expense?.paidBy || expense?.payerName || expense?.payer, "Uczestnik");
}

function getExpenseAmount(expense) {
  return Number(expense?.originalAmount || expense?.amount || 0);
}

function getExpenseConvertedAmount(expense) {
  return Number(expense?.convertedAmount || expense?.amount || 0);
}

function getExpenseCurrency(expense, trip) {
  return getText(expense?.originalCurrency || expense?.currency, getCurrency(trip));
}

export default function TripDetails() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTripDetails() {
      try {
        setLoading(true);
        setError("");

        const tripData = await getTripById(id);
        const expensesData = await getTripExpenses(id, tripData);

        setTrip(tripData);
        setTripExpenses(expensesData);
      } catch (error) {
        console.error("Błąd pobierania szczegółów podróży:", error);
        setError(error.message || "Nie udało się pobrać szczegółów podróży.");
      } finally {
        setLoading(false);
      }
    }

    loadTripDetails();
  }, [id]);

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

  if (error) {
    return (
      <div className="mobile-page">
        <Header />

        <main className="content">
          <h2>Nie udało się pobrać szczegółów podróży</h2>
          <p>{error}</p>

          <Link to="/home">Wróć do strony głównej</Link>
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

  const participants = buildParticipants(trip);
  const currency = getCurrency(trip);
  const budget = getTripBudget(trip);

  const totalExpenses = tripExpenses.reduce(
    (sum, expense) => sum + getExpenseConvertedAmount(expense),
    0
  );

  const remainingBudget = budget - totalExpenses;

  const budgetUsage =
    budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;

  const visibleParticipants = participants.slice(0, 4);
  const visibleExpenses = tripExpenses.slice(0, 3);

  const hiddenParticipantsCount = participants.length - visibleParticipants.length;
  const hiddenExpensesCount = tripExpenses.length - visibleExpenses.length;

  const city = getCity(trip);
  const country = getCountry(trip);

  return (
    <div className="mobile-page">
      <Header />

      <main className="content details-content">
        <section className="details-trip-card">
          <img src={getTripImage(trip)} alt={getTripName(trip)} />

          <div className="details-trip-info">
            <div className="details-trip-header">
              <span className="details-status">{getTripStatus(trip)}</span>
              <button className="edit-btn">Edytuj ✎</button>
            </div>

            <h1>{getTripName(trip)}</h1>

            <p>
              🌍{" "}
              {city && country
                ? `${city}, ${country}`
                : city || country || "Brak lokalizacji"}
            </p>

            <p>
              📅 Termin: {getTripStartDate(trip)} - {getTripEndDate(trip)}
            </p>

            <p>👤 Organizator: {getOrganizerName(trip)}</p>
            <p>👥 Ilość uczestników: {participants.length}</p>
            <p>
              💲 Budżet: {budget.toFixed(2)} {currency}
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
            {visibleParticipants.map((participant) => (
              <div className="participant-card" key={getParticipantId(participant)}>
                <ParticipantAvatar participant={participant} />

                <div>
                  <strong>{getParticipantName(participant)}</strong>
                  <p>{participant.role || "Uczestnik"}</p>
                </div>
              </div>
            ))}

            {hiddenParticipantsCount > 0 && (
              <Link to={`/trip/${getId(trip.id, id)}/participants`} className="more-card more-link">
                +{hiddenParticipantsCount} →
              </Link>
            )}
          </div>
        </section>

        <section className="details-section">
          <div className="section-header">
            <h3>Najnowsze wydatki</h3>

            <Link to={`/trip/${getId(trip.id, id)}/expenses`}>
              <Button className="small-btn">+ Dodaj wydatek</Button>
            </Link>
          </div>

          <div className="expenses-row">
            {visibleExpenses.length === 0 ? (
              <p>Nie dodano jeszcze żadnych wydatków.</p>
            ) : (
              visibleExpenses.map((expense, index) => (
                <div className="expense-card" key={getId(expense.id, index)}>
                  <div className="expense-user">
                    <div className="avatar">
                      {index === 0 ? "👨🏻" : index === 1 ? "👩🏻" : "👩🏼"}
                    </div>

                    <div>
                      <strong>{getExpenseCategory(expense)}</strong>
                      <p>{getExpenseDate(expense)}</p>
                    </div>
                  </div>

                  <p>Zapłacił: {getExpensePaidBy(expense)}</p>

                  <h2>
                    {getExpenseAmount(expense).toFixed(2)} {getExpenseCurrency(expense, trip)}
                  </h2>

                  <span>
                    ≈ {getExpenseConvertedAmount(expense).toFixed(2)} {currency}
                  </span>
                </div>
              ))
            )}

            {hiddenExpensesCount > 0 && (
              <Link to={`/trip/${getId(trip.id, id)}/expenses`} className="more-card more-link">
                +{hiddenExpensesCount} →
              </Link>
            )}
          </div>
        </section>

        <section className="budget-section">
          <div className="budget-bar">
            <div className="budget-progress" style={{ width: `${budgetUsage}%` }} />
          </div>

          <p>{budgetUsage}% wykorzystania budżetu</p>
        </section>

        <section className="details-section">
          <div className="section-header">
            <h3>Statystyki</h3>

            <Link to={`/trip/${getId(trip.id, id)}/reports`}>
              <Button variant="blue" className="small-btn">
                + Wygeneruj raport
              </Button>
            </Link>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Łączne wydatki</span>
              <strong>
                {totalExpenses.toFixed(2)} {currency}
              </strong>
            </div>

            <div className="stat-box">
              <span>Budżet pozostały</span>
              <strong>
                {remainingBudget.toFixed(2)} {currency}
              </strong>
            </div>

            <div className="stat-box">
              <span>Uczestnicy</span>
              <strong>{participants.length}</strong>
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