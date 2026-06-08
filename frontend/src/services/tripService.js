import {
  trips as mockTrips,
  expenses as mockExpenses,
  invitations as mockInvitations,
} from "../data/mockData";

const TRIPS_KEY = "splittrip_trips";
const EXPENSES_KEY = "splittrip_expenses";
const INVITATIONS_KEY = "splittrip_invitations";
const FRIENDS_KEY = "splittrip_friends";
const SENT_INVITATIONS_KEY = "splittrip_sent_invitations";

function getFromStorage(key, fallbackValue) {
  const data = localStorage.getItem(key);

  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallbackValue));
    return fallbackValue;
  }

  try {
    return JSON.parse(data);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallbackValue));
    return fallbackValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStoredTrips() {
  return getFromStorage(TRIPS_KEY, mockTrips);
}

function getStoredInvitations() {
  return getFromStorage(INVITATIONS_KEY, mockInvitations);
}

export function normalizeExpense(expense) {
  const originalAmount = Number(expense.originalAmount ?? expense.amount ?? 0);
  const originalCurrency = expense.originalCurrency || expense.currency || "PLN";
  const baseCurrency = expense.baseCurrency || expense.currency || originalCurrency || "PLN";
  const exchangeRate = Number(expense.exchangeRate || 1);
  const convertedAmount = Number(
      expense.convertedAmount ?? Number((originalAmount * exchangeRate).toFixed(2))
  );

  return {
    id: expense.id,
    tripId: Number(expense.tripId),
    name: expense.name || expense.title || expense.category || "Wydatek",
    category: expense.category || "Inne",
    paidBy: expense.paidBy || "Nieznany użytkownik",
    originalAmount,
    originalCurrency,
    convertedAmount,
    baseCurrency,
    exchangeRate,
    expenseDate: expense.expenseDate || expense.date || "",
    description: expense.description || "",
    createdAt: expense.createdAt || expense.date || new Date().toISOString().slice(0, 10),
    split: expense.split || [],
  };
}

function getStoredExpenses() {
  const storedExpenses = getFromStorage(EXPENSES_KEY, mockExpenses);
  return storedExpenses.map(normalizeExpense);
}

export async function getTrips() {
  return getStoredTrips();
}

export async function getTripById(id) {
  return getStoredTrips().find((trip) => Number(trip.id) === Number(id));
}

export async function createTrip(tripData) {
  const currentTrips = getStoredTrips();

  const newTrip = {
    id: Date.now(),
    ...tripData,
    status: "Planowana",
    participants: ["Jan Kowalski"],
  };

  saveToStorage(TRIPS_KEY, [...currentTrips, newTrip]);
  return newTrip;
}

export async function getAllExpenses() {
  return getStoredExpenses();
}

export async function getTripExpenses(tripId) {
  return getStoredExpenses().filter(
      (expense) => Number(expense.tripId) === Number(tripId)
  );
}

export async function addExpense(tripId, expenseData) {
  const currentExpenses = getStoredExpenses();

  const newExpense = normalizeExpense({
    id: Date.now(),
    tripId: Number(tripId),
    ...expenseData,
  });

  saveToStorage(EXPENSES_KEY, [...currentExpenses, newExpense]);
  return newExpense;
}

export async function updateExpense(expenseId, updatedExpenseData) {
  const currentExpenses = getStoredExpenses();

  const updatedExpenses = currentExpenses.map((expense) =>
      Number(expense.id) === Number(expenseId)
          ? normalizeExpense({ ...expense, ...updatedExpenseData, id: expense.id })
          : expense
  );

  saveToStorage(EXPENSES_KEY, updatedExpenses);

  return updatedExpenses.find(
      (expense) => Number(expense.id) === Number(expenseId)
  );
}

export async function deleteExpense(expenseId) {
  const currentExpenses = getStoredExpenses();
  const updatedExpenses = currentExpenses.filter(
      (expense) => Number(expense.id) !== Number(expenseId)
  );

  saveToStorage(EXPENSES_KEY, updatedExpenses);
}

export async function getInvitations() {
  return getStoredInvitations();
}

export async function acceptInvitation(id) {
  const currentInvitations = getStoredInvitations();
  const acceptedInvitation = currentInvitations.find(
      (invitation) => Number(invitation.id) === Number(id)
  );

  if (!acceptedInvitation) {
    return null;
  }

  const updatedInvitations = currentInvitations.filter(
      (invitation) => Number(invitation.id) !== Number(id)
  );

  saveToStorage(INVITATIONS_KEY, updatedInvitations);

  if (acceptedInvitation.type === "friend") {
    const currentFriends = getFromStorage(FRIENDS_KEY, []);
    const friendAlreadyExists = currentFriends.some(
        (friend) => friend.name === acceptedInvitation.user
    );

    if (!friendAlreadyExists) {
      const newFriend = {
        id: Date.now(),
        name: acceptedInvitation.user,
        avatar: acceptedInvitation.avatar || "",
      };

      saveToStorage(FRIENDS_KEY, [...currentFriends, newFriend]);
    }
  }

  return acceptedInvitation;
}

export async function rejectInvitation(id) {
  const currentInvitations = getStoredInvitations();
  const updatedInvitations = currentInvitations.filter(
      (invitation) => Number(invitation.id) !== Number(id)
  );

  saveToStorage(INVITATIONS_KEY, updatedInvitations);
}

export async function sendFriendInvitation(email) {
  const sentInvitations = getFromStorage(SENT_INVITATIONS_KEY, []);

  const newInvitation = {
    id: Date.now(),
    type: "friend",
    email,
    status: "Wysłano zaproszenie do znajomych",
  };

  saveToStorage(SENT_INVITATIONS_KEY, [...sentInvitations, newInvitation]);
  return newInvitation;
}

export async function sendTripInvitation({ email, tripId }) {
  const trip = trips.find((trip) => Number(trip.id) === Number(tripId));
  const sentInvitations = getFromStorage(SENT_INVITATIONS_KEY, []);

  const newInvitation = {
    id: Date.now(),
    type: "trip",
    email,
    tripId: Number(tripId),
    trip: trip?.name || "Nieznana podróż",
    status: "oczekujące",
    sentAt: new Date().toISOString().slice(0, 10),
  };

  saveToStorage(SENT_INVITATIONS_KEY, [...sentInvitations, newInvitation]);

  return newInvitation;
}

export async function getFriends() {
  return getFromStorage(FRIENDS_KEY, []);
}
