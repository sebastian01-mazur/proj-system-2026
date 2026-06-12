import { apiRequest } from "./apiConfig";
import { getCurrentUser } from "./authService";
import {
  cacheAcceptedTripMembership,
  clearTripInvitationForUser,
  getTripById,
  isInvitationAlreadyExistsError,
  reopenTripInvitationForUser,
} from "./tripApiService";

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
      trip = await getTripById(tripId, { includeCurrentUserParticipant: false });
    } catch (error) {
      console.warn("Nie udało się pobrać danych podróży dla zaproszenia:", error);
    }
  }

  const inviter = firstValue(invitation.inviter, invitation.createdBy, invitation.organizer, null);
  const inviterName = getText(
    invitation.inviterName ||
      invitation.inviterEmail ||
      invitation.createdByName ||
      invitation.createdByEmail ||
      inviter,
    "Użytkownik"
  );
  const inviterEmail = getText(
    invitation.inviterEmail ||
      invitation.createdByEmail ||
      invitation.organizerEmail ||
      (typeof inviter === "object" ? inviter.email : ""),
    ""
  );

  return {
    ...invitation,
    raw: invitation,
    id: getId(firstValue(invitation.id, invitation.invitationId, invitation.idZaproszenia)),
    type: "trip",
    tripId,
    tripData: trip,
    inviteeId: getId(firstValue(invitation.inviteeId, invitation.invitee, invitation.idZapraszanego)),
    inviterId: getId(firstValue(invitation.inviterId, invitation.inviter, invitation.idZapraszajacego)),
    organizerId: getId(firstValue(invitation.organizerId, invitation.inviterId, invitation.createdById, invitation.inviter, invitation.createdBy)),
    organizer: firstValue(invitation.organizer, invitation.inviter, invitation.createdBy, null),
    organizerName: inviterName,
    organizerEmail: inviterEmail,
    inviter,
    inviterName,
    inviterEmail,
    avatar: getText(
      invitation.avatar ||
        invitation.inviterAvatar ||
        invitation.createdByAvatar ||
        (typeof inviter === "object" ? inviter.avatar || inviter.avatarUrl || inviter.photoUrl : ""),
      ""
    ),
    status: normalizeStatus(invitation.status),
    user: inviterName,
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

  const encodedTripId = encodeURIComponent(tripId);
  const requestBody = JSON.stringify({
    inviterId,
    inviteeId,
  });

  try {
    return await apiRequest(`/trips/${encodedTripId}/invitations`, {
      method: "POST",
      body: requestBody,
    });
  } catch (error) {
    if (!isInvitationAlreadyExistsError(error)) {
      throw error;
    }

    // Backend trzyma stare zaproszenie po statusie ACCEPTED/po usunięciu uczestnika.
    // Najpierw próbujemy je ponownie otworzyć, a jeśli backend nie ma takiego endpointu,
    // czyścimy stare zaproszenie i tworzymy nowe.
    try {
      return await reopenTripInvitationForUser(tripId, inviteeId, inviterId);
    } catch (reopenError) {
      console.warn("Nie udało się wznowić istniejącego zaproszenia:", reopenError);
    }

    try {
      await clearTripInvitationForUser(tripId, inviteeId, inviterId);

      return await apiRequest(`/trips/${encodedTripId}/invitations`, {
        method: "POST",
        body: requestBody,
      });
    } catch (retryError) {
      throw new Error(
        " PENDING/CANCELLED. " +
          `Ostatni błąd: ${retryError?.message || error.message}`
      );
    }
  }
}

export async function acceptInvitation(invitationOrId) {
  const invitationId = getId(invitationOrId?.id || invitationOrId?.invitationId || invitationOrId);

  if (!invitationId) {
    throw new Error("Brak ID zaproszenia.");
  }

  const currentUser = getCurrentUser();
  const tripId = getId(firstValue(
    invitationOrId?.tripId,
    invitationOrId?.idPodrozy,
    invitationOrId?.tripData?.id,
    invitationOrId?.tripData?.tripId,
    invitationOrId?.raw?.tripId,
    invitationOrId?.raw?.idPodrozy
  ));
  const inviteeId = getId(firstValue(
    invitationOrId?.inviteeId,
    invitationOrId?.idZapraszanego,
    invitationOrId?.raw?.inviteeId,
    invitationOrId?.raw?.idZapraszanego,
    currentUser?.id
  ));

  const response = await apiRequest(`/trips/invitations/${invitationId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({
      accept: true,
      tripId,
      userId: currentUser?.id || inviteeId,
      inviteeId: inviteeId || currentUser?.id,
      participantId: currentUser?.id || inviteeId,
    }),
  });

  if (typeof invitationOrId === "object") {
    await cacheAcceptedTripMembership(invitationOrId, response);
  }

  return response;
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