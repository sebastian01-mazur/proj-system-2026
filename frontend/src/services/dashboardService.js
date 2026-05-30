const API_URL = "http://localhost:8080/api";

export async function getDashboardData(userId) {
    const response = await fetch(`${API_URL}/dashboard/${userId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Nie udało się pobrać danych dashboardu.");
    }

    return response.json();
}