import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageTitle from "../components/ui/PageTitle";

import { createTrip } from "../services/tripService";

export default function NewTrip() {
    const navigate = useNavigate();

    const [tripName, setTripName] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [currency, setCurrency] = useState("");
    const [budget, setBudget] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        setImageFile(file);

        // preview (działa lokalnie)
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const newTrip = await createTrip({
            name: tripName,
            country,
            city,
            currency,
            budget: Number(budget),
            startDate,
            endDate,
            date: `${startDate} — ${endDate}`,
            image:
                imagePreview ||
                "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
        });

        alert(`Utworzono podróż: ${newTrip.name}`);
        navigate("/home");
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
                            placeholder="np. Weekend w Paryżu"
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
                            placeholder="np. Paryż"
                            required
                        />

                        <label>Data rozpoczęcia</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />

                        <label>Data zakończenia</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />

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
                            placeholder="np. 1500"
                            required
                        />

                        <label>Zdjęcie podróży</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Podgląd"
                                style={{
                                    marginTop: "10px",
                                    width: "100%",
                                    borderRadius: "12px",
                                }}
                            />
                        )}

                        <Button type="submit">Utwórz podróż</Button>
                    </form>
                </Card>
            </main>
        </Layout>
    );
}