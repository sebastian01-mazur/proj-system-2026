import { apiRequest } from "./apiConfig";
import { getCurrentUser } from "./authService";
import { getTripById } from "./tripApiService";

function getCurrentUserId() {
  const userId = getCurrentUser()?.id;

  if (!userId) {
    throw new Error("Brak ID zalogowanego użytkownika. Zaloguj się ponownie.");
  }

  return userId;
}

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
  );
}

function getText(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.fullName ||
      value.displayName ||
      value.username ||
      value.email ||
      value.code ||
      value.label ||
      fallback
    );
  }

  return fallback;
}

function getId(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.id ||
      value.uuid ||
      value.userId ||
      value.tripId ||
      value.invitationId ||
      value.inviteeId ||
      value.inviterId ||
      value.user?.id ||
      value.user?.userId ||
      fallback
    );
  }

  return fallback;
}

function formatDateRange(trip) {
  const startDate = getText(trip?.startDate || trip?.dateFrom, "");
  const endDate = getText(trip?.endDate || trip?.dateTo, "");

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  return startDate || endDate || "Brak terminu";
}

function normalizeStatus(status) {
  const statuses = {
    AWAITING: "oczekujące",
    PENDING: "oczekujące",
    ACCEPTED: "zaakceptowane",
    DECLINED: "odrzucone",
    REJECTED: "odrzucone",
  };

  return statuses[status] || status || "oczekujące";
}

async function normalizeInvitation(invitation) {
  const tripId = getId(firstValue(invitation.tripId, invitation.trip, invitation.idPodrozy));
  let trip = null;

  if (tripId) {
    try {
      trip = await getTripById(tripId);
    } catch (error) {
      console.warn("Nie udało się pobrać danych podróży dla zaproszenia:", error);
    }
  }

  return {
    ...invitation,
    id: getId(firstValue(invitation.id, invitation.invitationId, invitation.idZaproszenia)),
    type: "trip",
    tripId,
    inviteeId: getId(firstValue(invitation.inviteeId, invitation.invitee, invitation.idZapraszanego)),
    inviterId: getId(firstValue(invitation.inviterId, invitation.inviter, invitation.idZapraszajacego)),
    status: normalizeStatus(invitation.status),
    user: getText(invitation.inviterName || invitation.inviter || invitation.createdBy, "Użytkownik"),
    trip: getText(trip?.name || trip?.tripName || invitation.tripName, "Podróż"),
    country: getText(trip?.country || invitation.country, "Brak kraju"),
    date: formatDateRange(trip),
    sentAt: getText(invitation.sentAt || invitation.dataWyslania, ""),
    respondedAt: getText(invitation.respondedAt || invitation.dataOdpowiedzi, ""),
  };
}

export async function getInvitations() {
  const currentUserId = getCurrentUserId();

  const invitations = await apiRequest(`/trips/invitations/pending/${currentUserId}`, {
    method: "GET",
  });

  if (!Array.isArray(invitations)) {
    return [];
  }

  return Promise.all(invitations.map((invitation) => normalizeInvitation(invitation)));
}

export async function sendTripInvitation({ tripId, inviteeId }) {
  const inviterId = getCurrentUserId();

  if (!tripId) {
    throw new Error("Brak ID podróży.");
  }

  if (!inviteeId) {
    throw new Error("Brak ID zapraszanego użytkownika.");
  }

  return apiRequest(`/trips/${tripId}/invitations`, {
    method: "POST",
    body: JSON.stringify({
      inviterId,
      inviteeId,
    }),
  });
}

export async function acceptInvitation(invitationId) {
  if (!invitationId) {
    throw new Error("Brak ID zaproszenia.");
  }

  return apiRequest(`/trips/invitations/${invitationId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({
      accept: true,
    }),
  });
}

export async function rejectInvitation(invitationId) {
  if (!invitationId) {
    throw new Error("Brak ID zaproszenia.");
  }

  return apiRequest(`/trips/invitations/${invitationId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({
      accept: false,
    }),
  });
}