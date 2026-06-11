import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

import { getCurrentUser } from "../services/authService";
import { getDashboardData } from "../services/dashboardService";
import { getOrganizerTrips } from "../services/tripApiService";

export default function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [organizerTrips, setOrganizerTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("Wszystkie");
  const [expandedTrips, setExpandedTrips] = useState(false);

  const user = getCurrentUser();
  const userId = user?.id;

  const location = {
    city: "Warszawa",
    latitude: 52.2297,
    longitude: 21.0122,
  };

  useEffect(() => {
    async function loadHomeData() {
      if (!userId) {
        setApiError("Brak ID użytkownika. Zaloguj się ponownie.");
        setLoading(false);
        return;
      }

      try {
        setApiError("");

        const [dashboard, trips] = await Promise.all([
          getDashboardData(userId),
          getOrganizerTrips(userId),
        ]);

        console.log("Dashboard API:", dashboard);
        console.log("Organizer trips API:", trips);

        setDashboardData(dashboard);
        setOrganizerTrips(Array.isArray(trips) ? trips : []);
      } catch (error) {
        console.error("Błąd pobierania danych Home API:", error);
        setApiError(error.message || "Nie udało się pobrać danych użytkownika.");
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, [userId]);

  useEffect(() => {
    async function loadWeather() {
      try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );

        const data = await response.json();

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          max: Math.round(data.daily.temperature_2m_max[0]),
          min: Math.round(data.daily.temperature_2m_min[0]),
          code: data.current.weather_code,
        });
      } catch (error) {
        console.error("Błąd pobierania pogody:", error);
      } finally {
        setWeatherLoading(false);
      }
    }

    loadWeather();
  }, []);

  function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if ([1, 2, 3].includes(code)) return "⛅";
    if ([45, 48].includes(code)) return "🌫️";
    if ([51, 53, 55, 61, 63, 65].includes(code)) return "🌧️";
    if ([71, 73, 75].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈️";

    return "🌤️";
  }

  function getPersonAvatar(name = "") {
    if (name.includes("Piotr")) return "👨🏻";
    if (name.includes("Joanna")) return "👩🏻";
    if (name.includes("Jan")) return "👨🏻‍💼";
    if (name.includes("Marek")) return "👨🏼";
    return "👤";
  }

  function mapTripStatus(status = "") {
    if (status === "PLANNED") return "Planowane";
    if (status === "IN_PROGRESS") return "W trakcie";
    if (status === "COMPLETED") return "Zakończone";
    if (status === "ACTIVE") return "W trakcie";
    if (status === "FINISHED") return "Zakończone";
    if (status === "Planowana") return "Planowane";

    return status || "Planowane";
  }

  function getTripTitle(trip, country, city) {
    const name = trip.name || trip.tripName || trip.title || trip.nazwa || "";

    if (name && name !== country) {
      return name;
    }

    if (city && city !== country) {
      return city;
    }

    return name || country || "Podróż";
  }

  function mapTrip(trip) {
    const country =
        trip.country ||
        trip.destinationCountry ||
        trip.kraj ||
        "Brak kraju";

    const city =
        trip.city ||
        trip.destinationCity ||
        trip.miasto ||
        "";

    const participants = Array.isArray(trip.participants || trip.members)
        ? trip.participants || trip.members
        : [];

    const participantsCount =
        trip.participantsCount ||
        trip.membersCount ||
        participants.length ||
        (trip.organizer || trip.organizerId ? 1 : 0);

    return {
      id: trip.id || trip.tripId || trip.idPodrozy,
      name: getTripTitle(trip, country, city),
      country,
      city,
      locationLabel: city ? `${city}, ${country}` : country,
      status: mapTripStatus(trip.status),
      startDate: trip.startDate || trip.dateFrom || trip.dataRozpoczecia || "",
      endDate: trip.endDate || trip.dateTo || trip.dataZakonczenia || "",
      budget:
          trip.budget ||
          trip.plannedBudget ||
          trip.budzetPlanowany ||
          0,
      currency:
          trip.currency ||
          trip.baseCurrency ||
          trip.walutaBazowa ||
          "EUR",
      participants,
      participantsCount,
      organizer: trip.organizer || null,
      image:
          trip.image ||
          trip.imageUrl ||
          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
    };
  }

  function mapExpense(expense) {
    return {
      id: expense.id || expense.expenseId || expense.idWydatku,
      tripId: expense.tripId || expense.idPodrozy,
      category:
          expense.category ||
          expense.categoryName ||
          expense.kategoria ||
          "Wydatek",
      date: expense.date || expense.expenseDate || expense.dataWydatku || "",
      paidBy:
          expense.paidBy ||
          expense.payerName ||
          expense.placacy ||
          "Użytkownik",
      amount:
          expense.amount ||
          expense.originalAmount ||
          expense.kwotaOryginalna ||
          0,
      currency:
          expense.currency ||
          expense.originalCurrency ||
          expense.walutaOryginalna ||
          "EUR",
      amountInBaseCurrency:
          expense.amountInBaseCurrency ||
          expense.convertedAmount ||
          expense.amountInPln ||
          expense.kwotaPrzeliczona ||
          null,
      baseCurrency:
          expense.baseCurrency ||
          expense.walutaBazowa ||
          "PLN",
    };
  }

  const dashboardTrips = (dashboardData?.userTrips || dashboardData?.trips || dashboardData?.organizedTrips || []).map(mapTrip);
  const organizerMappedTrips = organizerTrips.map(mapTrip);

  const trips = Array.from(
      [...dashboardTrips, ...organizerMappedTrips]
          .reduce((result, trip) => {
            if (!trip.id) {
              return result;
            }

            const existingTrip = result.get(String(trip.id)) || {};

            result.set(String(trip.id), {
              ...existingTrip,
              ...trip,
              participants: trip.participants?.length
                  ? trip.participants
                  : existingTrip.participants || [],
              participantsCount: Math.max(
                  Number(existingTrip.participantsCount || 0),
                  Number(trip.participantsCount || 0)
              ),
            });

            return result;
          }, new Map())
          .values()
  );

  const recentExpenses = (dashboardData?.recentExpenses || []).map(mapExpense);

  const budgetStats = dashboardData?.budgetStats || {};

  const totalPlannedBudget =
      dashboardData?.totalPlannedBudget ||
      budgetStats.totalBudget ||
      budgetStats.totalPlannedBudget ||
      0;

  const totalSpent =
      budgetStats.totalSpentInBaseCurrency ||
      budgetStats.totalSpent ||
      budgetStats.spent ||
      0;

  const currency =
      budgetStats.currency ||
      budgetStats.baseCurrency ||
      trips[0]?.currency ||
      "EUR";

  const budgetUsage =
      totalPlannedBudget > 0
          ? Math.round((Number(totalSpent) / Number(totalPlannedBudget)) * 100)
          : 0;

  const tabs = ["Wszystkie", "W trakcie", "Planowane", "Zakończone"];

  const filteredTrips =
      activeTab === "Wszystkie"
          ? trips
          : trips.filter((trip) => trip.status === activeTab);

  const visibleTrips = expandedTrips ? filteredTrips : filteredTrips.slice(0, 1);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  const weatherUrl = `https://www.google.com/search?q=pogoda+${location.city}`;

  return (
      <Layout>
        <main className="content home-content">
          <PageTitle
              title={`Witaj, ${user?.name || "Użytkowniku"}!`}
              subtitle="Jaką planujemy dzisiaj podróż?"
          />

          {apiError && (
              <Card className="auth-error">
                {apiError}
              </Card>
          )}

          <section className="home-top-grid">
            <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="map-card-link"
            >
              <Card className="home-widget map-widget">
                <iframe
                    title="Google Maps"
                    src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=13&output=embed`}
                    className="google-map-frame"
                    loading="lazy"
                />
              </Card>
            </a>

            <a
                href={weatherUrl}
                target="_blank"
                rel="noreferrer"
                className="weather-card-link"
            >
              <Card className="home-widget weather-widget">
                {weatherLoading && <p>Ładowanie pogody...</p>}

                {!weatherLoading && weather && (
                    <>
                      <div className="weather-main">
                        <span>{getWeatherIcon(weather.code)}</span>

                        <div>
                          <strong>{weather.temperature}°</strong>
                          <p>Odczuwalnie {weather.feelsLike}°</p>
                        </div>
                      </div>

                      <div className="weather-location">
                        <span>➤</span>

                        <div>
                          <strong>{location.city}</strong>
                          <p>Częściowe zachmurzenie</p>
                        </div>
                      </div>

                      <div className="weather-range">
                        <span>H {weather.max}°</span>
                        <span>L {weather.min}°</span>
                      </div>
                    </>
                )}
              </Card>
            </a>
          </section>

          <section className="home-section">
            <Card className="home-trips-panel">
              <div className="section-header">
                <h3>Moje podróże</h3>

                <Link to="/new-trip" className="small-green-btn">
                  + Nowa podróż
                </Link>
              </div>

              <div className="trip-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={activeTab === tab ? "trip-tab active" : "trip-tab"}
                        onClick={() => {
                          setActiveTab(tab);
                          setExpandedTrips(false);
                        }}
                    >
                      {tab}
                    </button>
                ))}
              </div>

              {loading && <p>Ładowanie podróży...</p>}

              {!loading && visibleTrips.length === 0 && (
                  <p>Brak podróży w tej kategorii.</p>
              )}

              {!loading && visibleTrips.length > 0 && (
                  <div className="home-trip-list">
                    {visibleTrips.map((trip) => (
                        <Link
                            to={`/trip/${trip.id}`}
                            className={`home-trip-row ${
                                trip.status === "Zakończone" ? "finished" : ""
                            }`}
                            key={trip.id}
                        >
                          <img src={trip.image} alt={trip.name} />

                          <div className="home-trip-row-content">
                            <div className="home-trip-row-header">
                              <div>
                                <h4>{trip.name}</h4>
                                <p>{trip.locationLabel}</p>
                              </div>

                              <span className="trip-status-pill">{trip.status}</span>
                            </div>

                            <p>
                              📅 Termin: {trip.startDate} - {trip.endDate}
                            </p>
                            <p>👥 Ilość uczestników: {trip.participantsCount}</p>
                            <p>
                              💲 Budżet: {trip.budget} {trip.currency}
                            </p>
                          </div>
                        </Link>
                    ))}
                  </div>
              )}

              {filteredTrips.length > 1 && (
                  <button
                      className="expand-trips-btn"
                      onClick={() => setExpandedTrips((prev) => !prev)}
                  >
                    {expandedTrips ? "Zwiń ↑" : "Rozwiń ↓"}
                  </button>
              )}
            </Card>
          </section>

          <section className="home-section">
            <div className="section-header">
              <h3>Ostatnie wydatki</h3>

              <Link to="/trip/1/expenses" className="small-blue-btn">
                + Dodaj wydatek
              </Link>
            </div>

            <div className="home-expenses-grid">
              {recentExpenses.length === 0 && !loading && (
                  <p>Brak ostatnich wydatków.</p>
              )}

              {recentExpenses.map((expense) => (
                  <Card className="home-expense-card" key={expense.id}>
                    <div className="expense-mini-header">
                      <div className="avatar">{getPersonAvatar(expense.paidBy)}</div>

                      <div>
                        <strong>{expense.category}</strong>
                        <p>{expense.date}</p>
                      </div>
                    </div>

                    <p>Zapłacił: {expense.paidBy}</p>

                    <h2>
                      {expense.amount} {expense.currency}
                    </h2>

                    {expense.amountInBaseCurrency && (
                        <span>
                    ≈ {expense.amountInBaseCurrency} {expense.baseCurrency}
                  </span>
                    )}

                    <Link
                        to={`/trip/${expense.tripId}/expenses`}
                        className="expense-details-link"
                    >
                      Szczegóły ✎
                    </Link>
                  </Card>
              ))}
            </div>
          </section>

          <section className="home-section">
            <h3>Budżet podróży</h3>

            <Card className="user-trip-expenses-card">
              <div className="user-trip-expenses-list">
                <div className="user-trip-expense-total">
                  <strong>Łączny budżet</strong>

                  <div>
                    <strong>
                      {totalPlannedBudget} {currency}
                    </strong>
                  </div>
                </div>

                <div className="home-divider" />

                <div className="user-trip-expense-total">
                  <strong>Wydano</strong>

                  <div>
                    <strong>
                      {totalSpent} {currency}
                    </strong>
                  </div>
                </div>

                <div className="home-divider" />

                <div className="budget-section">
                  <div className="budget-bar">
                    <div
                        className="budget-progress"
                        style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                    />
                  </div>

                  <p>{budgetUsage}% wykorzystania budżetu</p>
                </div>
              </div>
            </Card>
          </section>

          <section className="home-section">
            <h3>Statystyki</h3>

            <Card className="spending-stats-card">
              <div className="stats-card-header">
                <div className="stats-icon">▮▮▮</div>

                <div>
                  <h4>Podsumowanie budżetu</h4>
                  <p></p>
                </div>

                <Link to="/trip/1/reports" className="stats-open-link">
                  ↗
                </Link>
              </div>

              <div className="stats-grid">
                <div className="stat-box">
                  <span>Liczba podróży</span>
                  <strong>{trips.length}</strong>
                </div>

                <div className="stat-box">
                  <span>Ostatnie wydatki</span>
                  <strong>{recentExpenses.length}</strong>
                </div>

                <div className="stat-box">
                  <span>Łączny budżet</span>
                  <strong>
                    {totalPlannedBudget} {currency}
                  </strong>
                </div>

                <div className="stat-box">
                  <span>Wydano</span>
                  <strong>
                    {totalSpent} {currency}
                  </strong>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </Layout>
  );
}