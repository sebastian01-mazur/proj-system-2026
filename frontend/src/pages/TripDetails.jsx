import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Button from "../components/ui/Button";

import { getTripById, removeTripMember } from "../services/tripApiService.js";
import { getTripExpenses } from "../services/expenseApiService.js";
import { getCurrentUser } from "../services/authService.js";

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

function isGenericParticipantName(name) {
  return ["uczestnik", "participant", "member"].includes(
    String(name || "").trim().toLowerCase()
  );
}

function isGenericOrganizerName(name) {
  return ["organizator", "organizer", "owner", "właściciel", "wlasciciel"].includes(
    String(name || "").trim().toLowerCase()
  );
}

function cleanPersonName(name) {
  if (!name || isGenericParticipantName(name) || isGenericOrganizerName(name)) {
    return "";
  }

  return String(name).trim();
}

function getParticipantId(participant) {
  if (!participant) {
    return "";
  }

  if (typeof participant === "string" || typeof participant === "number") {
    return String(participant);
  }

  return getId(
    participant.userId ||
      participant.id ||
      participant.uuid ||
      participant.accountId ||
      participant.profileId ||
      participant.participantId ||
      participant.memberUserId ||
      participant.user?.userId ||
      participant.user?.id ||
      participant.user?.uuid ||
      participant.account?.userId ||
      participant.account?.id ||
      participant.profile?.userId ||
      participant.profile?.id ||
      "",
    ""
  );
}

function getParticipantEmail(participant) {
  if (!participant || typeof participant !== "object") {
    return "";
  }

  return getText(
    participant.email ||
      participant.user?.email ||
      participant.account?.email ||
      participant.profile?.email,
    ""
  );
}

function getVisibleParticipantName(participant) {
  const currentUser = getCurrentUser();
  const participantId = getParticipantId(participant);

  if (currentUser?.id && participantId && String(currentUser.id) === String(participantId)) {
    return cleanPersonName(currentUser.name) || currentUser.email || `Użytkownik ${String(participantId).slice(0, 8)}`;
  }

  if (typeof participant === "string" || typeof participant === "number") {
    const value = String(participant);
    return value.includes("@") ? value : `Użytkownik ${value.slice(0, 8)}`;
  }

  const name =
    cleanPersonName(participant?.name) ||
    cleanPersonName(participant?.fullName) ||
    cleanPersonName(participant?.login) ||
    cleanPersonName(participant?.userName) ||
    cleanPersonName(participant?.username) ||
    cleanPersonName(participant?.displayName) ||
    cleanPersonName(participant?.user?.name) ||
    cleanPersonName(participant?.user?.fullName) ||
    cleanPersonName(participant?.user?.login) ||
    cleanPersonName(participant?.user?.userName) ||
    cleanPersonName(participant?.user?.username) ||
    cleanPersonName(participant?.user?.displayName) ||
    cleanPersonName(participant?.account?.name) ||
    cleanPersonName(participant?.account?.login) ||
    cleanPersonName(participant?.profile?.name) ||
    cleanPersonName(participant?.profile?.login) ||
    getParticipantEmail(participant);

  return name || (participantId ? `Użytkownik ${String(participantId).slice(0, 8)}` : "");
}

function isOrganizerParticipant(participant) {
  return participant?.isOrganizer || participant?.role === "Organizator";
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
  const organizerId = getId(trip?.organizer?.userId || trip?.organizer?.id || trip?.organizerId, "");
  const name =
    cleanPersonName(trip?.organizerName) ||
    cleanPersonName(trip?.organizerLogin) ||
    cleanPersonName(trip?.organizerUsername) ||
    cleanPersonName(trip?.createdByName) ||
    cleanPersonName(trip?.createdByLogin) ||
    cleanPersonName(trip?.createdByUsername) ||
    cleanPersonName(trip?.ownerName) ||
    cleanPersonName(trip?.ownerLogin) ||
    cleanPersonName(trip?.ownerUsername) ||
    getVisibleParticipantName(trip?.organizer) ||
    getVisibleParticipantName(trip?.createdBy) ||
    getVisibleParticipantName(trip?.owner);

  return name || (organizerId ? `Użytkownik ${String(organizerId).slice(0, 8)}` : "Nieznany organizator");
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
  const name = getVisibleParticipantName(participant);

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

  const firstEmail = getParticipantEmail(firstParticipant);
  const secondEmail = getParticipantEmail(secondParticipant);

  return Boolean(
    firstEmail &&
      secondEmail &&
      String(firstEmail).toLowerCase() === String(secondEmail).toLowerCase()
  );
}

