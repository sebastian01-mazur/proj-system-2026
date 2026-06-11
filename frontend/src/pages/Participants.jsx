import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

import { getTripById } from "../services/tripApiService";

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

export default function Participants() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrip() {
      try {
        const data = await getTripById(id);
        setTrip(data);
      } catch (error) {
        console.error("Błąd pobierania uczestników:", error);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    }

    loadTrip();
  }, [id]);

  if (loading) {
    return (
        <Layout>
          <main className="content">
            <p>Ładowanie uczestników...</p>
          </main>
        </Layout>
    );
  }

  if (!trip) {
    return (
        <Layout>
          <main className="content">
            <h2>Nie znaleziono podróży</h2>
            <Link to="/home">Wróć do strony głównej</Link>
          </main>
        </Layout>
    );
  }

  const participants = trip.participants || trip.members || [];

  return (
      <Layout>
        <main className="content">
          <Link to={`/trip/${trip.id}`} className="back-btn">
            ← Wróć
          </Link>

          <PageTitle title="Uczestnicy" subtitle={`Podróż: ${trip.name}`} />

          <div className="participants-page-grid">
            {participants.map((participant) => (
                <Card className="participant-full-card" key={getParticipantId(participant)}>
                  <ParticipantAvatar participant={participant} />

                  <div>
                    <strong>{getParticipantName(participant)}</strong>
                    <p>{participant.role || "Uczestnik"}</p>
                  </div>
                </Card>
            ))}
          </div>
        </main>
      </Layout>
  );
}
