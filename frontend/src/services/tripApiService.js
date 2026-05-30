const API_URL = "http://localhost:8080/api";

export async function createTrip(tripData) {
  const response = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: tripData.name,
      country: tripData.country,
      city: tripData.city,
      baseCurrency: tripData.currency,
      plannedBudget: tripData.budget,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      imageUrl: tripData.image,
    }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się utworzyć podróży.");
  }

  return response.json();
}

export async function getOrganizerTrips(organizerId) {
  const response = await fetch(`${API_URL}/trips/organizer/${organizerId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać podróży organizatora.");
  }

  return response.json();
}

export async function getInvitations() {
  return [
    {
      id: 1,
      type: "friend",
      user: "Jan Kowalski",
    },
    {
      id: 2,
      type: "trip",
      user: "Anna Nowak",
      trip: "Weekend w Paryżu",
    },
  ];
}

export async function getTripById(tripId) {
  const response = await fetch(`${API_URL}/trips/${tripId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać szczegółów podróży.");
  }

  return response.json();
}

export async function getTripExpenses(tripId) {
  const response = await fetch(`${API_URL}/trips/${tripId}/expenses`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać wydatków podróży.");
  }

  return response.json();
}