import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageTitle from "../components/ui/PageTitle";

import { createTrip } from "../services/tripApiService.js";

export default function NewTrip() {
    const navigate = useNavigate();

    const [tripName, setTripName] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [currency, setCurrency] = useState("");
    const [budget, setBudget] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [dateError, setDateError] = useState("");

    function validateDates(start, end) {
        if (!start || !end) return "";

        if (new Date(start) > new Date(end)) {
            return "Data rozpoczęcia nie może być późniejsza niż data zakończenia";
        }

        return "";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const error = validateDates(startDate, endDate);

        if (error) {
            setDateError(error);
            return;
        }

        try {
            const newTrip = await createTrip({
                name: tripName,
                country,
                city,
                currency,
                budget: Number(budget),
                startDate,
                endDate,
                date: `${startDate} — ${endDate}`,
            });

            alert(`Utworzono podróż: ${newTrip.name || newTrip.country}`);
            navigate("/home");
        } catch (error) {
            console.error("Błąd tworzenia podróży:", error);
            alert(error.message || "Nie udało się utworzyć podróży.");
        }
    }

    return (
        <Layout>
            <main className="content_trip">
                <Link to="/home" className="back-btn-trip">
                    ← Wróć
                </Link>

                <PageTitle
                    title="Utwórz nową podróż"
                    subtitle="Zaplanuj swoją wycieczkę co do grosza"
                />

                <Card>
                    <form className="trip-form" onSubmit={handleSubmit}>
                        <label>Nazwa podróży</label>
                        <input
                            value={tripName}
                            onChange={(e) => setTripName(e.target.value)}
                            placeholder="Weekend w Paryżu"
                            required
                        />

                        <label>Kraj</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                        >
                            <option value="">Wybierz kraj</option>
                            <option>Francja</option>
                            <option>Belgia</option>
                            <option>Włochy</option>
                            <option>Hiszpania</option>
                            <option>Niemcy</option>
                        </select>

                        <label>Miasto</label>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Paryż"
                            required
                        />

                        <label>Data rozpoczęcia</label>
                        <input
                            type="date"
                            className={dateError ? "input-error" : ""}
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setDateError(validateDates(e.target.value, endDate));
                            }}
                            required
                        />

                        <label>Data zakończenia</label>
                        <input
                            type="date"
                            className={dateError ? "input-error" : ""}
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setDateError(validateDates(startDate, e.target.value));
                            }}
                            required
                        />

                        {dateError && <p className="form-error">{dateError}</p>}

                        <label>Waluta bazowa</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            required
                        >
                            <option value="">Wybierz walutę</option>
                            <option>EUR</option>
                            <option>USD</option>
                            <option>PLN</option>
                            <option>GBP</option>
                        </select>

                        <label>Budżet</label>
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="1500"
                            required
                        />

                        <Button type="submit">Utwórz podróż</Button>
                    </form>
                </Card>
            </main>
        </Layout>
    );
}