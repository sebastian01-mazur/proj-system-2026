import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { getCurrentUser } from "../services/authService";
import { getFriends } from "../services/tripService";

export default function Profile() {
  const currentUser = getCurrentUser();

  const [name, setName] = useState(currentUser?.name || "Jan Kowalski");
  const [email, setEmail] = useState(currentUser?.email || "jan@test.pl");
  const [description, setDescription] = useState(
    currentUser?.description || "Lubię podróże, dobre jedzenie i spontaniczne wyjazdy."
  );
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");

  const [friends, setFriends] = useState([]);
  const [showAllFriends, setShowAllFriends] = useState(false);

  const visibleFriends = showAllFriends ? friends : friends.slice(0, 3);

  useEffect(() => {
    async function loadFriends() {
      const data = await getFriends();
      setFriends(data);
    }

    loadFriends();
  }, []);

  function handleAvatarChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setAvatar(imageUrl);
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

            <Card className="friends-card">
              <h3>Moi znajomi</h3>

              {friends.length === 0 ? (
                <p className="friends-empty">
                  Nie masz jeszcze żadnych znajomych.
                </p>
              ) : (
                <>
                  <ul className={`friends-list ${showAllFriends ? "friends-list-expanded" : ""}`}>
                    {visibleFriends.map((friend) => (
                      <li key={friend.id} className="friend-item">
                        <div className="friend-avatar">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name} />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>

                        <strong>{friend.name}</strong>
                      </li>
                    ))}
                  </ul>

                  {friends.length > 3 && (
                    <button
                      type="button"
                      className="friends-expand-btn"
                      onClick={() =>
                        setShowAllFriends((previousValue) => !previousValue)
                      }
                    >
                      {showAllFriends ? "Zwiń ↑" : "Rozwiń ↓"}
                    </button>
                  )}
                </>
              )}
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