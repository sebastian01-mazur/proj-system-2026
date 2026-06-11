import { apiRequest } from "./apiConfig";
import { getCurrentUser } from "./authService";

const TRIP_METADATA_KEY = "splittrip_trip_metadata";

function getOrganizerId(explicitOrganizerId) {
  const organizerId = explicitOrganizerId || getCurrentUser()?.id;

  if (!organizerId) {
    throw new Error("Brak ID zalogowanego użytkownika. Zaloguj się ponownie.");
  }

  return organizerId;
}

function normalizeStatus(status = "PLANNED") {
  const statuses = {
    PLANNED: "Planowane",
    IN_PROGRESS: "W trakcie",
    COMPLETED: "Zakończone",
    ACTIVE: "W trakcie",
    FINISHED: "Zakończone",
    Planowana: "Planowane",
    Planowane: "Planowane",
    "W trakcie": "W trakcie",
    Zakończone: "Zakończone",
  };

  return statuses[status] || status || "Planowane";
}

function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== ""
  );
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null)
  );
}

function readTripMetadata() {
  try {
    return JSON.parse(localStorage.getItem(TRIP_METADATA_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveTripMetadata(trip) {
  const tripId = firstValue(trip.id, trip.tripId, trip.idPodrozy);

  if (!tripId) {
    return;
  }

  const metadata = readTripMetadata();

  metadata[String(tripId)] = compactObject({
    id: tripId,
    name: firstValue(trip.name, trip.tripName, trip.title),
    tripName: firstValue(trip.tripName, trip.name, trip.title),
    country: firstValue(trip.country, trip.destinationCountry, trip.kraj),
    city: firstValue(trip.city, trip.destinationCity, trip.miasto),
    startDate: firstValue(trip.startDate, trip.dateFrom, trip.dataRozpoczecia),
    endDate: firstValue(trip.endDate, trip.dateTo, trip.dataZakonczenia),
    budget: firstValue(trip.budget, trip.plannedBudget, trip.budzetPlanowany),
    plannedBudget: firstValue(trip.plannedBudget, trip.budget, trip.budzetPlanowany),
    currency: firstValue(trip.currency, trip.baseCurrency, trip.walutaBazowa),
    baseCurrency: firstValue(trip.baseCurrency, trip.currency, trip.walutaBazowa),
    organizerId: trip.organizerId,
    organizer: trip.organizer,
  });

  localStorage.setItem(TRIP_METADATA_KEY, JSON.stringify(metadata));
}

function getCachedTripMetadata(trip) {
  const tripId = firstValue(trip?.id, trip?.tripId, trip?.idPodrozy);

  if (!tripId) {
    return null;
  }

  return readTripMetadata()[String(tripId)] || null;
}

function getMemberSource(member) {
  if (!member || typeof member !== "object") {
    return member;
  }

  return member.user || member.account || member.profile || member.member || member;
}

function getMemberId(member) {
  if (typeof member === "string") {
    return member;
  }

  const source = getMemberSource(member);

  return firstValue(
    member?.userId,
    member?.memberId,
    member?.accountId,
    member?.id,
    source?.userId,
    source?.id,
    source?.uuid,
    source?.accountId,
    source?.email
  );
}

function getMemberName(member, fallbackName = "Uczestnik") {
  if (typeof member === "string") {
    return member;
  }

  const source = getMemberSource(member);

  return firstValue(
    member?.name,
    member?.fullName,
    member?.userName,
    member?.username,
    member?.displayName,
    member?.email,
    source?.name,
    source?.fullName,
    source?.userName,
    source?.username,
    source?.displayName,
    source?.email,
    fallbackName
  );
}

function getMemberEmail(member) {
  if (typeof member === "string") {
    return "";
  }

  const source = getMemberSource(member);

  return firstValue(member?.email, source?.email, "");
}

function getMemberAvatar(member) {
  if (typeof member === "string") {
    return "";
  }

  const source = getMemberSource(member);

  return firstValue(
    member?.avatar,
    member?.avatarUrl,
    member?.photoUrl,
    member?.profilePicture,
    member?.imageUrl,
    source?.avatar,
    source?.avatarUrl,
    source?.photoUrl,
    source?.profilePicture,
    source?.imageUrl,
    ""
  );
}

function normalizeMember(member, fallbackRole = "Uczestnik") {
  const role = firstValue(member?.role, member?.memberRole, fallbackRole);

  return {
    id: getMemberId(member),
    userId: getMemberId(member),
    name: getMemberName(member),
    email: getMemberEmail(member),
    avatar: getMemberAvatar(member),
    role,
    isOrganizer: role === "Organizator" || role === "ORGANIZER",
  };
}

function sameParticipant(firstParticipant, secondParticipant) {
  const firstId = firstParticipant?.userId || firstParticipant?.id;
  const secondId = secondParticipant?.userId || secondParticipant?.id;

  if (firstId && secondId && String(firstId) === String(secondId)) {
    return true;
  }

  if (
    firstParticipant?.email &&
    secondParticipant?.email &&
    firstParticipant.email === secondParticipant.email
  ) {
    return true;
  }

  return (
    firstParticipant?.name &&
    secondParticipant?.name &&
    firstParticipant.name === secondParticipant.name
  );
}

function normalizeOrganizer(trip, currentUser = getCurrentUser()) {
  const organizerSource = trip?.organizer || trip?.createdBy || trip?.owner || {};
  const organizerId = firstValue(
    trip?.organizerId,
    trip?.createdById,
    trip?.ownerId,
    organizerSource?.userId,
    organizerSource?.id,
    currentUser?.id
  );

  const isCurrentUserOrganizer =
    organizerId && currentUser?.id && String(organizerId) === String(currentUser.id);

  return {
    id: organizerId,
    userId: organizerId,
    name: firstValue(
      trip?.organizerName,
      trip?.createdByName,
      trip?.ownerName,
      organizerSource?.name,
      organizerSource?.fullName,
      organizerSource?.email,
      isCurrentUserOrganizer ? currentUser?.name : null,
      !organizerId ? currentUser?.name : null,
      "Organizator"
    ),
    email: firstValue(
      organizerSource?.email,
      isCurrentUserOrganizer ? currentUser?.email : null,
      ""
    ),
    avatar: firstValue(
      organizerSource?.avatar,
      organizerSource?.avatarUrl,
      organizerSource?.photoUrl,
      organizerSource?.profilePicture,
      isCurrentUserOrganizer ? currentUser?.avatar : null,
      ""
    ),
    role: "Organizator",
    isOrganizer: true,
  };
}

function mergeParticipants(organizer, participants = []) {
  const normalizedOrganizer = {
    ...organizer,
    role: "Organizator",
    isOrganizer: true,
  };

  const result = [normalizedOrganizer];

  participants.map((participant) => normalizeMember(participant)).forEach((participant) => {
    if (sameParticipant(participant, normalizedOrganizer)) {
      result[0] = {
        ...participant,
        ...normalizedOrganizer,
        avatar: normalizedOrganizer.avatar || participant.avatar || "",
      };
      return;
    }

    const alreadyAdded = result.some((existingParticipant) =>
      sameParticipant(existingParticipant, participant)
    );

    if (!alreadyAdded) {
      result.push({
        ...participant,
        role: participant.isOrganizer ? "Organizator" : "Uczestnik",
      });
    }
  });

  return result;
}

function getTripName(trip) {
  const country = firstValue(trip.country, trip.destinationCountry, trip.kraj, "");
  const city = firstValue(trip.city, trip.destinationCity, trip.miasto, "");
  const name = firstValue(trip.name, trip.tripName, trip.title, trip.nazwa, "");

  if (name && name !== country) {
    return name;
  }

  if (city && city !== country) {
    return city;
  }

  return name || country || "Podróż";
}

function normalizeTrip(trip, members = []) {
  if (!trip) {
    return null;
  }

  const cachedMetadata = getCachedTripMetadata(trip) || {};
  const source = {
    ...trip,
    ...cachedMetadata,
    id: firstValue(trip.id, trip.tripId, trip.idPodrozy, cachedMetadata.id),
    tripId: firstValue(trip.tripId, trip.id, trip.idPodrozy, cachedMetadata.id),
    organizer: cachedMetadata.organizer || trip.organizer,
    organizerId: firstValue(trip.organizerId, cachedMetadata.organizerId),
  };

  const apiMembers = Array.isArray(members) ? members : [];
  const tripParticipants =
    apiMembers.length > 0
      ? apiMembers
      : source.participants || source.members || source.tripMembers || [];

  const organizer = normalizeOrganizer(source);
  const participants = mergeParticipants(organizer, tripParticipants);
  const country = firstValue(source.country, source.destinationCountry, source.kraj, "Brak kraju");
  const city = firstValue(source.city, source.destinationCity, source.miasto, "");
  const budget = Number(firstValue(source.budget, source.plannedBudget, source.budzetPlanowany, 0));
  const currency = firstValue(source.currency, source.baseCurrency, source.walutaBazowa, "EUR");

  return {
    ...source,
    id: source.id,
    tripId: source.tripId,
    name: getTripName(source),
    tripName: getTripName(source),
    country,
    city,
    status: normalizeStatus(source.status),
    startDate: firstValue(source.startDate, source.dateFrom, source.dataRozpoczecia, ""),
    endDate: firstValue(source.endDate, source.dateTo, source.dataZakonczenia, ""),
    budget,
    plannedBudget: Number(firstValue(source.plannedBudget, source.budget, source.budzetPlanowany, 0)),
    currency,
    baseCurrency: firstValue(source.baseCurrency, source.currency, source.walutaBazowa, "EUR"),
    organizer,
    organizerId: organizer.userId || organizer.id,
    organizerName: organizer.name,
    participants,
    members: participants,
    participantsCount: participants.length,
    image:
      source.image ||
      source.imageUrl ||
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
  };
}

function normalizeExpense(expense) {
  const originalAmount = Number(expense.originalAmount ?? expense.amount ?? 0);
  const convertedAmount = Number(
    expense.convertedAmount ?? expense.amountInBaseCurrency ?? expense.amount ?? 0
  );

  return {
    ...expense,
    id: expense.id || expense.expenseId,
    tripId: expense.tripId,
    name: expense.name || expense.title || expense.category || "Wydatek",
    category: expense.category || "Inne",
    date: expense.date || expense.expenseDate || "",
    expenseDate: expense.expenseDate || expense.date || "",
    paidBy: expense.paidBy || expense.payerName || "Użytkownik",
    amount: originalAmount,
    originalAmount,
    currency: expense.currency || expense.originalCurrency || "EUR",
    originalCurrency: expense.originalCurrency || expense.currency || "EUR",
    convertedAmount,
    baseCurrency: expense.baseCurrency || expense.currency || "EUR",
    split: expense.split || [],
  };
}

export async function createTrip(tripData) {
  const currentUser = getCurrentUser();
  const organizerId = getOrganizerId(tripData.organizerId);
  const localTripData = {
    ...tripData,
    organizerId,
    organizer: {
      id: organizerId,
      userId: organizerId,
      name: currentUser?.name || "Organizator",
      email: currentUser?.email || "",
      avatar: currentUser?.avatar || "",
      role: "Organizator",
      isOrganizer: true,
    },
  };

  const createdTrip = await apiRequest("/trips", {
    method: "POST",
    body: JSON.stringify({
      organizerId,
      country: tripData.country,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      baseCurrency: tripData.currency || tripData.baseCurrency,
      plannedBudget: Number(tripData.budget ?? tripData.plannedBudget ?? 0),
    }),
  });

  const mergedTrip = {
    ...localTripData,
    ...(createdTrip || {}),
    id: firstValue(createdTrip?.id, createdTrip?.tripId, createdTrip?.idPodrozy, tripData.id),
    tripId: firstValue(createdTrip?.tripId, createdTrip?.id, createdTrip?.idPodrozy, tripData.id),
    organizerId,
    organizer: localTripData.organizer,
  };

  saveTripMetadata(mergedTrip);
  return normalizeTrip(mergedTrip);
}

export async function getOrganizerTrips(organizerId) {
  const trips = await apiRequest(`/trips/organizer/${getOrganizerId(organizerId)}`, {
    method: "GET",
  });

  if (!Array.isArray(trips)) {
    return [];
  }

  const normalizedTrips = await Promise.all(
    trips.map(async (trip) => {
      const tripId = firstValue(trip.id, trip.tripId, trip.idPodrozy);

      if (!tripId) {
        return normalizeTrip(trip);
      }

      try {
        const members = await getTripMembers(tripId);
        return normalizeTrip(trip, members);
      } catch (error) {
        console.warn("Nie udało się pobrać uczestników podróży:", error);
        return normalizeTrip(trip);
      }
    })
  );

  return normalizedTrips.filter(Boolean);
}

export async function getTripMembers(tripId) {
  const members = await apiRequest(`/trips/${tripId}/members`, {
    method: "GET",
  });

  return Array.isArray(members) ? members.map((member) => normalizeMember(member)) : [];
}

export async function getTripById(tripId) {
  const trip = await apiRequest(`/trips/${tripId}`, {
    method: "GET",
  });

  let members = [];

  try {
    members = await getTripMembers(tripId);
  } catch (error) {
    console.warn("Nie udało się pobrać uczestników podróży:", error);
  }

  return normalizeTrip(trip, members);
}

export async function updateTripStatus(tripId, status) {
  const updatedTrip = await apiRequest(`/trips/${tripId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return normalizeTrip(updatedTrip);
}

export async function getTripExpenses(tripId) {
  try {
    const expenses = await apiRequest(`/expenses/trip/${tripId}`, {
      method: "GET",
    });

    return Array.isArray(expenses) ? expenses.map(normalizeExpense) : [];
  } catch (error) {
    console.warn("Endpoint wydatków nie jest dostępny lub zwrócił błąd:", error);
    return [];
  }
}

export async function getInvitations() {
  return [];
}
