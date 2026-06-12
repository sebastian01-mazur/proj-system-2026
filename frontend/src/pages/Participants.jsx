import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

import { getCurrentUser } from "../services/authService";
import { getTripById, removeTripMember } from "../services/tripApiService";

function getText(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return value.name || value.fullName || value.login || value.username || value.email || fallback;
  }

  return fallback;
}

function isGenericParticipantName(name) {
  return ["uczestnik", "participant", "member"].includes(
    String(name || "").trim().toLowerCase()
  );
}

function isGenericOrganizerName(name) {
  return ["organizator", "organizer", "owner", "właściciel", "wlasciciel"].includes(
    String(name || "").trim().toLowerCase()
  );
}

function cleanPersonName(name) {
  if (!name || isGenericParticipantName(name) || isGenericOrganizerName(name)) {
    return "";
  }

  return String(name).trim();
}

function getParticipantId(participant) {
  if (!participant) {
    return "";
  }

  if (typeof participant === "string" || typeof participant === "number") {
    return String(participant);
  }

  return getText(
    participant.userId ||
      participant.id ||
      participant.uuid ||
      participant.accountId ||
      participant.profileId ||
      participant.participantId ||
      participant.memberUserId ||
      participant.user?.userId ||
      participant.user?.id ||
      participant.user?.uuid ||
      participant.account?.userId ||
      participant.account?.id ||
      participant.profile?.userId ||
      participant.profile?.id,
    ""
  );
}

function getParticipantEmail(participant) {
  if (!participant || typeof participant !== "object") {
    return "";
  }

  return getText(
    participant.email ||
      participant.user?.email ||
      participant.account?.email ||
      participant.profile?.email,
    ""
  );
}

function getParticipantName(participant) {
  const currentUser = getCurrentUser();
  const participantId = getParticipantId(participant);

  if (currentUser?.id && participantId && String(currentUser.id) === String(participantId)) {
    return cleanPersonName(currentUser.name) || currentUser.email || `Użytkownik ${String(participantId).slice(0, 8)}`;
  }

  if (typeof participant === "string" || typeof participant === "number") {
    const value = String(participant);
    return value.includes("@") ? value : `Użytkownik ${value.slice(0, 8)}`;
  }

  const name =
    cleanPersonName(participant?.name) ||
    cleanPersonName(participant?.fullName) ||
    cleanPersonName(participant?.login) ||
    cleanPersonName(participant?.userName) ||
    cleanPersonName(participant?.username) ||
    cleanPersonName(participant?.displayName) ||
    cleanPersonName(participant?.user?.name) ||
    cleanPersonName(participant?.user?.fullName) ||
    cleanPersonName(participant?.user?.login) ||
    cleanPersonName(participant?.user?.userName) ||
    cleanPersonName(participant?.user?.username) ||
    cleanPersonName(participant?.account?.name) ||
    cleanPersonName(participant?.account?.login) ||
    cleanPersonName(participant?.profile?.name) ||
    cleanPersonName(participant?.profile?.login) ||
    getParticipantEmail(participant);

  return name || (participantId ? `Użytkownik ${String(participantId).slice(0, 8)}` : "");
}

function getParticipantAvatar(participant) {
  return (
    participant?.avatar ||
    participant?.avatarUrl ||
    participant?.photoUrl ||
    participant?.profilePicture ||
    participant?.user?.avatar ||
    participant?.user?.avatarUrl ||
    participant?.user?.photoUrl ||
    ""
  );
}

function sameParticipant(firstParticipant, secondParticipant) {
  const firstId = getParticipantId(firstParticipant);
  const secondId = getParticipantId(secondParticipant);

  if (firstId && secondId && String(firstId) === String(secondId)) {
    return true;
  }

  const firstEmail = getParticipantEmail(firstParticipant);
  const secondEmail = getParticipantEmail(secondParticipant);

  return Boolean(
    firstEmail &&
      secondEmail &&
      String(firstEmail).toLowerCase() === String(secondEmail).toLowerCase()
  );
}

