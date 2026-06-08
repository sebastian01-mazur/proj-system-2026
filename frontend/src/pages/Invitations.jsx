import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageTitle from "../components/ui/PageTitle";

import {
  getTrips,
  getInvitations,
  acceptInvitation,
  rejectInvitation,
  sendFriendInvitation,
  sendTripInvitation,
} from "../services/tripService";

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("");

  useEffect(() => {
    async function loadData() {
      const invitationsData = await getInvitations();
      const tripsData = await getTrips();

      setInvitations(invitationsData);
      setTrips(tripsData);
      setLoading(false);
    }

    loadData();
  }, []);

  async function handleAccept(id) {
    await acceptInvitation(id);

    setInvitations((previousInvitations) =>
        previousInvitations.filter((invitation) => invitation.id !== id)
    );
  }

  async function handleReject(id) {
    await rejectInvitation(id);

    setInvitations((previousInvitations) =>
        previousInvitations.filter((invitation) => invitation.id !== id)
    );
  }

  async function handleAddFriend() {
    if (!email.trim()) {
      alert("Wpisz email znajomego.");
      return;
    }

    await sendFriendInvitation(email);

    alert(`Wysłano zaproszenie do znajomych na adres: ${email}`);
  }

  async function handleSendTripInvitation(event) {
    event.preventDefault();

    if (!email.trim()) {
      alert("Wpisz email znajomego.");
      return;
    }

    if (!selectedTripId) {
      alert("Wybierz podróż.");
      return;
    }

    await sendTripInvitation({
      email,
      tripId: selectedTripId,
    });

    alert("Wysłano zaproszenie do podróży.");

    setEmail("");
    setSelectedTripId("");
  }

  return (
      <Layout>
        <main className="content">
          <PageTitle
              title="Zaproszenia od znajomych"
              subtitle="Dołącz do wspólnej podróży!"
          />

          {loading && <p>Ładowanie zaproszeń...</p>}

          {!loading && invitations.length === 0 && (
              <Card>
                <h3>Brak zaproszeń</h3>
                <p>Żaden użytkownik nie zaprosił Cię do podróży ani znajomych.</p>
              </Card>
          )}

          {!loading &&
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

                        {invitation.type === "trip" ? (
                            <>
                              <h3>{invitation.trip}</h3>
                              <p>🇳🇱 {invitation.country}</p>
                              <p>🗓️ Termin: {invitation.date}</p>
                            </>
                        ) : (
                            <h3>Zaproszenie do znajomych</h3>
                        )}
                      </div>
                    </div>

                    <div className="invite-buttons">
                      <Button onClick={() => handleAccept(invitation.id)}>
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
                title="Zaproś swoich znajomych"
                subtitle="Stwórzcie razem przygodę!"
            />

            <form className="invite-form" onSubmit={handleSendTripInvitation}>
              <label>
                Email
                <div className="friend-input-row">
                  <input
                      type="email"
                      placeholder="piotr.wisniewski@wp.pl"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                  />

                  <button type="button" onClick={handleAddFriend}>
                    Dodaj znajomego
                  </button>
                </div>
              </label>

              <label>
                Wybierz podróż
                <select
                    value={selectedTripId}
                    onChange={(event) => setSelectedTripId(event.target.value)}
                >
                  <option value="">Wybierz podróż</option>

                  {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.name}
                      </option>
                  ))}
                </select>
              </label>

              <Button type="submit" variant="blue" className="send-trip-btn">
                + Wyślij zaproszenie
              </Button>
            </form>
          </section>
        </main>
      </Layout>
  );
}