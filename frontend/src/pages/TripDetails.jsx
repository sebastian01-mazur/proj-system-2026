import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Button from "../components/ui/Button";

import { getTripById, getTripExpenses } from "../services/tripApiService.js";

function getParticipantName(participant) {
    return participant?.name || participant?.fullName || participant?.email || participant || "Uczestnik";
}

function getParticipantAvatar(participant) {
    return (
        participant?.avatar ||
        participant?.avatarUrl ||
        participant?.photoUrl ||
        participant?.profilePicture ||
        ""
    );
}

function getParticipantId(participant) {
    return participant?.userId || participant?.id || participant?.email || getParticipantName(participant);
}

function getInitials(name = "") {
    const initials = name
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
        ...(trip.organizer || {}),
        id: trip.organizer?.id || trip.organizer?.userId || trip.organizerId || "organizer",
        userId: trip.organizer?.userId || trip.organizer?.id || trip.organizerId || "organizer",
        name:
            trip.organizer?.name ||
            trip.organizerName ||
            trip.createdByName ||
            trip.ownerName ||
            "Organizator",
        role: "Organizator",
        isOrganizer: true,
    };

    const rawParticipants = Array.isArray(trip.participants || trip.members)
        ? trip.participants || trip.members
        : [];

    return rawParticipants.reduce(
        (participants, participant) => {
            const normalizedParticipant = {
                ...participant,
                id: getParticipantId(participant),
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

export default function TripDetails() {
    const { id } = useParams();

    const [trip, setTrip] = useState(null);
    const [tripExpenses, setTripExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTripDetails() {
            try {
                const tripData = await getTripById(id);
                const expensesData = await getTripExpenses(id);

                setTrip(tripData);
                setTripExpenses(expensesData);
            } catch (error) {
                console.error("Błąd pobierania szczegółów podróży:", error);
                setTrip(null);
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
    const budget = Number(trip.budget || trip.plannedBudget || 0);

    const totalExpenses = tripExpenses.reduce(
        (sum, expense) => sum + Number(expense.convertedAmount ?? expense.amount ?? 0),
        0
    );

    const remainingBudget = budget - totalExpenses;
    const budgetUsage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;

    const visibleParticipants = participants.slice(0, 4);
    const visibleExpenses = tripExpenses.slice(0, 3);

    const hiddenParticipantsCount =
        participants.length - visibleParticipants.length;

    const hiddenExpensesCount =
        tripExpenses.length - visibleExpenses.length;

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
                        <p>🌍 {trip.city ? `${trip.city}, ${trip.country}` : trip.country}</p>
                        <p>📅 Termin: {trip.startDate} - {trip.endDate}</p>
                        <p>👤 Organizator: {trip.organizerName || trip.organizer?.name || "Organizator"}</p>
                        <p>👥 Ilość uczestników: {participants.length}</p>
                        <p>💲 Budżet: {trip.budget} {trip.currency}</p>
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
                            <Button className="small-btn">
                                + Dodaj wydatek
                            </Button>
                        </Link>
                    </div>

                    <div className="expenses-row">
                        {visibleExpenses.map((expense, index) => (
                            <div className="expense-card" key={expense.id}>
                                <div className="expense-user">
                                    <div className="avatar">
                                        {index === 0 ? "👨🏻" : index === 1 ? "👩🏻" : "👩🏼"}
                                    </div>

                                    <div>
                                        <strong>{expense.category}</strong>
                                        <p>{expense.date}</p>
                                    </div>
                                </div>

                                <p>Zapłacił: {expense.paidBy}</p>

                                <h2>
                                    {expense.amount} {expense.currency}
                                </h2>

                                <span>≈ {Number(expense.convertedAmount ?? expense.amount ?? 0)} {trip.currency}</span>
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
                            <strong>{totalExpenses} {trip.currency}</strong>
                        </div>

                        <div className="stat-box">
                            <span>Budżet pozostały</span>
                            <strong>{remainingBudget} {trip.currency}</strong>
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