function isOrganizer(participant) {
  return participant?.isOrganizer || participant?.role === "Organizator";
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
  const [removingParticipantId, setRemovingParticipantId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function loadTrip() {
    const data = await getTripById(id);
    setTrip(data);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadParticipants(showLoader = true) {
      try {
        if (showLoader) {
          setLoading(true);
        }
        await loadTrip();
      } catch (error) {
        if (!cancelled) {
          console.error("Błąd pobierania uczestników:", error);
          setTrip(null);
        }
      } finally {
        if (!cancelled && showLoader) {
          setLoading(false);
        }
      }
    }

    loadParticipants();

    const refreshOnFocus = () => loadParticipants(false);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [id]);

  async function handleRemoveParticipant(participant) {
    const participantId = getParticipantId(participant);
    const participantName = getParticipantName(participant) || "tego uczestnika";

    if (isOrganizer(participant)) {
      setActionMessage("Nie można usunąć organizatora wycieczki.");
      return;
    }

    const currentUser = getCurrentUser();
    const participantsList = trip?.participants || trip?.members || [];
    const currentUserIsOrganizer = participantsList.some(
      (item) => isOrganizer(item) && sameParticipant(item, currentUser)
    );

    const isRemovingSelf = sameParticipant(participant, currentUser);

    if (!currentUserIsOrganizer && !isRemovingSelf) {
      setActionMessage("Tylko organizator może usuwać innych uczestników.");
      return;
    }

    const confirmMessage = isRemovingSelf
      ? "Czy na pewno chcesz opuścić tę wycieczkę?"
      : `Usunąć uczestnika ${participantName} z wycieczki?`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    try {
      setRemovingParticipantId(participantId);
      setActionMessage("");
      await removeTripMember(id, participant);

      setTrip((currentTrip) => {
        if (!currentTrip) {
          return currentTrip;
        }

        const nextParticipants = (currentTrip.participants || currentTrip.members || []).filter(
          (item) => String(getParticipantId(item)) !== String(participantId)
        );

        return {
          ...currentTrip,
          participants: nextParticipants,
          members: nextParticipants,
          participantsCount: nextParticipants.length,
        };
      });

      setActionMessage(isRemovingSelf ? "Opuściłeś wycieczkę." : "Uczestnik został usunięty z wycieczki.");

      try {
        await loadTrip();
      } catch (reloadError) {
        console.warn("Nie udało się odświeżyć listy uczestników po usunięciu:", reloadError);
      }
    } catch (error) {
      console.error("Błąd usuwania uczestnika:", error);
      setActionMessage(error.message || "Nie udało się usunąć uczestnika.");
    } finally {
      setRemovingParticipantId("");
    }
  }

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

  const participants = (trip.participants || trip.members || []).filter((participant) =>
    getParticipantName(participant)
  );
  const currentUser = getCurrentUser();
  const currentUserIsOrganizer = participants.some(
    (participant) => isOrganizer(participant) && sameParticipant(participant, currentUser)
  );

  return (
    <Layout>
      <main className="content">
        <Link to={`/trip/${trip.id}`} className="back-btn">
          ← Wróć
        </Link>

        <PageTitle title="Uczestnicy" subtitle={`Podróż: ${trip.name}`} />

        {actionMessage && <p className="action-message">{actionMessage}</p>}

        <div className="participants-page-grid">
          {participants.map((participant, index) => {
            const participantId = getParticipantId(participant) || `${getParticipantName(participant)}-${index}`;
            const removing = removingParticipantId === participantId;
            const organizer = isOrganizer(participant);

            return (
              <Card className="participant-full-card" key={participantId}>
                <ParticipantAvatar participant={participant} />

                <div className="participant-main-info">
                  <strong>{getParticipantName(participant)}</strong>
                  <p>{participant.role || "Uczestnik"}</p>
                </div>

                {((currentUserIsOrganizer && !organizer && !sameParticipant(participant, currentUser)) ||
                  (!currentUserIsOrganizer && sameParticipant(participant, currentUser) && !organizer)) && (
                  <button
                    type="button"
                    className="remove-participant-btn"
                    onClick={() => handleRemoveParticipant(participant)}
                    disabled={removing}
                  >
                    {removing ? "Usuwanie..." : sameParticipant(participant, currentUser) ? "Opuść" : "Usuń"}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </Layout>
  );
}
