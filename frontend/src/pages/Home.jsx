import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

import { getTrips, getAllExpenses } from "../services/tripService";
import { getCurrentUser } from "../services/authService";

export default function Home() {
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("Wszystkie");
  const [expandedTrips, setExpandedTrips] = useState(false);
  const [expandedUserExpenses, setExpandedUserExpenses] = useState(false);

  const user = getCurrentUser();
  const currentUserName = user?.name || "Jan Kowalski";

  const exchangeRates = {
    EUR: 4.32,
    USD: 3.98,
    GBP: 5.07,
    CHF: 4.55,
    PLN: 1,
  };

  const location = {
    city: "Warszawa",
    latitude: 52.2297,
    longitude: 21.0122,
  };

  useEffect(() => {
    async function loadData() {
      const tripsData = await getTrips();
      const expensesData = await getAllExpenses();

      setTrips(tripsData);
      setExpenses(expensesData);
      setLoading(false);
    }

    loadData();
  }, []);

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

  function convertToPln(amount, currency) {
    return Math.round(Number(amount || 0) * (exchangeRates[currency] || 1));
  }

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
    const originalAmount = getExpenseOriginalAmount(expense);
    const originalCurrency = getExpenseOriginalCurrency(expense);

    return Number(
      expense.convertedAmount ?? convertToPln(originalAmount, originalCurrency) ?? 0
    );
  }

  function getExpenseBaseCurrency(expense) {
    return expense.baseCurrency || "PLN";
  }

  const tabs = ["Wszystkie", "W trakcie", "Planowane", "Zakończone"];

  const filteredTrips =
    activeTab === "Wszystkie"
      ? trips
      : trips.filter((trip) =>
          activeTab === "Planowane"
            ? trip.status === "Planowana"
            : trip.status === activeTab
        );

  const visibleTrips = expandedTrips ? filteredTrips : filteredTrips.slice(0, 1);
  const latestExpenses = [...expenses].slice(-2).reverse();
  const firstTripId = trips[0]?.id || 1;

  const completedTrips = trips.filter((trip) => trip.status === "Zakończone");

  const userTripExpenses = completedTrips
    .map((trip) => {
      const tripUserExpenses = expenses.filter(
        (expense) =>
          Number(expense.tripId) === Number(trip.id) &&
          expense.paidBy === currentUserName
      );

      const amount = tripUserExpenses.reduce(
        (sum, expense) => sum + getExpenseConvertedAmount(expense),
        0
      );

      const pln = tripUserExpenses.reduce(
        (sum, expense) =>
          sum +
          convertToPln(
            getExpenseOriginalAmount(expense),
            getExpenseOriginalCurrency(expense)
          ),
        0
      );

      return {
        id: trip.id,
        tripName: trip.name,
        date: `${trip.startDate} - ${trip.endDate}`,
        amount,
        currency: trip.currency,
        pln,
        image: trip.image,
      };
    })
    .filter((item) => item.amount > 0);

  const visibleUserExpenses = expandedUserExpenses
    ? userTripExpenses
    : userTripExpenses.slice(0, 3);

  const hiddenUserExpensesCount =
    userTripExpenses.length - visibleUserExpenses.length;

  const totalUserExpenses = userTripExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalUserExpensesPln = userTripExpenses.reduce(
    (sum, item) => sum + Number(item.pln || 0),
    0
  );

  const spendingStats = Object.values(
    expenses.reduce((acc, expense) => {
      if (!acc[expense.paidBy]) {
        acc[expense.paidBy] = {
          id: expense.paidBy,
          name: expense.paidBy,
          amount: 0,
          pln: 0,
        };
      }

      acc[expense.paidBy].amount += getExpenseConvertedAmount(expense);
      acc[expense.paidBy].pln += convertToPln(
        getExpenseOriginalAmount(expense),
        getExpenseOriginalCurrency(expense)
      );

      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount);

  const maxSpent = Math.max(
    ...spendingStats.map((person) => Number(person.amount || 0)),
    1
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  const weatherUrl = `https://www.google.com/search?q=pogoda+${location.city}`;

  return (
    <Layout>
      <main className="content home-content">
        <PageTitle
          title={`Witaj, ${user?.name || "Użytkowniku"}!`}
          subtitle="Jaką planujemy dzisiaj podróż?"
        />

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
                          <p>🇫🇷 {trip.country}</p>
                        </div>

                        <span className="trip-status-pill">{trip.status}</span>
                      </div>

                      <p>📅 Termin: {trip.startDate} - {trip.endDate}</p>
                      <p>👥 Ilość uczestników: {trip.participants.length}</p>
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
            <h3>Najnowsze wydatki</h3>

            <Link to={`/trip/${firstTripId}/expenses`} className="small-blue-btn">
              + Dodaj wydatek
            </Link>
          </div>

          <div className="home-expenses-grid">
            {latestExpenses.length === 0 && (
              <Card className="home-expense-card">
                <p>Brak wydatków do wyświetlenia.</p>
              </Card>
            )}

            {latestExpenses.map((expense) => (
              <Card className="home-expense-card" key={expense.id}>
                <div className="expense-mini-header">
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
          <h3>Twoje wydatki w zakończonych podróżach</h3>

          <Card className="user-trip-expenses-card">
            <div className="user-trip-expenses-list">
              {visibleUserExpenses.length === 0 && (
                <p>Nie masz jeszcze wydatków w zakończonych podróżach.</p>
              )}

              {visibleUserExpenses.map((item) => (
                <div className="user-trip-expense-row" key={item.id}>
                  <img src={item.image} alt={item.tripName} />

                  <div className="user-trip-expense-info">
                    <strong>{item.tripName}</strong>
                    <span>{item.date}</span>
                  </div>

                  <div className="user-trip-expense-amount">
                    <strong>
                      {formatMoney(item.amount)} {item.currency}
                    </strong>
                    <span>≈ {formatMoney(item.pln)} PLN</span>
                  </div>
                </div>
              ))}

              {hiddenUserExpensesCount > 0 && !expandedUserExpenses && (
                <div className="hidden-count-row">
                  +{hiddenUserExpensesCount}
                  <span>...</span>
                </div>
              )}

              <div className="home-divider" />

              <div className="user-trip-expense-total">
                <strong>Łącznie</strong>

                <div>
                  <strong>{formatMoney(totalUserExpenses)} EUR</strong>
                  <span>≈ {formatMoney(totalUserExpensesPln)} PLN</span>
                </div>
              </div>

              <div className="home-divider" />

              {userTripExpenses.length > 3 && (
                <button
                  className="expand-trips-btn"
                  onClick={() => setExpandedUserExpenses((prev) => !prev)}
                >
                  {expandedUserExpenses ? "Zwiń ↑" : "Rozwiń ↓"}
                </button>
              )}
            </div>
          </Card>
        </section>

        <section className="home-section">
          <h3>Statystyki</h3>

          <Card className="spending-stats-card">
            <div className="stats-card-header">
              <div className="stats-icon">▮▮▮</div>

              <div>
                <h4>Najwięcej wydali</h4>
                <p>Łącznie ze wszystkich wspólnych podróży</p>
              </div>

              <Link to={`/trip/${firstTripId}/reports`} className="stats-open-link">
                ↗
              </Link>
            </div>

            <div className="spending-ranking">
              {spendingStats.length === 0 && <p>Brak danych wydatków.</p>}

              {spendingStats.map((person, index) => (
                <div
                  className={`spending-ranking-row ${
                    index === 0 ? "top-person" : ""
                  }`}
                  key={person.id}
                >
                  <div className="ranking-user">
                    <div className="ranking-photo">
                      {getPersonAvatar(person.name)}
                    </div>

                    <div className="ranking-position">
                      {index === 0 ? "#1" : index + 1}
                    </div>

                    <div>
                      <strong>{person.name}</strong>
                      {index === 0 && <p>👑 Najwięcej wydał</p>}
                    </div>
                  </div>

                  <div className="ranking-amount">
                    <strong>{formatMoney(person.amount)} €</strong>

                    {index !== 0 && (
                      <div className="ranking-progress">
                        <div
                          style={{
                            width: `${Math.round(
                              (person.amount / maxSpent) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </Layout>
  );
}
