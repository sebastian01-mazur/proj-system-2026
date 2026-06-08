import { apiRequest } from "./apiConfig";

export async function getDashboardData(userId) {
    return apiRequest(`/dashboard/${userId}`, {
        method: "GET",
    });
}
