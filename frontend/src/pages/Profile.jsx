import { useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { getCurrentUser } from "../services/authService";

export default function Profile() {
  const currentUser = getCurrentUser();

  const [name, setName] = useState(currentUser?.name || "Jan Kowalski");
  const [email, setEmail] = useState(currentUser?.email || "jan@test.pl");
  const [description, setDescription] = useState(
    currentUser?.description ||
      "Lubię podróże, dobre jedzenie i spontaniczne wyjazdy."
  );
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [copied, setCopied] = useState(false);

  const inviteCode = currentUser?.id || "";

  function handleAvatarChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setAvatar(reader.result || "");
    };

    reader.readAsDataURL(file);
  }

  async function handleCopyInviteCode() {
    if (!inviteCode) {
      alert("Brak kodu zaproszenia. Zaloguj się ponownie.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("Nie udało się skopiować kodu. Skopiuj go ręcznie.");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const updatedUser = {
      ...currentUser,
      name,
      email,
      description,
      avatar,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    alert("Profil zapisany.");
  }

  return (
    <Layout>
      <main className="content">
        <Link to="/home" className="back-btn">
          ← Wróć
        </Link>

        <PageTitle
          title="Mój profil"
          subtitle="Zarządzaj swoimi danymi w aplikacji"
        />

        <section className="profile-layout">
          <div className="profile-left-column">
            <Card className="profile-preview-card">
              <div className="profile-avatar">
                {avatar ? <img src={avatar} alt="Avatar użytkownika" /> : "👤"}
              </div>

              <h2>{name}</h2>
              <p>{email}</p>

              <div className="profile-description">{description}</div>
            </Card>

            <Card className="invite-code-card">
              <h3>Kod zaproszenia</h3>

              <p>
                Podaj ten kod znajomemu, aby mógł zaprosić Cię do wspólnej
                podróży.
              </p>

              <div className="invite-code-box">
                <code>{inviteCode || "Brak kodu zaproszenia"}</code>

                <button type="button" onClick={handleCopyInviteCode}>
                  {copied ? "Skopiowano" : "Kopiuj"}
                </button>
              </div>
            </Card>
          </div>

          <Card className="profile-edit-card">
            <h3>Edytuj profil</h3>

            <form className="trip-form" onSubmit={handleSubmit}>
              <label>Zdjęcie profilowe</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />

              <label>Imię i nazwisko</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label>Opis</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows="5"
              />

              <Button type="submit">Zapisz profil</Button>
            </form>
          </Card>
        </section>
      </main>
    </Layout>
  );
}