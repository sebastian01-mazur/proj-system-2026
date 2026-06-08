import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

import { getTripById } from "../services/tripApiService";

export default function Participants() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrip() {
      const data = await getTripById(id);
      setTrip(data);
      setLoading(false);
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

  return (
      <Layout>
        <main className="content">
          <Link to={`/trip/${trip.id}`} className="back-btn">
            ← Wróć
          </Link>

          <PageTitle title="Uczestnicy" subtitle={`Podróż: ${trip.name}`} />

          <div className="participants-page-grid">
            {trip.participants.map((participant, index) => (
                <Card className="participant-full-card" key={participant}>
                  <div className="avatar">
                    {index === 0
                        ? "👨🏻‍💼"
                        : index === 1
                            ? "👨🏻"
                            : index === 2
                                ? "👩🏻"
                                : "👩🏼"}
                  </div>

                  <div>
                    <strong>{participant}</strong>
                    <p>{index === 0 ? "Organizator" : "Uczestnik"}</p>
                  </div>
                </Card>
            ))}
          </div>
        </main>
      </Layout>
  );
}