function buildParticipants(trip) {
  const rawParticipants = Array.isArray(trip.participants)
    ? trip.participants
    : Array.isArray(trip.members)
      ? trip.members
      : [];

  const organizer = {
    ...(trip.organizer || {}),
    id: getId(trip.organizer?.id || trip.organizer?.userId || trip.organizerId, "organizer"),
    userId: getId(trip.organizer?.userId || trip.organizer?.id || trip.organizerId, "organizer"),
    name: getOrganizerName(trip),
    role: "Organizator",
    isOrganizer: true,
  };

  return [organizer, ...rawParticipants].reduce((participants, participant) => {
    const participantId = getParticipantId(participant);
    const normalizedParticipant = {
      ...participant,
      id: participantId || participant?.id || participant?.memberId || getVisibleParticipantName(participant),
      userId: participantId || participant?.userId || participant?.id || "",
      name: getVisibleParticipantName(participant),
      email: getParticipantEmail(participant),
      avatar: getParticipantAvatar(participant),
      role: isOrganizerParticipant(participant) || sameParticipant(participant, organizer) ? "Organizator" : "Uczestnik",
      isOrganizer: isOrganizerParticipant(participant) || sameParticipant(participant, organizer),
    };

    if (!normalizedParticipant.name) {
      return participants;
    }

    const alreadyExists = participants.some((existingParticipant) =>
      sameParticipant(existingParticipant, normalizedParticipant)
    );

    if (!alreadyExists) {
      participants.push(normalizedParticipant);
    }

    return participants;
  }, []);
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
  const [removingParticipantId, setRemovingParticipantId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function reloadTripDetails() {
    const tripData = await getTripById(id);
    const expensesData = await getTripExpenses(id, tripData);

    setTrip(tripData);
    setTripExpenses(expensesData);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadTripDetails(showLoader = true) {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError("");

        await reloadTripDetails();
      } catch (error) {
        if (!cancelled) {
          console.error("Błąd pobieraniaa szczegółów podróży:", error);
          setError(error.message || "Nie udało się pobrać szczegółów podróży.");
        }
      } finally {
        if (!cancelled && showLoader) {
          setLoading(false);
        }
      }
    }

    loadTripDetails();

    const refreshOnFocus = () => loadTripDetails(false);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [id]);

  async function handleRemoveParticipant(participant) {
    const participantId = getParticipantId(participant);
    const participantName = getVisibleParticipantName(participant) || "tego uczestnika";

    if (isOrganizerParticipant(participant)) {
      setActionMessage("Nie można usunąć organizatora wycieczki.");
      return;
    }

    const currentUser = getCurrentUser();
    const participantsList = buildParticipants(trip);
    const currentUserIsOrganizer = participantsList.some(
      (item) => isOrganizerParticipant(item) && sameParticipant(item, currentUser)
    );

    const isRemovingSelf = sameParticipant(participant, currentUser);

    if (!currentUserIsOrganizer && !isRemovingSelf) {
      setActionMessage("Tylko organizator może usuwać innych uczestników.");
      return;
    }

    const confirmMessage = isRemovingSelf
      ? "Czy na pewno chcesz opuścić tę wycieczkę?"
      : `Usunąć uczestnika ${participantName} z wycieczki?`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    try {
      setRemovingParticipantId(participantId);
      setActionMessage("");
      await removeTripMember(id, participant);

      setTrip((currentTrip) => {
        if (!currentTrip) {
          return currentTrip;
        }

        const nextParticipants = (currentTrip.participants || currentTrip.members || []).filter(
          (item) => String(getParticipantId(item)) !== String(participantId)
        );

        return {
          ...currentTrip,
          participants: nextParticipants,
          members: nextParticipants,
          participantsCount: nextParticipants.length,
        };
      });

      setActionMessage(isRemovingSelf ? "Opuściłeś wycieczkę." : "Uczestnik został usunięty z wycieczki.");

      try {
        await reloadTripDetails();
      } catch (reloadError) {
        console.warn("Nie udało się odświeżyć szczegółów podróży po usunięciu:", reloadError);
      }
    } catch (error) {
      console.error("Błąd usuwania uczestnika:", error);
      setActionMessage(error.message || "Nie udało się usunąć uczestnika.");
    } finally {
      setRemovingParticipantId("");
    }
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
  const currentUser = getCurrentUser();
  const currentUserIsOrganizer = participants.some(
    (participant) => isOrganizerParticipant(participant) && sameParticipant(participant, currentUser)
  );
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

          {actionMessage && <p className="action-message">{actionMessage}</p>}

          <div className="participants-row">
            {visibleParticipants.map((participant, index) => {
              const participantId = getParticipantId(participant) || `${getVisibleParticipantName(participant)}-${index}`;
              const removing = removingParticipantId === participantId;
              const organizer = isOrganizerParticipant(participant);

              return (
                <div className="participant-card" key={participantId}>
                  <ParticipantAvatar participant={participant} />

                  <div className="participant-main-info">
                    <strong>{getVisibleParticipantName(participant)}</strong>
                    <p>{participant.role || "Uczestnik"}</p>
                  </div>

                  {((currentUserIsOrganizer && !organizer && !sameParticipant(participant, currentUser)) ||
                    (!currentUserIsOrganizer && sameParticipant(participant, currentUser) && !organizer)) && (
                    <button
                      type="button"
                      className="remove-participant-icon"
                      onClick={() => handleRemoveParticipant(participant)}
                      disabled={removing}
                      title={sameParticipant(participant, currentUser) ? "Opuść wycieczkę" : "Usuń uczestnika"}
                    >
                      {removing ? "…" : "×"}
                    </button>
                  )}
                </div>
              );
            })}

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