import { apiRequest } from "./apiConfig";
import { getCurrentUser } from "./authService";

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
  };

  return statuses[status] || status || "Planowane";
}

function normalizeMember(member) {
  if (typeof member === "string") {
    return member;
  }

  return (
      member?.name ||
      member?.fullName ||
      member?.userName ||
      member?.email ||
      member?.user?.name ||
      member?.user?.email ||
      "Uczestnik"
  );
}

function normalizeTrip(trip, members = []) {
  if (!trip) {
    return null;
  }

  const participants =
      trip.participants ||
      trip.members ||
      trip.tripMembers ||
      members ||
      [];

  return {
    ...trip,
    id: trip.id || trip.tripId,
    name: trip.name || trip.tripName || trip.country || "Podróż",
    country: trip.country || trip.destinationCountry || "Brak kraju",
    city: trip.city || "",
    status: normalizeStatus(trip.status),
    startDate: trip.startDate || trip.dateFrom || "",
    endDate: trip.endDate || trip.dateTo || "",
    budget: Number(trip.budget ?? trip.plannedBudget ?? 0),
    plannedBudget: Number(trip.plannedBudget ?? trip.budget ?? 0),
    currency: trip.currency || trip.baseCurrency || "EUR",
    baseCurrency: trip.baseCurrency || trip.currency || "EUR",
    participants: participants.map(normalizeMember),
    image:
        trip.image ||
        trip.imageUrl ||
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
  const createdTrip = await apiRequest("/trips", {
    method: "POST",
    body: JSON.stringify({
      organizerId: getOrganizerId(tripData.organizerId),
      country: tripData.country,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      baseCurrency: tripData.currency || tripData.baseCurrency,
      plannedBudget: Number(tripData.budget ?? tripData.plannedBudget ?? 0),
    }),
  });

  return normalizeTrip(createdTrip || tripData);
}

export async function getOrganizerTrips(organizerId) {
  const trips = await apiRequest(`/trips/organizer/${getOrganizerId(organizerId)}`, {
    method: "GET",
  });

  return Array.isArray(trips) ? trips.map((trip) => normalizeTrip(trip)) : [];
}

export async function getTripMembers(tripId) {
  const members = await apiRequest(`/trips/${tripId}/members`, {
    method: "GET",
  });

  return Array.isArray(members) ? members.map(normalizeMember) : [];
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
    const expenses = await apiRequest(`/expenses/trips/${tripId}`, {
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
