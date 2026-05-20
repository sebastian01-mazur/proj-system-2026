import { trips, expenses, invitations } from "../data/mockData";

export async function getTrips() {
  return trips;
}

export async function getTripById(id) {
  return trips.find((trip) => trip.id === Number(id));
}

export async function getTripExpenses(tripId) {
  return expenses.filter((expense) => expense.tripId === Number(tripId));
}

export async function getInvitations() {
  return invitations;
}

export async function createTrip(tripData) {
  const newTrip = {
    id: Date.now(),
    ...tripData,
    status: "Planowana",
    participants: ["Jan"],
  };

  return newTrip;
}