import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageTitle from "../components/ui/PageTitle";

import { getOrganizerTrips } from "../services/tripApiService";
import {
  acceptInvitation,
  getInvitations,
  rejectInvitation,
  sendTripInvitation,
} from "../services/invitationApiService";
import { getCurrentUser } from "../services/authService";

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
      value.title ||
      value.fullName ||
      value.displayName ||
      value.email ||
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
      value.tripId ||
      value.userId ||
      value.invitationId ||
      fallback
    );
  }

  return fallback;
}

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [inviteCode, setInviteCode] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const currentUser = getCurrentUser();

        if (!currentUser?.id) {
          throw new Error(
            "Brak ID zalogowanego użytkownika. Zaloguj się ponownie."
          );
        }

        const [invitationsData, tripsData] = await Promise.all([
          getInvitations(),
          getOrganizerTrips(currentUser.id),
        ]);

        setInvitations(invitationsData);
        setTrips(Array.isArray(tripsData) ? tripsData : []);
      } catch (error) {
        console.error("Błąd pobierania zaproszeń:", error);
        setError(error.message || "Nie udało się pobrać zaproszeń.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function refreshInvitations() {
    const invitationsData = await getInvitations();
    setInvitations(invitationsData);
  }

  async function handleAccept(invitation) {
    const invitationId = getId(invitation?.id || invitation?.invitationId, "");

    try {
      await acceptInvitation(invitation);

      setInvitations((previousInvitations) =>
        previousInvitations.filter((item) => item.id !== invitationId)
      );
    } catch (error) {
      console.error("Błąd akceptowania zaproszenia:", error);
      alert(`Nie udało się zaakceptować zaproszenia: ${error.message}`);
    }
  }

  async function handleReject(id) {
    try {
      await rejectInvitation(id);

      setInvitations((previousInvitations) =>
        previousInvitations.filter((invitation) => invitation.id !== id)
      );
    } catch (error) {
      console.error("Błąd odrzucania zaproszenia:", error);
      alert(`Nie udało się odrzucić zaproszenia: ${error.message}`);
    }
  }

  async function handleSendTripInvitation(event) {
    event.preventDefault();

    if (!inviteCode.trim()) {
      alert("Wpisz kod zaproszenia znajomego.");
      return;
    }

    if (!selectedTripId) {
      alert("Wybierz podróż.");
      return;
    }

    try {
      setSending(true);

      await sendTripInvitation({
        inviteeId: inviteCode.trim(),
        tripId: selectedTripId,
      });

      alert("Wysłano zaproszenie do podróży.");

      setInviteCode("");
      setSelectedTripId("");
      await refreshInvitations();
    } catch (error) {
      console.error("Błąd wysyłania zaproszenia:", error);
      alert(`Nie udało się wysłać zaproszenia: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout>
      <main className="content">
        <PageTitle
          title="Zaproszenia"
          subtitle="Dołącz do wspólnej podróży albo zaproś znajomego"
        />

        {loading && <p>Ładowanie zaproszeń...</p>}

        {!loading && error && (
          <Card>
            <h3>Nie udało się pobrać zaproszeń</h3>
            <p>{error}</p>
          </Card>
        )}

        {!loading && !error && invitations.length === 0 && (
          <Card>
            <h3>Brak zaproszeń</h3>
            <p>Nie masz obecnie żadnych oczekujących zaproszeń.</p>
          </Card>
        )}

        {!loading &&
          !error &&
          invitations.map((invitation) => (
            <Card className="invite-card" key={invitation.id}>
              <div className="invite-left">
                <div className="invite-avatar">
                  {invitation.avatar ? (
                    <img src={invitation.avatar} alt={invitation.user} />
                  ) : (
                    <span>👤</span>
                  )}
                </div>

                <div>
                  <strong>{invitation.user}</strong>

                  <h3>{invitation.trip}</h3>
                  <p>🌍 {invitation.country}</p>
                  <p>🗓️ Termin: {invitation.date}</p>
                  <p>Status: {invitation.status}</p>
                </div>
              </div>

              <div className="invite-buttons">
                <Button onClick={() => handleAccept(invitation)}>
                  Akceptuj
                </Button>

                <Button
                  variant="blue"
                  onClick={() => handleReject(invitation.id)}
                >
                  Odrzuć
                </Button>
              </div>
            </Card>
          ))}

        <section className="send-invite-section">
          <PageTitle
            title="Zaproś do podróży"
            subtitle="Wklej kod zaproszenia znajomego z jego profilu"
          />

          <form className="invite-form" onSubmit={handleSendTripInvitation}>
            <label>
              Kod zaproszenia znajomego
              <div className="friend-input-row">
                <input
                  type="text"
                  placeholder="Wklej kod zaproszenia znajomego"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                />
              </div>
            </label>

            <label>
              Wybierz podróż
              <select
                value={selectedTripId}
                onChange={(event) => setSelectedTripId(event.target.value)}
              >
                <option value="">Wybierz podróż</option>

                {trips.map((trip) => {
                  const tripId = getId(trip.id || trip.tripId, "");
                  const tripName = getText(trip.name || trip.title, "Podróż");

                  return (
                    <option key={tripId} value={tripId}>
                      {tripName}
                    </option>
                  );
                })}
              </select>
            </label>

            <Button
              type="submit"
              variant="blue"
              className="send-trip-btn"
              disabled={sending}
            >
              {sending ? "Wysyłanie..." : "+ Wyślij zaproszenie"}
            </Button>
          </form>
        </section>
      </main>
    </Layout>
  );
}